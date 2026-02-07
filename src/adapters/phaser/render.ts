import Phaser from 'phaser';
import type { SimState } from '../../sim/state';
import type { EntityId } from '../../sim/types';
import { type BonusId } from '../../content/bonuses';
import { getModifierDef } from '../../content/modifiers';
import { BONUS_FRAMES, PROJECTILE_FRAMES } from '../../content/atlas';
import { WEAPON_BY_ID } from '../../content/weapons';
import { rotationFromVelocity } from '../../render/facing';
import { computeFadeAlpha, computePulseScale } from '../../render/bonusAnim';
import { computeDisplaySize } from '../../render/scale';
import { getHazardDef } from '../../content/hazards';

export type RenderTransform = {
  originX: number;
  originY: number;
  pixelsPerUnit: number;
};

const PROJECTILE_SPRITE_KEY = 'game-projs-grid4';
const PARTICLE_SPRITE_KEY = 'game-particles-grid8';
const BONUS_SPRITE_KEY = 'game-bonuses-grid4';
const WEAPON_ICON_SPRITE_KEY = 'ui-wicons-grid2x1';
const PLAYER_SPRITE_KEY = 'game-trooper';
const PLAYER_SPRITE_FRAME = 16;
const PLAYER_ROTATION_OFFSET = Math.PI / 2;
const PLAYER_VISUAL_SCALE = 1.4;
const PLAYER_MIN_PIXEL_SIZE = 24;
const PLAYER_OUTLINE_SCALE = 1.12;
const PLAYER_TINT = 0x72e5ff;
const PLAYER_OUTLINE_TINT = 0x0b0b0b;
const BONUS_BUBBLE_FRAME = 0;
const BONUS_BUBBLE_SCALE = 1.12;
const BONUS_ICON_ROTATION_AMPLITUDE = 0.12;
const BONUS_ICON_ROTATION_SPEED = 1.7;
const BONUS_ICON_TIME_OFFSET = 0.19;
const WEAPON_ICON_MAX_INDEX = 31;
const WEAPON_ICON_WIDTH_SCALE = 1.875;
const WEAPON_ICON_HEIGHT_SCALE = 0.9375;
const CREATURE_LABEL_FONT_SIZE = 14;
const CREATURE_LABEL_OFFSET_Y = 2.0;
const CREATURE_LABEL_COLOR = 0xf1f5f9;
const CREATURE_LABEL_STROKE_COLOR = 0x0f172a;
const CREATURE_LABEL_STROKE_THICKNESS = 3;

const CREATURE_SPRITE_BY_KIND: Record<string, string> = {
  grunt: 'game-zombie',
  runner: 'game-alien',
  tank: 'game-bodyset',
};

const PROJECTILE_FRAME_BY_KIND: Record<string, number> = {
  ...PROJECTILE_FRAMES,
  fire_bullets: 5,
  fireblast: 4,
};
const BONUS_FRAME_BY_KIND: Record<BonusId, number> = BONUS_FRAMES;
const PROJECTILE_ROTATION_OFFSET_BY_KIND: Record<string, number> = {};
const SECONDARY_PROJECTILE_FRAME_BY_TYPE: Record<number, number> = {
  1: 1,
  2: 1,
  4: 1,
};

type BonusSprites = {
  bubble: Phaser.GameObjects.Sprite;
  icon: Phaser.GameObjects.Sprite;
};

export class PhaserRenderAdapter {
  private readonly scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Sprite;
  private playerOutline?: Phaser.GameObjects.Sprite;
  private readonly creatures = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly creatureLabels = new Map<EntityId, Phaser.GameObjects.Text>();
  private readonly projectiles = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly secondaryProjectiles = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly particles = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly bonuses = new Map<EntityId, BonusSprites>();
  private readonly hazards = new Map<EntityId, Phaser.GameObjects.Graphics>();
  private readonly modifierIndicators = new Map<EntityId, Phaser.GameObjects.Graphics>();
  private readonly projectileSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly secondaryProjectileSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly particleSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly creatureSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly creatureLabelPool: Phaser.GameObjects.Text[] = [];
  private readonly bonusSpritePool: BonusSprites[] = [];
  private readonly hazardGraphicsPool: Phaser.GameObjects.Graphics[] = [];
  private readonly modifierGraphicsPool: Phaser.GameObjects.Graphics[] = [];
  private cursorConfigured = false;
  private transform: RenderTransform;
  private debugCollisionEnabled = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private bonusAnimTimeSeconds = 0;

