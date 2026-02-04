import Phaser from 'phaser';
import { WEAPON_BY_ID } from '../content/weapons';
import { getBonusDef } from '../content/bonuses';
import { getPerkDef, type PerkId } from '../content/perks';
import type { SimState } from '../sim/state';

export class Hud {
  private hpText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private xpText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
  private pauseText: Phaser.GameObjects.Text;
  private entityCountText?: Phaser.GameObjects.Text;
  private activeBonusesText: Phaser.GameObjects.Text;
  private perksText: Phaser.GameObjects.Text;

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

    this.weaponText = scene.add.text(width - padding, padding, '', style)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

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
    this.activeBonusesText = scene.add.text(padding, padding + 72, '', bonusStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    this.perksText = scene.add.text(padding, padding + 96, '', bonusStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    scene.scale.on('resize', this.handleResize, this);
  }

  update(state: SimState): void {
    const hpDisplay = Math.max(0, Math.round(state.player.hp));
    this.hpText.setText(`HP: ${hpDisplay}/${state.player.hpMax}`);

    this.levelText.setText(`Level: ${state.player.level}`);
    const xp = Math.floor(state.player.xp);
    const xpToNext = Math.max(1, Math.floor(state.player.xpToNext));
    this.xpText.setText(`XP: ${xp}/${xpToNext}`);

    const scoreDisplay = Math.round(state.score);
    this.scoreText.setText(`Score: ${scoreDisplay}`);

    const weapon = WEAPON_BY_ID[state.player.weaponId];
    if (weapon) {
      if (weapon.ammoMax !== undefined) {
        const ammo = Math.max(0, state.player.ammo);
        const reloadTag = state.player.reloadTicksRemaining > 0 ? ' (Reloading)' : '';
        this.weaponText.setText(`${weapon.name} ${ammo}/${weapon.ammoMax}${reloadTag}`);
      } else {
        this.weaponText.setText(weapon.name);
      }
    } else {
      this.weaponText.setText('Weapon');
    }

    const isPaused = state.phase === 'Paused';
    this.pauseText.setVisible(isPaused);

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

    const perkEntries = Object.entries(state.player.perks)
      .filter(([_, count]) => (count ?? 0) > 0)
      .map(([perkId, count]) => {
        const def = getPerkDef(perkId as PerkId);
        return `${def.name} x${count}`;
      });

    if (perkEntries.length > 0) {
      this.perksText.setText(`Perks: ${perkEntries.join(' | ')}`);
    } else {
      this.perksText.setText('');
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    const padding = 16;

    this.scoreText.setPosition(width / 2, padding);
    this.weaponText.setPosition(width - padding, padding);
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
    this.pauseText.destroy();
    this.entityCountText?.destroy();
    this.activeBonusesText.destroy();
    this.perksText.destroy();
  }
}
