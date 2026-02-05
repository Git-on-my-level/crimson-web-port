import Phaser from 'phaser';
import type { SimState } from '../../sim/state';
import type { EntityId } from '../../sim/types';
import { type BonusId } from '../../content/bonuses';
import type { WeaponId } from '../../content/weapons';
import { BONUS_FRAMES, PROJECTILE_FRAMES } from '../../content/atlas';
import { rotationFromVelocity } from '../../render/facing';

export type RenderTransform = {
  originX: number;
  originY: number;
  pixelsPerUnit: number;
};

const PROJECTILE_SPRITE_KEY = 'game-projs-grid4';
const BONUS_SPRITE_KEY = 'game-bonuses-grid4';
const PLAYER_SPRITE_KEY = 'game-trooper';
const UI_CURSOR_KEY = 'ui-cursor';
const UI_AIM_KEY = 'ui-aim';

const CREATURE_SPRITE_BY_KIND: Record<string, string> = {
  grunt: 'game-zombie',
  runner: 'game-alien',
  tank: 'game-bodyset',
};

const PROJECTILE_FRAME_BY_WEAPON: Record<WeaponId, number> = PROJECTILE_FRAMES;
const BONUS_FRAME_BY_KIND: Record<BonusId, number> = BONUS_FRAMES;
const PROJECTILE_ROTATION_OFFSET_BY_WEAPON: Partial<Record<WeaponId, number>> = {};

export class PhaserRenderAdapter {
  private readonly scene: Phaser.Scene;
  private player?: Phaser.GameObjects.Sprite;
  private readonly creatures = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly projectiles = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly bonuses = new Map<EntityId, Phaser.GameObjects.Sprite>();
  private readonly projectileSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly creatureSpritePool: Phaser.GameObjects.Sprite[] = [];
  private readonly bonusSpritePool: Phaser.GameObjects.Sprite[] = [];
  private cursorSprite?: Phaser.GameObjects.Image;
  private aimSprite?: Phaser.GameObjects.Image;
  private transform: RenderTransform;
  private debugCollisionEnabled = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, transform: RenderTransform) {
    this.scene = scene;
    this.transform = transform;
  }

  setTransform(transform: RenderTransform): void {
    this.transform = transform;
  }

  render(state: SimState): void {
    this.ensurePlayer(state);
    this.ensureAimIndicators(state);
    this.syncEntities(
      state.creatures,
      this.creatures,
      this.creatureSpritePool,
      (entry) => entry.radius ?? 1,
      (entry) => entry.alive,
    );
    this.syncProjectiles(state.projectiles);
    this.syncBonuses(state.bonuses);
    this.renderCollisionDebug(state);
  }

  private ensurePlayer(state: SimState): void {
    if (!this.player) {
      this.player = this.scene.add.sprite(0, 0, PLAYER_SPRITE_KEY);
      this.player.setOrigin(0.5);
      this.player.setDepth(500);
      this.scene.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    }
    const { x, y } = this.toScreen(state.player.pos.x, state.player.pos.y);
    this.player.setPosition(x, y);
    const size = state.player.radius * 2 * this.transform.pixelsPerUnit;
    this.player.setDisplaySize(size, size);
    this.player.setRotation(state.player.aimAngle);
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

  private syncBonuses(bonuses: SimState['bonuses']): void {
    const seen = new Set<EntityId>();
    const radius = 0.6;

    for (const bonus of bonuses) {
      if (!bonus.active) {
        continue;
      }
      seen.add(bonus.id);
      const frame = BONUS_FRAME_BY_KIND[bonus.kind];
      const obj =
        this.bonuses.get(bonus.id) ??
        this.createSprite(this.bonuses, this.bonusSpritePool, bonus.id, BONUS_SPRITE_KEY, frame);
      const { x, y } = this.toScreen(bonus.pos.x, bonus.pos.y);
      obj.setPosition(x, y);
      obj.setDisplaySize(radius * 2 * this.transform.pixelsPerUnit, radius * 2 * this.transform.pixelsPerUnit);
      obj.setVisible(true);
    }

    for (const [id, obj] of this.bonuses) {
      if (!seen.has(id)) {
        obj.setVisible(false);
        this.bonuses.delete(id);
        this.bonusSpritePool.push(obj);
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
      const frame = PROJECTILE_FRAME_BY_WEAPON[projectile.kind as WeaponId] ?? fallbackFrame;
      const rotationOffset = PROJECTILE_ROTATION_OFFSET_BY_WEAPON[projectile.kind as WeaponId] ?? 0;
      const obj =
        this.projectiles.get(projectile.id) ??
        this.createSprite(this.projectiles, this.projectileSpritePool, projectile.id, PROJECTILE_SPRITE_KEY, frame);
      const { x, y } = this.toScreen(projectile.pos.x, projectile.pos.y);
      obj.setPosition(x, y);
      obj.setDisplaySize(projectile.radius * 2 * this.transform.pixelsPerUnit, projectile.radius * 2 * this.transform.pixelsPerUnit);
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

  private ensureAimIndicators(state: SimState): void {
    if (!this.cursorSprite) {
      this.scene.input.setDefaultCursor('none');
      this.cursorSprite = this.scene.add.image(0, 0, UI_CURSOR_KEY);
      this.cursorSprite.setOrigin(0.5);
      this.cursorSprite.setScrollFactor(0);
      this.cursorSprite.setDepth(1100);
    }

    if (!this.aimSprite) {
      this.aimSprite = this.scene.add.image(0, 0, UI_AIM_KEY);
      this.aimSprite.setOrigin(0.5);
      this.aimSprite.setScrollFactor(0);
      this.aimSprite.setDepth(1090);
    }

    const pointer = this.scene.input.activePointer;
    this.cursorSprite.setPosition(pointer.x, pointer.y);

    const aimDistance = 3;
    const aimX = state.player.pos.x + state.player.aimDir.x * aimDistance;
    const aimY = state.player.pos.y + state.player.aimDir.y * aimDistance;
    const aimScreen = this.toScreen(aimX, aimY);
    this.aimSprite.setPosition(aimScreen.x, aimScreen.y);
    this.aimSprite.setRotation(state.player.aimAngle);
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
  }
}
