import Phaser from 'phaser';
import { Sim } from '../sim/sim';
import { PhaserInputAdapter } from '../adapters/phaser/input';
import { PhaserRenderAdapter } from '../adapters/phaser/render';
import { DebugOverlay } from '../adapters/phaser/debugOverlay';

export class GameScene extends Phaser.Scene {
  private sim!: Sim;
  private inputAdapter!: PhaserInputAdapter;
  private renderAdapter!: PhaserRenderAdapter;
  private debugOverlay!: DebugOverlay;
  private seed = 1;
  private readonly pixelsPerUnit = 12;
  private originX = 0;
  private originY = 0;
  private background?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('game');
  }

  create() {
    const { width, height } = this.scale;
    this.originX = width / 2;
    this.originY = height / 2;

    this.background = this.add.rectangle(width / 2, height / 2, width * 0.9, height * 0.9, 0x111826)
      .setStrokeStyle(2, 0x1f2937);

    this.seed = this.readSeedFromQuery();
    this.sim = new Sim({ seed: this.seed });
    this.inputAdapter = new PhaserInputAdapter(this, () => this.getTransform());
    this.renderAdapter = new PhaserRenderAdapter(this, this.getTransform());
    this.debugOverlay = new DebugOverlay(this);

    this.scale.on('resize', this.handleResize, this);
  }

  update(_time: number, delta: number) {
    const deltaSeconds = Math.min(delta / 1000, 0.25);
    const steps = this.sim.clock.accumulate(deltaSeconds);

    for (let i = 0; i < steps; i += 1) {
      const input = this.inputAdapter.readInput();
      this.sim.step(input);
    }

    this.renderAdapter.render(this.sim.state);
    const fps = this.game.loop.actualFps || 0;
    this.debugOverlay.update(this.sim.state, this.seed, fps);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.originX = gameSize.width / 2;
    this.originY = gameSize.height / 2;
    this.renderAdapter.setTransform(this.getTransform());
    if (this.background) {
      this.background.setPosition(this.originX, this.originY);
      this.background.setSize(gameSize.width * 0.9, gameSize.height * 0.9);
    }
  }

  private getTransform() {
    return {
      originX: this.originX,
      originY: this.originY,
      pixelsPerUnit: this.pixelsPerUnit,
    };
  }

  private readSeedFromQuery(): number {
    if (typeof window === 'undefined') {
      return 1;
    }
    const params = new URLSearchParams(window.location.search);
    const seedParam = params.get('seed');
    const parsed = seedParam ? Number.parseInt(seedParam, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }
}