  constructor(scene: Phaser.Scene, transform: RenderTransform) {
    this.scene = scene;
    this.transform = transform;
  }

  setTransform(transform: RenderTransform): void {
    this.transform = transform;
  }

  render(state: SimState): void {
    const deltaSeconds = Math.max(0, this.scene.game.loop.delta) / 1000;
    this.bonusAnimTimeSeconds += deltaSeconds;
    this.ensurePlayer(state);
    this.ensureAimIndicators();
    this.syncEntities(
      state.creatures,
      this.creatures,
      this.creatureSpritePool,
      (entry) => entry.radius ?? 1,
      (entry) => entry.alive,
    );
    this.syncParticles(state.particles);
    this.syncCreatureLabels(state.creatures);
    this.syncParticles(state.particles);
    this.syncProjectiles(state.projectiles);
    this.syncSecondaryProjectiles(state.secondaryProjectiles);
    this.syncBonuses(state.bonuses);
    this.syncHazards(state.hazards);
    this.syncModifiers(state.modifiers);
    this.renderCollisionDebug(state);
  }

  private ensurePlayer(state: SimState): void {
    if (!this.player) {
      this.player = this.scene.add.sprite(0, 0, PLAYER_SPRITE_KEY, PLAYER_SPRITE_FRAME);
      this.player.setOrigin(0.5);
      this.player.setDepth(600);
      this.player.setTint(PLAYER_TINT);
      this.playerOutline = this.scene.add.sprite(0, 0, PLAYER_SPRITE_KEY, PLAYER_SPRITE_FRAME);
      this.playerOutline.setOrigin(0.5);
      this.playerOutline.setDepth(590);
      this.playerOutline.setTint(PLAYER_OUTLINE_TINT);
      this.scene.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    }
    if (!this.playerOutline) {
      this.playerOutline = this.scene.add.sprite(0, 0, PLAYER_SPRITE_KEY, PLAYER_SPRITE_FRAME);
      this.playerOutline.setOrigin(0.5);
      this.playerOutline.setDepth(590);
      this.playerOutline.setTint(PLAYER_OUTLINE_TINT);
    }
    const { x, y } = this.toScreen(state.player.pos.x, state.player.pos.y);
    this.player.setPosition(x, y);
    const size = computeDisplaySize(
      state.player.radius,
      this.transform.pixelsPerUnit,
      PLAYER_VISUAL_SCALE,
      PLAYER_MIN_PIXEL_SIZE,
    );
    this.player.setDisplaySize(size, size);
    this.player.setRotation(state.player.aimAngle + PLAYER_ROTATION_OFFSET);
    this.playerOutline.setPosition(x, y);
    this.playerOutline.setDisplaySize(size * PLAYER_OUTLINE_SCALE, size * PLAYER_OUTLINE_SCALE);
    this.playerOutline.setRotation(state.player.aimAngle + PLAYER_ROTATION_OFFSET);
  }

  private syncEntities<T extends { id: EntityId; pos: { x: number; y: number } }>(
    entries: T[],
    map: Map<EntityId, Phaser.GameObjects.Sprite>,
    pool: Phaser.GameObjects.Sprite[],
    radius: number | ((entry: T) => number),
    isActive: (entry: T) => boolean,
  ): void {
    const seen = new Set<EntityId>();

    for (const entry of entries) {
      if (!isActive(entry)) {
        continue;
      }
      seen.add(entry.id);
      const obj = map.get(entry.id) ?? this.createCreatureSprite(map, pool, entry.id, entry as { kind?: string });
      const { x, y } = this.toScreen(entry.pos.x, entry.pos.y);
      obj.setPosition(x, y);
      const entryRadius = typeof radius === 'function' ? radius(entry) : radius;
      obj.setDisplaySize(entryRadius * 2 * this.transform.pixelsPerUnit, entryRadius * 2 * this.transform.pixelsPerUnit);
      if ('vel' in entry) {
        const vel = entry.vel as { x: number; y: number };
        const speedSq = vel.x * vel.x + vel.y * vel.y;
        if (speedSq > 0.0001) {
          obj.setRotation(Math.atan2(vel.y, vel.x));
        }
      }
      obj.setVisible(true);
    }

    for (const [id, obj] of map) {
      if (!seen.has(id)) {
        obj.setVisible(false);
        map.delete(id);
        pool.push(obj);
      }
    }
  }

