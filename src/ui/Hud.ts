import Phaser from 'phaser';
import { WEAPON_BY_ID } from '../content/weapons';
import { getBonusDef, type BonusId } from '../content/bonuses';
import { BONUS_FRAMES, WEAPON_FRAMES } from '../content/atlas';
import { getPerkDef, type PerkId } from '../content/perks';
import type { SimState } from '../sim/state';
import { xpForLevelStart } from '../sim/xp';

export class Hud {
  private hpText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private xpText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
  private weaponIcon: Phaser.GameObjects.Sprite;
  private pauseText: Phaser.GameObjects.Text;
  private entityCountText?: Phaser.GameObjects.Text;
  private activeBonusesText: Phaser.GameObjects.Text;
  private perksText: Phaser.GameObjects.Text;
  private pendingPerksText: Phaser.GameObjects.Text;
  private readonly activeBonusIcons: Phaser.GameObjects.Sprite[] = [];
  private readonly activeBonusIconPool: Phaser.GameObjects.Sprite[] = [];
  private readonly bonusIconOrigin: { x: number; y: number };
  private pauseMenuActive = false;

  constructor(scene: Phaser.Scene, showDebugInfo = false) {
    const { width, height } = scene.scale;
    const padding = 16;

    const style = {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 3,
    };

    this.hpText = scene.add.text(padding, padding, '', style)
      .setScrollFactor(0)
      .setDepth(1000);

    this.levelText = scene.add.text(padding, padding + 24, '', style)
      .setScrollFactor(0)
      .setDepth(1000);

    this.xpText = scene.add.text(padding, padding + 48, '', style)
      .setScrollFactor(0)
      .setDepth(1000);

    this.scoreText = scene.add.text(width / 2, padding, '', style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.weaponText = scene.add.text(width - padding, padding + 2, '', style)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.weaponIcon = scene.add.sprite(width - padding, padding, 'game-projs-grid4', 0)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setDisplaySize(24, 24)
      .setVisible(false);

    this.pauseText = scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '48px',
      color: '#f8fafc',
      align: 'center',
      stroke: '#0f172a',
      strokeThickness: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      padding: { x: 24, y: 16 },
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    if (showDebugInfo) {
      this.entityCountText = scene.add.text(width - padding, height - padding, '', {
        ...style,
        fontSize: '14px',
        color: '#64748b',
        strokeThickness: 2,
      })
        .setOrigin(1, 1)
        .setScrollFactor(0)
        .setDepth(1000);
    }

    const bonusStyle = {
      ...style,
      fontSize: '14px',
    };
    this.bonusIconOrigin = { x: padding, y: padding + 72 };

    this.activeBonusesText = scene.add.text(padding, padding + 96, '', bonusStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    this.perksText = scene.add.text(padding, padding + 120, '', bonusStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    this.pendingPerksText = scene.add.text(padding, padding + 144, '', bonusStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    scene.scale.on('resize', this.handleResize, this);
  }

  update(state: SimState): void {
    const hpDisplay = Math.max(0, Math.round(state.player.hp));
    this.hpText.setText(`HP: ${hpDisplay}/${state.player.hpMax}`);

    this.levelText.setText(`Level: ${state.player.level}`);
    const xp = Math.floor(state.player.xp);
    const xpIntoLevel = Math.max(0, xp - Math.floor(xpForLevelStart(state.player.level)));
    const xpToNext = Math.max(1, Math.floor(state.player.xpToNext));
    this.xpText.setText(`XP: ${xpIntoLevel}/${xpToNext}`);

    const scoreDisplay = Math.round(state.score);
    this.scoreText.setText(`Score: ${scoreDisplay}`);

    const weapon = WEAPON_BY_ID[state.player.weaponId];
    if (weapon) {
      const frame = WEAPON_FRAMES[weapon.id] ?? 0;
      this.weaponIcon.setTexture('game-projs-grid4', frame);
      this.weaponIcon.setVisible(true);

      if (weapon.ammoMax !== undefined) {
        const ammo = Math.max(0, state.player.ammo);
        const reloadTag = state.player.reloadTimer > 0 ? ' (Reloading)' : '';
        this.weaponText.setText(`${weapon.name} ${ammo}/${weapon.ammoMax}${reloadTag}`);
      } else {
        this.weaponText.setText(weapon.name ?? 'Unknown');
      }
    } else {
      this.weaponIcon.setVisible(false);
      this.weaponText.setText('Weapon');
    }

    const isPaused = state.phase === 'Paused';
    this.pauseText.setVisible(isPaused && !this.pauseMenuActive);

    if (this.entityCountText) {
      const creatureCount = state.creatures.length;
      const projectileCount = state.projectiles.length;
      this.entityCountText.setText(`Enemies: ${creatureCount} | Projectiles: ${projectileCount}`);
    }

    const activeBonuses = Object.entries(state.player.activeEffects)
      .filter(([_, ticks]) => ticks > 0)
      .map(([bonusId, ticks]) => {
        const def = getBonusDef(bonusId as any);
        const secondsRemaining = Math.ceil(ticks / 60);
        return `${def.name} (${secondsRemaining}s)`;
      });

    if (activeBonuses.length > 0) {
      this.activeBonusesText.setText(activeBonuses.join(' | '));
    } else {
      this.activeBonusesText.setText('');
    }

    this.updateActiveBonusIcons(state);

    const perkEntries = Object.entries(state.player.perks)
      .filter(([_, count]) => (count ?? 0) > 0)
      .map(([perkId, count]) => {
        const def = getPerkDef(perkId as PerkId);
        if (!def) return '';
        return `${def.name} x${count}`;
      });

    if (perkEntries.length > 0) {
      this.perksText.setText(`Perks: ${perkEntries.join(' | ')}`);
    } else {
      this.perksText.setText('');
    }

    if (state.pendingPerks > 0 && state.phase === 'Playing') {
      const label = state.pendingPerks === 1 ? 'perk' : 'perks';
      this.pendingPerksText.setText(`Pending ${label}: ${state.pendingPerks} (Press Tab)`);
    } else {
      this.pendingPerksText.setText('');
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    const padding = 16;

    this.scoreText.setPosition(width / 2, padding);
    this.weaponText.setPosition(width - padding, padding + 2);
    this.weaponIcon.setPosition(width - padding, padding);
    this.pauseText.setPosition(width / 2, height / 2);

    if (this.entityCountText) {
      this.entityCountText.setPosition(width - padding, height - padding);
    }
  }

  destroy(): void {
    this.hpText.destroy();
    this.levelText.destroy();
    this.xpText.destroy();
    this.scoreText.destroy();
    this.weaponText.destroy();
    this.weaponIcon.destroy();
    this.pauseText.destroy();
    this.entityCountText?.destroy();
    this.activeBonusesText.destroy();
    this.perksText.destroy();
    this.pendingPerksText.destroy();
    this.activeBonusIcons.forEach(icon => icon.destroy());
    this.activeBonusIconPool.forEach(icon => icon.destroy());
  }

  setPauseMenuActive(active: boolean): void {
    this.pauseMenuActive = active;
  }

  private updateActiveBonusIcons(state: SimState): void {
    const activeBonusIds = Object.entries(state.player.activeEffects)
      .filter(([_, ticks]) => ticks > 0)
      .map(([bonusId]) => bonusId as BonusId);

    const iconSize = 18;
    const iconGap = 4;
    const maxIcons = 8;
    const count = Math.min(activeBonusIds.length, maxIcons);

    for (let i = 0; i < count; i += 1) {
      const bonusId = activeBonusIds[i];
      const frame = BONUS_FRAMES[bonusId];
      let icon = this.activeBonusIcons[i];

      if (!icon) {
        icon = this.activeBonusIconPool.pop() ?? this.hpText.scene.add.sprite(0, 0, 'game-bonuses-grid4', frame);
        icon.setOrigin(0, 0);
        icon.setScrollFactor(0);
        icon.setDepth(1000);
        this.activeBonusIcons[i] = icon;
      }

      icon.setTexture('game-bonuses-grid4', frame);
      icon.setDisplaySize(iconSize, iconSize);
      icon.setPosition(this.bonusIconOrigin.x + i * (iconSize + iconGap), this.bonusIconOrigin.y);
      icon.setVisible(true);
    }

    for (let i = count; i < this.activeBonusIcons.length; i += 1) {
      const icon = this.activeBonusIcons[i];
      if (!icon) {
        continue;
      }
      icon.setVisible(false);
      this.activeBonusIconPool.push(icon);
    }

    this.activeBonusIcons.length = count;
  }
}
