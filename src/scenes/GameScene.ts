import Phaser from 'phaser';
import { Sim } from '../sim/sim';
import { PhaserInputAdapter } from '../adapters/phaser/input';
import { PhaserRenderAdapter } from '../adapters/phaser/render';
import { DebugOverlay } from '../adapters/phaser/debugOverlay';
import { TerrainBackground } from '../adapters/phaser/terrainBackground';
import { Hud } from '../ui/Hud';
import { PerkPickerOverlay } from '../ui/PerkPickerOverlay';

interface GameSceneInitData {
  mode?: 'survival' | 'quest';
  seed?: number;
}

export class GameScene extends Phaser.Scene {
  private sim!: Sim;
  private inputAdapter!: PhaserInputAdapter;
  private renderAdapter!: PhaserRenderAdapter;
  private debugOverlay!: DebugOverlay;
  private hud!: Hud;
  private perkOverlay!: PerkPickerOverlay;
  private seed = 1;
  private mode: 'survival' | 'quest' = 'survival';
  private readonly pixelsPerUnit = 12;
  private originX = 0;
  private originY = 0;
  private terrain?: TerrainBackground;
  private gameOverText?: Phaser.GameObjects.Text;
  private wasGameOver = false;
  private pendingPerkChoice: number | null = null;

  constructor() {
    super('game');
  }

  init(data: GameSceneInitData): void {
    this.mode = data.mode ?? 'survival';
    this.seed = data.seed ?? this.readSeedFromQuery();
  }

  create() {
    const { width, height } = this.scale;
    this.originX = width / 2;
    this.originY = height / 2;

    this.terrain = new TerrainBackground(this, width, height);
    this.gameOverText = this.add.text(width / 2, height / 2, 'Game Over', {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '32px',
      color: '#f8fafc',
      align: 'center',
      stroke: '#0f172a',
      strokeThickness: 4,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: { x: 18, y: 14 },
    })
      .setOrigin(0.5)
      .setDepth(900)
      .setVisible(false);

    this.sim = new Sim({ seed: this.seed });
    this.sim.state.mode = this.mode;
    this.inputAdapter = new PhaserInputAdapter(this, () => this.getTransform());
    this.renderAdapter = new PhaserRenderAdapter(this, this.getTransform());
    this.debugOverlay = new DebugOverlay(this);
    this.hud = new Hud(this, true);
    this.perkOverlay = new PerkPickerOverlay(this, (slot) => this.queuePerkChoice(slot));
    this.perkOverlay.resize(width, height);

    this.scale.on('resize', this.handleResize, this);
  }

  update(_time: number, delta: number) {
    const deltaSeconds = Math.min(delta / 1000, 0.25);
    const steps = this.sim.clock.accumulate(deltaSeconds);

    for (let i = 0; i < steps; i += 1) {
      const rawInput = this.inputAdapter.readInput();
      const input = { ...rawInput, perkChoice: this.pendingPerkChoice ?? rawInput.perkChoice };
      this.pendingPerkChoice = null;
      this.sim.step(input);
    }

    this.renderAdapter.render(this.sim.state);
    this.terrain?.update(this.cameras.main);
    const fps = this.game.loop.actualFps || 0;
    this.debugOverlay.update(this.sim.state, this.seed, fps);
    this.hud.update(this.sim.state);
    this.perkOverlay.update(this.sim.state);
    this.syncGameOverOverlay();
    this.checkGameOverTransition();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.originX = gameSize.width / 2;
    this.originY = gameSize.height / 2;
    this.renderAdapter.setTransform(this.getTransform());
    this.terrain?.resize(gameSize.width, gameSize.height);
    if (this.gameOverText) {
      this.gameOverText.setPosition(this.originX, this.originY);
    }
    if (this.perkOverlay) {
      this.perkOverlay.resize(gameSize.width, gameSize.height);
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

  private syncGameOverOverlay(): void {
    if (!this.gameOverText) return;
    const isGameOver = this.sim.state.phase === 'GameOver';
    this.gameOverText.setVisible(isGameOver);
  }

  private checkGameOverTransition(): void {
    const isGameOver = this.sim.state.phase === 'GameOver';
    if (isGameOver && !this.wasGameOver) {
      this.scene.start('gameOver', {
        score: this.sim.state.score,
        timeAlive: this.sim.state.timeAlive,
        seed: this.seed,
      });
    }
    this.wasGameOver = isGameOver;
  }

  private queuePerkChoice(slot: number): void {
    this.pendingPerkChoice = slot;
  }
}