  private syncCreatureLabels(creatures: SimState['creatures']): void {
    const seen = new Set<EntityId>();

    for (const creature of creatures) {
      if (!creature.alive) {
        continue;
      }
      if (!creature.label) {
        continue;
      }
      seen.add(creature.id);
      const label = this.creatureLabels.get(creature.id) ?? this.createCreatureLabel(creature.id, creature.label);
      const { x, y } = this.toScreen(creature.pos.x, creature.pos.y);
      const offsetY = CREATURE_LABEL_OFFSET_Y * this.transform.pixelsPerUnit;
      label.setPosition(x, y - offsetY);
      label.setVisible(true);
    }

    for (const [id, label] of this.creatureLabels) {
      if (!seen.has(id)) {
        label.setVisible(false);
        this.creatureLabels.delete(id);
        this.creatureLabelPool.push(label);
      }
    }
  }

  private syncBonuses(bonuses: SimState['bonuses']): void {
    const seen = new Set<EntityId>();
    const radius = 0.6;
    const baseSize = radius * 2 * this.transform.pixelsPerUnit;
    const bubbleSize = baseSize * BONUS_BUBBLE_SCALE;
    const tSeconds = this.bonusAnimTimeSeconds;

    for (const bonus of bonuses) {
      if (!bonus.active) {
        continue;
      }
      seen.add(bonus.id);
      const weaponIconIndex =
        bonus.kind === 'weapon' ? (bonus.weaponId ? WEAPON_BY_ID[bonus.weaponId]?.iconIndex ?? null : null) : null;
      const usesWeaponIcon =
        bonus.kind === 'weapon' && weaponIconIndex !== null && weaponIconIndex >= 0 && weaponIconIndex <= WEAPON_ICON_MAX_INDEX;
      const showIcon = bonus.kind !== 'weapon' || usesWeaponIcon;
      const frame = usesWeaponIcon ? weaponIconIndex : BONUS_FRAME_BY_KIND[bonus.kind] ?? BONUS_BUBBLE_FRAME;
      const iconTextureKey = usesWeaponIcon ? WEAPON_ICON_SPRITE_KEY : BONUS_SPRITE_KEY;
      const sprites = this.bonuses.get(bonus.id) ?? this.createBonusSprites(bonus.id, iconTextureKey, frame);
      const { x, y } = this.toScreen(bonus.pos.x, bonus.pos.y);
      const lifeMaxTicks = bonus.lifeTicksMax ?? bonus.lifeTicksRemaining;
      const alpha = computeFadeAlpha(bonus.lifeTicksRemaining, lifeMaxTicks);
      const timeOffset = bonus.id * BONUS_ICON_TIME_OFFSET;
      const pulse = computePulseScale(tSeconds + timeOffset);
      const rotation = usesWeaponIcon
        ? 0
        : Math.sin((tSeconds + timeOffset) * BONUS_ICON_ROTATION_SPEED) * BONUS_ICON_ROTATION_AMPLITUDE;

      sprites.bubble.setPosition(x, y);
      sprites.bubble.setDisplaySize(bubbleSize, bubbleSize);
      sprites.bubble.setAlpha(alpha);
      sprites.bubble.setVisible(true);

      sprites.icon.setPosition(x, y);
      if (showIcon) {
        sprites.icon.setTexture(iconTextureKey, frame);
        if (usesWeaponIcon) {
          sprites.icon.setDisplaySize(baseSize * pulse * WEAPON_ICON_WIDTH_SCALE, baseSize * pulse * WEAPON_ICON_HEIGHT_SCALE);
        } else {
          sprites.icon.setDisplaySize(baseSize * pulse, baseSize * pulse);
        }
        sprites.icon.setAlpha(alpha);
        sprites.icon.setRotation(rotation);
        sprites.icon.setVisible(true);
      } else {
        sprites.icon.setVisible(false);
      }
    }

    for (const [id, sprites] of this.bonuses) {
      if (!seen.has(id)) {
        sprites.bubble.setVisible(false);
        sprites.icon.setVisible(false);
        this.bonuses.delete(id);
        this.bonusSpritePool.push(sprites);
      }
    }
  }

