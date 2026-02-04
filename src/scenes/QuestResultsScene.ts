import Phaser from 'phaser';
import { getQuestDef } from '../content/quests';
import { addRunRecord, type RunRecord } from '../persistence/highscores';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';

interface QuestResultsSceneInitData {
  questId: string;
  score: number;
  elapsedTicks: number;
  killsTotal: number;
  killsByKind: Record<string, number>;
  seed: number;
  level?: number;
}

export class QuestResultsScene extends Phaser.Scene {
  private questId = '';
  private score = 0;
  private elapsedTicks = 0;
  private killsTotal = 0;
  private seed = 1;
  private level = 1;
  private audio?: PhaserAudioAdapter;

  constructor() {
    super('questResults');
  }

  init(data: QuestResultsSceneInitData): void {
    this.questId = data.questId || '';
    this.score = data.score || 0;
    this.elapsedTicks = data.elapsedTicks || 0;
    this.killsTotal = data.killsTotal || 0;
    this.seed = data.seed || 1;
    this.level = data.level ?? 1;

    const record: RunRecord = {
      mode: 'quest',
      score: this.score,
      timeSeconds: Math.round(this.elapsedTicks / 60),
      kills: this.killsTotal,
      level: this.level,
      seed: this.seed,
      dateISO: new Date().toISOString(),
      questId: this.questId,
    };

    addRunRecord(record);
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const quest = getQuestDef(this.questId);
    this.audio = new PhaserAudioAdapter(this);

    const textStyle = {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      color: '#f8fafc',
      stroke: '#0f172a',
      strokeThickness: 4,
      align: 'center',
    };

    this.add.text(centerX, centerY - 140, 'QUEST COMPLETE!', {
      ...textStyle,
      fontSize: '42px',
      color: '#4ade80',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: { x: 24, y: 16 },
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 90, quest.title, {
      ...textStyle,
      fontSize: '24px',
      color: '#fbbf24',
    }).setOrigin(0.5);

    const scoreText = `Score: ${Math.round(this.score)}`;
    this.add.text(centerX, centerY - 40, scoreText, {
      ...textStyle,
      fontSize: '28px',
    }).setOrigin(0.5);

    const timeSeconds = Math.round(this.elapsedTicks / 60);
    const timeText = `Time: ${timeSeconds}s`;
    this.add.text(centerX, centerY, timeText, {
      ...textStyle,
      fontSize: '20px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const killsText = `Kills: ${this.killsTotal}`;
    this.add.text(centerX, centerY + 30, killsText, {
      ...textStyle,
      fontSize: '20px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const buttonStyle = {
      fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#f8fafc',
      padding: { x: 24, y: 12 },
    };

    const createButton = (y: number, text: string, bgColor: number, onClick: () => void) => {
      const bg = this.add.rectangle(centerX, y, 200, 44, bgColor)
        .setStrokeStyle(2, 0x3b82f6);

      const txt = this.add.text(centerX, y, text, buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      const hoverOver = () => {
        bg.setFillStyle(bgColor + 0x222222);
      };

      const hoverOut = () => {
        bg.setFillStyle(bgColor);
      };

      txt.on('pointerover', hoverOver);
      txt.on('pointerout', hoverOut);
      txt.on('pointerdown', () => {
        this.audio?.playSfx(SFX_KEYS.uiClick);
        onClick();
      });

      return { bg, txt };
    };

    createButton(centerY + 100, 'Retry', 0x1e40af, () => {
      this.scene.start('game', { mode: 'quest', questId: this.questId, seed: this.seed });
    });

    createButton(centerY + 160, 'Quest Select', 0x4b5563, () => {
      this.scene.start('questSelect');
    });

    createButton(centerY + 220, 'Main Menu', 0x4b5563, () => {
      this.scene.start('title');
    });

    this.input.keyboard?.once('keydown-R', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('game', { mode: 'quest', questId: this.questId, seed: this.seed });
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('game', { mode: 'quest', questId: this.questId, seed: this.seed });
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('questSelect');
    });
  }
}
