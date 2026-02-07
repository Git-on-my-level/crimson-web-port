import Phaser from 'phaser';
import { Sim } from '../sim/sim';
import { PhaserInputAdapter } from '../adapters/phaser/input';
import { PhaserRenderAdapter } from '../adapters/phaser/render';
import { DebugOverlay } from '../adapters/phaser/debugOverlay';
import { TerrainBackground } from '../adapters/phaser/terrainBackground';
import { Hud } from '../ui/Hud';
import { PerkPickerOverlay } from '../ui/PerkPickerOverlay';
import { ControlsOverlay } from '../ui/ControlsOverlay';
import { Menu } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { spawnCreatureAtEdge } from '../sim/systems/creatures';
import { WORLD_BOUNDS } from '../sim/world';
import { WEAPON_BY_ID } from '../content/weapons';
import type { SimEvent } from '../sim/types';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { mapSimSfxName, SFX_KEYS } from '../audio/sfx';

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
  private audio!: PhaserAudioAdapter;
  private seed = 1;
  private mode: 'survival' | 'quest' = 'survival';
  private questId?: string;
  private readonly pixelsPerUnit = 18;
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
  private pauseMenu?: Menu;
  private pauseBackdrop?: Phaser.GameObjects.Rectangle;
  private pauseTitle?: Phaser.GameObjects.Text;
  private pauseHint?: Phaser.GameObjects.Text;
  private controlsOverlay?: ControlsOverlay;
  private controlsPausedGame = false;
  private lastDamageFx = -Infinity;
  private lastPickupFx = -Infinity;
  private lastExplosionFx = -Infinity;
  private lastScreenFlash = -Infinity;
  private controlsKeyHandler?: () => void;
  private escHandler?: () => void;

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
    this.updateCameraBounds();
    this.inputAdapter = new PhaserInputAdapter(this, () => this.getTransform());
    this.renderAdapter = new PhaserRenderAdapter(this, this.getTransform());
    this.debugOverlay = new DebugOverlay(this);
    this.hud = new Hud(this, true);
    this.perkOverlay = new PerkPickerOverlay(this, (slot) => this.queuePerkChoice(slot));
    this.perkOverlay.resize(width, height);
    this.audio = new PhaserAudioAdapter(this);
    this.controlsOverlay = new ControlsOverlay(this);

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleResume, this);
    this.events.on(Phaser.Scenes.Events.PAUSE, this.handlePause, this);

    this.controlsKeyHandler = () => this.toggleControlsOverlay();
    this.input.keyboard?.on('keydown-H', this.controlsKeyHandler);
    this.escHandler = () => {
      if (this.controlsOverlay?.isVisible()) {
        this.toggleControlsOverlay();
      }
    };
    this.input.keyboard?.on('keydown-ESC', this.escHandler);

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
      const { events } = this.sim.step(input);
      this.handleSimEvents(events);
    }

    this.renderAdapter.render(this.sim.state);
    this.terrain?.update(this.cameras.main);
    const fps = this.game.loop.actualFps || 0;
    this.debugOverlay.update(this.sim.state, this.seed, fps);
    this.hud.update(this.sim.state);
    this.perkOverlay.update(this.sim.state);
    this.audio.update();
    this.syncPauseMenu();
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
    this.updateCameraBounds();
    if (this.gameOverText) {
      this.gameOverText.setPosition(this.originX, this.originY);
    }
    if (this.questStatusText) {
      this.questStatusText.setPosition(this.originX, this.originY);
    }
    if (this.perkOverlay) {
      this.perkOverlay.resize(gameSize.width, gameSize.height);
    }
    this.controlsOverlay?.resize(gameSize.width, gameSize.height);
    this.updatePauseMenuLayout();
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
      const kills =
        this.sim.state.modeState.kind === 'survival' ? this.sim.state.modeState.killsTotal : 0;
      this.scene.start('gameOver', {
        score: this.sim.state.score,
        timeAlive: this.sim.state.timeAlive,
        seed: this.seed,
        level: this.sim.state.player.level,
        kills,
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

  private handleSimEvents(events: SimEvent[]): void {
    if (!events.length) return;
    const sfxKeys = new Set<string>();
    let playerDamaged = false;
    let bigPickup = false;
    let explosionImpact = false;

    for (const event of events) {
      switch (event.type) {
        case 'playSfx': {
          const key = mapSimSfxName(event.name);
          if (key) sfxKeys.add(key);
          break;
        }
        case 'damage':
          if (event.target === 'player') {
            playerDamaged = true;
          }
          break;
        case 'pickup':
          sfxKeys.add(SFX_KEYS.pickup);
          if (this.isBigPickup(event.bonusType)) {
            bigPickup = true;
          }
          break;
        case 'perkOffered':
          sfxKeys.add(SFX_KEYS.perkOffer);
          break;
        case 'perkChosen':
          sfxKeys.add(SFX_KEYS.perkChoose);
          break;
        case 'projectileImpact':
          if ((event.explosionRadius ?? 0) > 0) {
            explosionImpact = true;
          }
          break;
        case 'screenShake':
          this.cameras.main.shake(event.durationMs, event.intensity);
          break;
        case 'screenFlash':
          this.triggerScreenFlash(event.kind);
          break;
        case 'shockArc':
          this.playShockArcFx(event.from, event.to);
          break;
        default:
          break;
      }
    }

    for (const key of sfxKeys) {
      this.audio.playSfx(key);
    }

    if (playerDamaged) {
      this.triggerDamageFx();
    }
    if (bigPickup) {
      this.triggerPickupFx();
    }
    if (explosionImpact) {
      this.triggerExplosionFx();
    }
  }

  private updateSurvivalSpawnRange(): void {
    if (this.sim?.state.mode !== 'survival' || this.sim.state.modeState.kind !== 'survival') {
      return;
    }
    const { width, height } = this.scale;
    const viewRadiusUnits = 0.5 * Math.hypot(width / this.pixelsPerUnit, height / this.pixelsPerUnit);
    const worldRadius = Math.min(
      WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX,
      WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY,
    ) / 2;
    const maxMinDistance = Math.max(2, worldRadius - 2);
    const minDistance = Math.min(viewRadiusUnits + 2, maxMinDistance);
    const maxDistance = Math.min(minDistance + 6, worldRadius);
    this.sim.state.modeState.spawnMinDistance = minDistance;
    this.sim.state.modeState.spawnMaxDistance = Math.max(minDistance, maxDistance);
  }

  private updateCameraBounds(): void {
    const minX = this.originX + WORLD_BOUNDS.minX * this.pixelsPerUnit;
    const minY = this.originY + WORLD_BOUNDS.minY * this.pixelsPerUnit;
    const maxX = this.originX + WORLD_BOUNDS.maxX * this.pixelsPerUnit;
    const maxY = this.originY + WORLD_BOUNDS.maxY * this.pixelsPerUnit;
    this.cameras.main.setBounds(minX, minY, maxX - minX, maxY - minY);
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
      player.weaponId = 'submachine_gun';
      const def = WEAPON_BY_ID[player.weaponId];
      if (def && def.ammoMax !== undefined) {
        player.ammo = def.ammoMax;
      }
      player.shotCooldown = 0;
      player.reloadTimer = 0;
      player.perkStats.fireRateMultiplier = Math.max(player.perkStats.fireRateMultiplier, 6);
    });

    collisionKey.on('down', () => {
      this.renderAdapter.toggleCollisionDebug();
    });

    this.debugKeys.push(spawnBurstKey, rofKey, collisionKey);
  }

  private syncPauseMenu(): void {
    const isPaused = this.sim.state.phase === 'Paused';
    const controlsVisible = this.controlsOverlay?.isVisible() ?? false;
    if (isPaused && !this.pauseMenu && !controlsVisible) {
      this.showPauseMenu();
    }
    if ((!isPaused || controlsVisible) && this.pauseMenu) {
      this.hidePauseMenu();
    }
    this.hud.setPauseMenuActive(Boolean(this.pauseMenu) || controlsVisible);
  }

  private showPauseMenu(): void {
    const { width, height } = this.scale;
    this.pauseBackdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x0b0d12, 0.55)
      .setDepth(920)
      .setScrollFactor(0);

    this.pauseTitle = this.add.text(width / 2, height / 2 - 180, 'Paused', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '40px',
    }).setOrigin(0.5).setDepth(921).setScrollFactor(0);

    this.pauseHint = this.add.text(width / 2, height / 2 + 190, 'Press Esc or P to resume', {
      ...UI_STYLE.text.small,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5).setDepth(921).setScrollFactor(0);

    const menuItems = [
      {
        label: 'Resume',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.resumeFromPauseMenu();
        },
      },
      {
        label: 'Options',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.hidePauseMenu();
          this.scene.pause();
          this.scene.launch('options', { returnTo: 'game' });
        },
      },
      {
        label: 'Controls',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.toggleControlsOverlay(true);
        },
      },
      {
        label: 'Restart',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('game', { mode: this.mode, seed: this.seed, questId: this.questId });
        },
      },
      {
        label: 'Quit to Title',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('title');
        },
      },
    ];

    this.pauseMenu = new Menu(this, menuItems);
    let readyForSound = false;
    this.pauseMenu.setOnIndexChange(() => {
      if (!readyForSound) {
        readyForSound = true;
        return;
      }
      this.audio?.playSfx(SFX_KEYS.uiClick);
    });
    this.updatePauseMenuLayout();
  }

  private hidePauseMenu(): void {
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.pauseBackdrop?.destroy();
    this.pauseBackdrop = undefined;
    this.pauseTitle?.destroy();
    this.pauseTitle = undefined;
    this.pauseHint?.destroy();
    this.pauseHint = undefined;
    this.hud.setPauseMenuActive(false);
  }

  private updatePauseMenuLayout(): void {
    if (!this.pauseMenu || !this.pauseBackdrop || !this.pauseTitle || !this.pauseHint) return;
    const { width, height } = this.scale;
    this.pauseBackdrop.setPosition(width / 2, height / 2);
    this.pauseBackdrop.setSize(width, height);
    this.pauseTitle.setPosition(width / 2, height / 2 - 180);
    this.pauseHint.setPosition(width / 2, height / 2 + 190);
  }

  private resumeFromPauseMenu(): void {
    this.sim.state.phase = 'Playing';
    this.hidePauseMenu();
  }

  private toggleControlsOverlay(fromPauseMenu = false): void {
    if (!this.controlsOverlay) return;
    const wasVisible = this.controlsOverlay.isVisible();
    this.controlsOverlay.toggle();

    if (!wasVisible) {
      if (this.sim.state.phase === 'Playing') {
        this.sim.state.phase = 'Paused';
        this.controlsPausedGame = true;
      }
      if (fromPauseMenu) {
        this.hidePauseMenu();
      }
    } else {
      if (this.controlsPausedGame) {
        this.sim.state.phase = 'Playing';
        this.controlsPausedGame = false;
      }
      if (this.sim.state.phase === 'Paused') {
        this.showPauseMenu();
      }
    }
  }

  private handleResume(): void {
    this.inputAdapter.reloadKeybinds();
    this.audio.reloadSettings();
    this.audio.resumeAll();
  }

  private handlePause(): void {
    this.audio.suspendAll();
  }

  private isBigPickup(bonusType: string): boolean {
    const big = new Set(['nuke', 'fireblast', 'shock_chain', 'weapon_power_up', 'double_xp']);
    return big.has(bonusType);
  }

  private triggerDamageFx(): void {
    const now = this.time.now;
    if (now - this.lastDamageFx < 180) return;
    this.lastDamageFx = now;
    this.cameras.main.shake(120, 0.006);
    this.cameras.main.flash(120, 120, 20, 20);
  }

  private triggerPickupFx(): void {
    const now = this.time.now;
    if (now - this.lastPickupFx < 220) return;
    this.lastPickupFx = now;
    this.cameras.main.flash(140, 255, 210, 80);
  }

  private triggerExplosionFx(): void {
    const now = this.time.now;
    if (now - this.lastExplosionFx < 160) return;
    this.lastExplosionFx = now;
    this.cameras.main.shake(140, 0.008);
    this.cameras.main.flash(100, 255, 100, 40);
  }

  private triggerScreenFlash(kind: 'nuke' | 'pickup' | 'damage' | 'explosion'): void {
    const now = this.time.now;
    if (now - this.lastScreenFlash < 120) return;
    this.lastScreenFlash = now;
    switch (kind) {
      case 'nuke':
        this.cameras.main.flash(220, 255, 245, 210);
        break;
      case 'pickup':
        this.cameras.main.flash(140, 255, 210, 80);
        break;
      case 'damage':
        this.cameras.main.flash(120, 120, 20, 20);
        break;
      case 'explosion':
        this.cameras.main.flash(100, 255, 100, 40);
        break;
      default:
        break;
    }
  }

  private playShockArcFx(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const start = this.simToScreen(from.x, from.y);
    const end = this.simToScreen(to.x, to.y);
    const arc = this.add.graphics();
    arc.setDepth(880);
    arc.lineStyle(5, 0x7dd3fc, 0.35);
    arc.beginPath();
    arc.moveTo(start.x, start.y);
    arc.lineTo(end.x, end.y);
    arc.strokePath();
    arc.lineStyle(2, 0xffffff, 0.9);
    arc.beginPath();
    arc.moveTo(start.x, start.y);
    arc.lineTo(end.x, end.y);
    arc.strokePath();
    this.tweens.add({
      targets: arc,
      alpha: 0,
      duration: 110,
      ease: 'Quad.easeOut',
      onComplete: () => arc.destroy(),
    });
  }

  private simToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this.originX + x * this.pixelsPerUnit,
      y: this.originY + y * this.pixelsPerUnit,
    };
  }

  private handleShutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleResume, this);
    this.events.off(Phaser.Scenes.Events.PAUSE, this.handlePause, this);
    if (this.controlsKeyHandler) {
      this.input.keyboard?.off('keydown-H', this.controlsKeyHandler);
    }
    if (this.escHandler) {
      this.input.keyboard?.off('keydown-ESC', this.escHandler);
    }
    this.pauseMenu?.destroy();
    this.pauseBackdrop?.destroy();
    this.pauseTitle?.destroy();
    this.pauseHint?.destroy();
    this.controlsOverlay?.destroy();
    this.debugOverlay?.destroy();
    this.audio.shutdownAll();
    for (const key of this.debugKeys) {
      key.removeAllListeners();
      key.destroy();
    }
    this.debugKeys = [];
  }
}