  private syncHazards(hazards: SimState['hazards']): void {
    const seen = new Set<EntityId>();

    for (const hazard of hazards) {
      if (!hazard.alive) {
        continue;
      }
      seen.add(hazard.id);
      const def = getHazardDef(hazard.kind);
      const graphics =
        this.hazards.get(hazard.id) ?? this.createHazardGraphics(hazard.id);
      const { x, y } = this.toScreen(hazard.pos.x, hazard.pos.y);
      const radiusPixels = hazard.radius * this.transform.pixelsPerUnit;

      graphics.clear();
      graphics.lineStyle(2, def.color, 0.8);
      graphics.fillStyle(def.color, 0.3);
      graphics.fillCircle(x, y, radiusPixels);
      graphics.strokeCircle(x, y, radiusPixels);

      const alpha = hazard.lifeTicksRemaining / hazard.lifeTicksMax;
      graphics.setAlpha(alpha);
      graphics.setVisible(true);
    }

    for (const [id, graphics] of this.hazards) {
      if (!seen.has(id)) {
        graphics.setVisible(false);
        this.hazards.delete(id);
        this.hazardGraphicsPool.push(graphics);
      }
    }
  }

  private syncModifiers(modifiers: SimState['modifiers']): void {
    const seen = new Set<EntityId>();

    for (const modifier of modifiers) {
      seen.add(modifier.id);
      const def = getModifierDef(modifier.kind);
      const graphics =
        this.modifierIndicators.get(modifier.id) ?? this.createModifierIndicator(modifier.id);
      const { x, y } = this.toScreen(this.player?.x ?? 0, this.player?.y ?? 0);
      const baseSize = 16;
      const alpha = 0.7 + Math.sin(this.bonusAnimTimeSeconds * 2) * 0.2;

      graphics.clear();
      graphics.fillStyle(def.color, 0.9);
      graphics.fillCircle(x, y, baseSize);
      graphics.lineStyle(2, def.color, 1.0);
      graphics.strokeCircle(x, y, baseSize);

      graphics.setAlpha(alpha);
      graphics.setVisible(true);
    }

    for (const [id, graphics] of this.modifierIndicators) {
      if (!seen.has(id)) {
        graphics.setVisible(false);
        this.modifierIndicators.delete(id);
        this.modifierGraphicsPool.push(graphics);
      }
    }
  }

  private syncProjectiles(projectiles: SimState['projectiles']): void {
    const seen = new Set<EntityId>();
    const fallbackFrame = 0;

    for (const projectile of projectiles) {
      if (!projectile.alive) {
        continue;
      }
      seen.add(projectile.id);
      const frame = PROJECTILE_FRAME_BY_KIND[projectile.kind] ?? fallbackFrame;
      const rotationOffset = PROJECTILE_ROTATION_OFFSET_BY_KIND[projectile.kind] ?? 0;
      const obj =
        this.projectiles.get(projectile.id) ??
        this.createSprite(this.projectiles, this.projectileSpritePool, projectile.id, PROJECTILE_SPRITE_KEY, frame);
      const { x, y } = this.toScreen(projectile.pos.x, projectile.pos.y);
      obj.setPosition(x, y);
      obj.setDisplaySize(projectile.radius * 2 * this.transform.pixelsPerUnit, projectile.radius * 2 * this.transform.pixelsPerUnit);
      obj.setDepth(450);
      obj.setRotation(rotationFromVelocity(projectile.vel.x, projectile.vel.y) + rotationOffset);
      obj.setVisible(true);
    }

    for (const [id, obj] of this.projectiles) {
      if (!seen.has(id)) {
        obj.setVisible(false);
        this.projectiles.delete(id);
        this.projectileSpritePool.push(obj);
      }
    }
  }

