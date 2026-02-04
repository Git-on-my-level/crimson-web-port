import Phaser from 'phaser';
import { Sim } from '../sim/sim';
import { PhaserInputAdapter } from '../adapters/phaser/input';
import { PhaserRenderAdapter } from '../adapters/phaser/render';
import { DebugOverlay } from '../adapters/phaser/debugOverlay';
import { TerrainBackground } from '../adapters/phaser/terrainBackground';
import { Hud } from '../ui/Hud';
import { PerkPickerOverlay } from '../ui/PerkPickerOverlay';
import { spawnCreatureAtEdge } from '../sim/systems/creatures';
import { WEAPON_BY_ID } from '../content/weapons';
import type { SimEvent } from '../sim/types';

interface GameSceneInitData {
  mode?: 'survival' | 'quest';
  seed?: number;
  questId?: string;
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
  private questId?: string;
  private readonly pixelsPerUnit = 12;
  private originX = 0;
  private originY = 0;
  private terrain?: TerrainBackground;
  private gameOverText?: Phaser.GameObjects.Text;
  private questStatusText?: Phaser.GameObjects.Text;
  private wasGameOver = false;
  private wasQuestComplete = false;
  private wasQuestFailed = false;
  private pendingPerkChoice: number | null = null;
  private debugEnabled = false;
  private debugKeys: Phaser.Input.Keyboard.Key[] = [];

  constructor() {
    super('game');
  }

