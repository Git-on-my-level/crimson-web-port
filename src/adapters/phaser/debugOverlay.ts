import Phaser from 'phaser';
import type { SimProfile, SimState } from '../../sim/state';

export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;
  private visible = false;
  private readonly stepTimeHistory: number[] = [];
  private readonly HISTORY_SIZE = 60;
  private readonly profileHistory: Record<keyof SimProfile, number[]> = {
    inputMs: [],
    playerMs: [],
    weaponsMs: [],
    projectilesMs: [],
    modeMs: [],
    creaturesMs: [],
    collisionMs: [],
    bonusesMs: [],
    hazardsMs: [],
    progressionMs: [],
    totalMs: [],
  };
  private readonly toggleKey?: Phaser.Input.Keyboard.Key;
  private readonly onToggle: () => void;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 12, '', {
      fontFamily: '"SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
      fontSize: '14px',
      color: '#e5e7eb',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: { x: 10, y: 8 },
    }).setDepth(1000).setVisible(this.visible);

    this.onToggle = () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    };
    this.toggleKey = scene.input.keyboard?.addKey('F1');
    this.toggleKey?.on('down', this.onToggle);
  }

  update(state: SimState, seed: number, fps: number): void {
    if (!this.visible) return;

    this.stepTimeHistory.push(state.lastStepTimeMs);
    if (this.stepTimeHistory.length > this.HISTORY_SIZE) {
      this.stepTimeHistory.shift();
    }

    const avgStepTime =
      this.stepTimeHistory.reduce((sum, t) => sum + t, 0) / this.stepTimeHistory.length;

    const speed = Math.hypot(state.player.vel.x, state.player.vel.y);
    const aimDegrees = (state.player.aimAngle * 180) / Math.PI;
    const poolUtil = state.projectilePool.getActiveCount() / state.projectilePool.getCapacity();
    const profile = state.profile;
    const profileLines: string[] = [];
    if (profile) {
      const entries = Object.entries(this.profileHistory) as Array<[keyof SimProfile, number[]]>;
      for (const [key, history] of entries) {
        history.push(profile[key] ?? 0);
        if (history.length > this.HISTORY_SIZE) {
          history.shift();
        }
      }
      const avg = (key: keyof typeof this.profileHistory) => {
        const history = this.profileHistory[key];
        if (history.length === 0) return 0;
        return history.reduce((sum, value) => sum + value, 0) / history.length;
      };
      profileLines.push(`Profile ms (avg)`);
      profileLines.push(
        `Input ${avg('inputMs').toFixed(3)} | Player ${avg('playerMs').toFixed(3)} | Weapons ${avg('weaponsMs').toFixed(3)}`,
      );
      profileLines.push(
        `Projectiles ${avg('projectilesMs').toFixed(3)} | Mode ${avg('modeMs').toFixed(3)} | Creatures ${avg('creaturesMs').toFixed(3)}`,
      );
      profileLines.push(
        `Collision ${avg('collisionMs').toFixed(3)} | Bonuses ${avg('bonusesMs').toFixed(3)} | Hazards ${avg('hazardsMs').toFixed(3)}`,
      );
      profileLines.push(`Progress ${avg('progressionMs').toFixed(3)}`);
      profileLines.push(`Total ${avg('totalMs').toFixed(3)}`);
    }

    this.text.setText([
      `FPS: ${fps.toFixed(1)}`,
      `Tick: ${state.tick}`,
      `Phase: ${state.phase}`,
      `Player: ${state.player.pos.x.toFixed(2)}, ${state.player.pos.y.toFixed(2)}`,
      `HP: ${state.player.hp}/${state.player.hpMax}`,
      `Speed: ${speed.toFixed(2)}`,
      `Aim: ${aimDegrees.toFixed(1)}°`,
      `Creatures: ${state.creatures.length}`,
      `Projectiles: ${state.projectiles.length}`,
      `Bonuses: ${state.bonuses.length}`,
      `Hazards: ${state.hazards.length}`,
      `Score: ${state.score}`,
      `Seed: ${seed}`,
      `Step Time: ${(avgStepTime * 1000).toFixed(2)}µs`,
      `Pool: ${state.projectilePool.getActiveCount()}/${state.projectilePool.getCapacity()} (${(poolUtil * 100).toFixed(0)}%)`,
      ...profileLines,
    ]);
  }

  destroy(): void {
    this.toggleKey?.off('down', this.onToggle);
    this.toggleKey?.destroy();
  }
}