  private syncSecondaryProjectiles(projectiles: SimState['secondaryProjectiles']): void {
    const seen = new Set<EntityId>();
    const fallbackFrame = 1;

    for (const projectile of projectiles) {
      if (!projectile.alive) {
        continue;
      }
      seen.add(projectile.id);
      const frame = SECONDARY_PROJECTILE_FRAME_BY_TYPE[projectile.typeId] ?? fallbackFrame;
      const obj =
        this.secondaryProjectiles.get(projectile.id) ??
        this.createSprite(
          this.secondaryProjectiles,
          this.secondaryProjectileSpritePool,
          projectile.id,
          PROJECTILE_SPRITE_KEY,
          frame,
        );
      const { x, y } = this.toScreen(projectile.pos.x, projectile.pos.y);
      obj.setPosition(x, y);
      obj.setDisplaySize(projectile.radius * 2 * this.transform.pixelsPerUnit, projectile.radius * 2 * this.transform.pixelsPerUnit);
      obj.setDepth(440);
      obj.setRotation(rotationFromVelocity(projectile.vel.x, projectile.vel.y));
      obj.setVisible(true);
    }

    for (const [id, obj] of this.secondaryProjectiles) {
      if (!seen.has(id)) {
        obj.setVisible(false);
        this.secondaryProjectiles.delete(id);
        this.secondaryProjectileSpritePool.push(obj);
      }
    }
  }

  private syncParticles(particles: SimState['particles']): void {
    const seen = new Set<EntityId>();

    for (const particle of particles) {
      if (!particle.alive) {
        continue;
      }
      seen.add(particle.id);
      const frame = particle.styleId;
      const obj =
        this.particles.get(particle.id) ??
        this.createSprite(this.particles, this.particleSpritePool, particle.id, PARTICLE_SPRITE_KEY, frame);
      const { x, y } = this.toScreen(particle.pos.x, particle.pos.y);
      obj.setPosition(x, y);
      obj.setDisplaySize(particle.radius * 2 * this.transform.pixelsPerUnit, particle.radius * 2 * this.transform.pixelsPerUnit);
      obj.setDepth(420);
      obj.setRotation(rotationFromVelocity(particle.vel.x, particle.vel.y));
      obj.setVisible(true);
    }

    for (const [id, obj] of this.particles) {
      if (!seen.has(id)) {
        obj.setVisible(false);
        this.particles.delete(id);
        this.particleSpritePool.push(obj);
      }
    }
  }

  private createCreatureSprite(
    map: Map<EntityId, Phaser.GameObjects.Sprite>,
    pool: Phaser.GameObjects.Sprite[],
    id: EntityId,
    entry: { kind?: string },
  ): Phaser.GameObjects.Sprite {
    let sprite: Phaser.GameObjects.Sprite;
    const textureKey = CREATURE_SPRITE_BY_KIND[entry.kind ?? ''] ?? 'game-zombie';

    if (pool.length > 0) {
      sprite = pool.pop()!;
      sprite.setTexture(textureKey, 0);
    } else {
      sprite = this.scene.add.sprite(0, 0, textureKey);
      sprite.setOrigin(0.5);
      sprite.setDepth(400);
    }

    map.set(id, sprite);
    return sprite;
  }

  private createCreatureLabel(id: EntityId, text: string): Phaser.GameObjects.Text {
    let label: Phaser.GameObjects.Text;

    if (this.creatureLabelPool.length > 0) {
      label = this.creatureLabelPool.pop()!;
      label.setText(text);
    } else {
      label = this.scene.add.text(0, 0, text, {
        fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
        fontSize: `${CREATURE_LABEL_FONT_SIZE}px`,
        color: CREATURE_LABEL_COLOR.toString(),
        fontStyle: 'bold',
        align: 'center',
        stroke: CREATURE_LABEL_STROKE_COLOR.toString(),
        strokeThickness: CREATURE_LABEL_STROKE_THICKNESS,
      });
      label.setOrigin(0.5);
      label.setDepth(410);
    }

    this.creatureLabels.set(id, label);
    return label;
  }

