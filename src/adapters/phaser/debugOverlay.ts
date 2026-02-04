import Phaser from 'phaser';
import type { SimState } from '../../sim/state';

export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;
  private visible = true;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(12, 12, '', {
      fontFamily: '"SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
      fontSize: '14px',
      color: '#e5e7eb',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: { x: 10, y: 8 },
    }).setDepth(1000);

    const toggle = scene.input.keyboard?.addKey('F1');
    toggle?.on('down', () => {
      this.visible = !this.visible;
      this.text.setVisible(this.visible);
    });
  }

  update(state: SimState, seed: number, fps: number): void {
    if (!this.visible) return;

    const speed = Math.hypot(state.player.vel.x, state.player.vel.y);
    const aimDegrees = (state.player.aimAngle * 180) / Math.PI;

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
      `Score: ${state.score}`,
      `Seed: ${seed}`,
    ]);
  }
}
