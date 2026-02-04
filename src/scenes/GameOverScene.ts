import Phaser from 'phaser';
import { addRunRecord, type RunRecord } from '../persistence/highscores';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';

interface GameOverSceneInitData {
  score: number;
  timeAlive: number;
  seed: number;
  level?: number;
}

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private timeAlive = 0;
  private seed = 1;
  private level = 1;
  private audio?: PhaserAudioAdapter;

  constructor() {
    super('gameOver');
  }

  init(data: GameOverSceneInitData): void {
    this.score = data.score || 0;
    this.timeAlive = data.timeAlive || 0;
    this.seed = data.seed || 1;
    this.level = data.level ?? 1;

    const record: RunRecord = {
      mode: 'survival',
      score: this.score,
      timeSeconds: this.timeAlive,
      kills: 0,
      level: this.level,
      seed: this.seed,
      dateISO: new Date().toISOString(),
    };

    addRunRecord(record);
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    this.audio = new PhaserAudioAdapter(this);

    const textStyle = {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 4,
      align: 'center',
    };

    this.add.text(centerX, centerY - 100, 'GAME OVER', {
      ...textStyle,
      fontSize: '48px',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5);

    const scoreText = `Final Score: ${Math.round(this.score)}`;
    this.add.text(centerX, centerY - 30, scoreText, {
      ...textStyle,
      fontSize: '28px',
    }).setOrigin(0.5);

    const timeText = `Time Alive: ${Math.round(this.timeAlive)}s`;
    this.add.text(centerX, centerY + 10, timeText, {
      ...textStyle,
      fontSize: '20px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const buttonStyle = {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      backgroundColor: '#1e40af',
      padding: { x: 24, y: 12 },
    };

    const createButton = (y: number, text: string, onClick: () => void) => {
      const bg = this.add.rectangle(centerX, y, 200, 44, 0x1e40af)
        .setStrokeStyle(2, 0x3b82f6);

      const txt = this.add.text(centerX, y, text, buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      const hoverOver = () => {
        bg.setFillStyle(0x2563eb);
      };

      const hoverOut = () => {
        bg.setFillStyle(0x1e40af);
      };

      txt.on('pointerover', hoverOver);
      txt.on('pointerout', hoverOut);
      txt.on('pointerdown', () => {
        this.audio?.playSfx(SFX_KEYS.uiClick);
        onClick();
      });

      return { bg, txt };
    };

    createButton(centerY + 80, 'Restart', () => {
      this.scene.start('game', { seed: this.seed });
    });

    createButton(centerY + 140, 'Back to Title', () => {
      this.scene.start('title');
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('game', { seed: this.seed });
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('title');
    });
  }
}