  init(data: GameSceneInitData): void {
    this.mode = data.mode ?? 'survival';
    this.seed = data.seed ?? this.readSeedFromQuery();
    this.debugEnabled = this.getDebugEnabled();
    this.questId = data.questId;
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

    this.questStatusText = this.add.text(width / 2, height / 2, '', {
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

    this.sim = new Sim({ seed: this.seed, mode: this.mode, questId: this.questId, debug: this.debugEnabled });
    this.updateSurvivalSpawnRange();
    this.inputAdapter = new PhaserInputAdapter(this, () => this.getTransform());
    this.renderAdapter = new PhaserRenderAdapter(this, this.getTransform());
    this.debugOverlay = new DebugOverlay(this);
    this.hud = new Hud(this, true);
    this.perkOverlay = new PerkPickerOverlay(this, (slot) => this.queuePerkChoice(slot));
    this.perkOverlay.resize(width, height);

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    if (this.debugEnabled) {
      this.setupDebugControls();
    }
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
    this.syncQuestOverlay();
    this.checkGameOverTransition();
    this.checkQuestTransition();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.originX = gameSize.width / 2;
    this.originY = gameSize.height / 2;
    this.renderAdapter.setTransform(this.getTransform());
    this.terrain?.resize(gameSize.width, gameSize.height);
    this.updateSurvivalSpawnRange();
    if (this.gameOverText) {
      this.gameOverText.setPosition(this.originX, this.originY);
    }
    if (this.questStatusText) {
      this.questStatusText.setPosition(this.originX, this.originY);
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
    const params = this.getQueryParams();
    if (!params) {
      return 1;
    }
    const seedParam = params.get('seed');
    const parsed = seedParam ? Number.parseInt(seedParam, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }

  private getDebugEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const params = this.getQueryParams();
    if (!params) {
      return false;
    }
    return Boolean(params.get('debug')) || import.meta.env.DEV;
  }

  private getQueryParams(): URLSearchParams | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return new URLSearchParams(window.location.search);
  }

  private syncGameOverOverlay(): void {
    if (!this.gameOverText) return;
    const isGameOver = this.sim.state.phase === 'GameOver';
    this.gameOverText.setVisible(isGameOver);
  }

  private syncQuestOverlay(): void {
    if (!this.questStatusText) return;
    if (this.sim.state.phase === 'QuestResults') {
      this.questStatusText.setText('Quest Complete!');
      this.questStatusText.setVisible(true);
      return;
    }
    if (this.sim.state.phase === 'QuestFailed') {
      this.questStatusText.setText('Quest Failed');
      this.questStatusText.setVisible(true);
      return;
    }
    this.questStatusText.setVisible(false);
  }

  private checkGameOverTransition(): void {
    const isGameOver = this.sim.state.phase === 'GameOver';
    if (isGameOver && !this.wasGameOver) {
      this.scene.start('gameOver', {
        score: this.sim.state.score,
        timeAlive: this.sim.state.timeAlive,
        seed: this.seed,
        level: this.sim.state.player.level,
      });
    }
    this.wasGameOver = isGameOver;
  }

  private checkQuestTransition(): void {
    const isQuestComplete = this.sim.state.phase === 'QuestResults';
    const isQuestFailed = this.sim.state.phase === 'QuestFailed';
    if (isQuestComplete && !this.wasQuestComplete) {
      if (this.sim.state.modeState.kind === 'quest') {
        this.scene.start('questResults', {
          questId: this.sim.state.modeState.questId,
          score: this.sim.state.score,
          elapsedTicks: this.sim.state.modeState.elapsedTicks,
          killsTotal: this.sim.state.modeState.killsTotal,
          killsByKind: this.sim.state.modeState.killsByKind,
          seed: this.seed,
          level: this.sim.state.player.level,
        });
      }
    }
    if (isQuestFailed && !this.wasQuestFailed) {
      if (this.sim.state.modeState.kind === 'quest') {
        this.scene.start('questFailed', {
          questId: this.sim.state.modeState.questId,
          score: this.sim.state.score,
          elapsedTicks: this.sim.state.modeState.elapsedTicks,
          killsTotal: this.sim.state.modeState.killsTotal,
          killsByKind: this.sim.state.modeState.killsByKind,
          seed: this.seed,
          level: this.sim.state.player.level,
        });
      }
    }
    this.wasQuestComplete = isQuestComplete;
    this.wasQuestFailed = isQuestFailed;
  }

  private queuePerkChoice(slot: number): void {
    this.pendingPerkChoice = slot;
  }

  private updateSurvivalSpawnRange(): void {
    if (this.sim?.state.mode !== 'survival' || this.sim.state.modeState.kind !== 'survival') {
      return;
    }
    const { width, height } = this.scale;
    const viewRadiusUnits = 0.5 * Math.hypot(width / this.pixelsPerUnit, height / this.pixelsPerUnit);
    const minDistance = viewRadiusUnits + 2;
    this.sim.state.modeState.spawnMinDistance = minDistance;
    this.sim.state.modeState.spawnMaxDistance = minDistance + 6;
  }

  private setupDebugControls(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    const spawnBurstKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    const rofKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    const collisionKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);

    spawnBurstKey.on('down', () => {
      const events: SimEvent[] = [];
      for (let i = 0; i < 20; i += 1) {
        const pick = this.sim.state.rng.nextInt(3);
        const kind = pick === 0 ? 'grunt' : pick === 1 ? 'runner' : 'tank';
        spawnCreatureAtEdge(this.sim.state, events, kind);
      }
    });

    rofKey.on('down', () => {
      const player = this.sim.state.player;
      player.weaponId = 'smg';
      const def = WEAPON_BY_ID[player.weaponId];
      if (def && def.ammoMax !== undefined) {
        player.ammo = def.ammoMax;
      }
      player.fireCooldownTicks = 0;
      player.reloadTicksRemaining = 0;
      player.perkStats.fireRateMultiplier = Math.max(player.perkStats.fireRateMultiplier, 6);
    });

    collisionKey.on('down', () => {
      this.renderAdapter.toggleCollisionDebug();
    });

    this.debugKeys.push(spawnBurstKey, rofKey, collisionKey);
  }

  private handleShutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.debugOverlay?.destroy();
    for (const key of this.debugKeys) {
      key.removeAllListeners();
      key.destroy();
    }
    this.debugKeys = [];
  }
}