  private createSprite(
    map: Map<EntityId, Phaser.GameObjects.Sprite>,
    pool: Phaser.GameObjects.Sprite[],
    id: EntityId,
    textureKey: string,
    frame: number,
  ): Phaser.GameObjects.Sprite {
    let sprite: Phaser.GameObjects.Sprite;

    if (pool.length > 0) {
      sprite = pool.pop()!;
      sprite.setTexture(textureKey, frame);
    } else {
      sprite = this.scene.add.sprite(0, 0, textureKey, frame);
      sprite.setOrigin(0.5);
    }

    map.set(id, sprite);
    return sprite;
  }

  private createBonusSprites(id: EntityId, iconTextureKey: string, frame: number): BonusSprites {
    let sprites: BonusSprites;

    if (this.bonusSpritePool.length > 0) {
      sprites = this.bonusSpritePool.pop()!;
      sprites.bubble.setTexture(BONUS_SPRITE_KEY, BONUS_BUBBLE_FRAME);
      sprites.icon.setTexture(iconTextureKey, frame);
    } else {
      const bubble = this.scene.add.sprite(0, 0, BONUS_SPRITE_KEY, BONUS_BUBBLE_FRAME);
      bubble.setOrigin(0.5);
      bubble.setDepth(340);
      const icon = this.scene.add.sprite(0, 0, iconTextureKey, frame);
      icon.setOrigin(0.5);
      icon.setDepth(350);
      sprites = { bubble, icon };
    }

    this.bonuses.set(id, sprites);
    return sprites;
  }

  private createHazardGraphics(id: EntityId): Phaser.GameObjects.Graphics {
    let graphics: Phaser.GameObjects.Graphics;

    if (this.hazardGraphicsPool.length > 0) {
      graphics = this.hazardGraphicsPool.pop()!;
      graphics.clear();
    } else {
      graphics = this.scene.add.graphics();
      graphics.setDepth(320);
    }

    this.hazards.set(id, graphics);
    return graphics;
  }

  private createModifierIndicator(id: EntityId): Phaser.GameObjects.Graphics {
    let graphics: Phaser.GameObjects.Graphics;

    if (this.modifierGraphicsPool.length > 0) {
      graphics = this.modifierGraphicsPool.pop()!;
      graphics.clear();
    } else {
      graphics = this.scene.add.graphics();
      graphics.setDepth(280);
    }

    this.modifierIndicators.set(id, graphics);
    return graphics;
  }

  private ensureAimIndicators(): void {
    if (!this.cursorConfigured) {
      this.scene.input.setDefaultCursor('crosshair');
      this.cursorConfigured = true;
    }
  }

  private toScreen(simX: number, simY: number): { x: number; y: number } {
    return {
      x: this.transform.originX + simX * this.transform.pixelsPerUnit,
      y: this.transform.originY + simY * this.transform.pixelsPerUnit,
    };
  }

  toggleCollisionDebug(): void {
    this.setCollisionDebugEnabled(!this.debugCollisionEnabled);
  }

  setCollisionDebugEnabled(enabled: boolean): void {
    this.debugCollisionEnabled = enabled;
    if (!enabled && this.debugGraphics) {
      this.debugGraphics.clear();
      this.debugGraphics.setVisible(false);
    }
  }

  private renderCollisionDebug(state: SimState): void {
    if (!this.debugCollisionEnabled) {
      return;
    }
    if (!this.debugGraphics) {
      this.debugGraphics = this.scene.add.graphics();
      this.debugGraphics.setDepth(950);
    }
    this.debugGraphics.setVisible(true);
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0xf8fafc, 0.6);

    const drawCircle = (x: number, y: number, radius: number) => {
      const screen = this.toScreen(x, y);
      this.debugGraphics?.strokeCircle(screen.x, screen.y, radius * this.transform.pixelsPerUnit);
    };

    drawCircle(state.player.pos.x, state.player.pos.y, state.player.radius);
    for (const creature of state.creatures) {
      if (creature.alive) {
        drawCircle(creature.pos.x, creature.pos.y, creature.radius);
      }
    }
    state.projectilePool.forEachActive((_id, proj) => {
      if (proj.alive) {
        drawCircle(proj.pos.x, proj.pos.y, proj.radius);
      }
    });
    for (const hazard of state.hazards) {
      if (hazard.alive) {
        drawCircle(hazard.pos.x, hazard.pos.y, hazard.radius);
      }
    }
  }
}
