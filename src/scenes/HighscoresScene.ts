import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { getSurvivalHighscores } from '../persistence/highscores';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';

type TabMode = 'survival' | 'quest';

export class HighscoresScene extends Phaser.Scene {
  private menu?: Menu;
  private tabMode: TabMode = 'survival';
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private tableContainer?: Phaser.GameObjects.Container;
  private audio?: PhaserAudioAdapter;

  constructor() {
    super('highscores');
  }

  create() {
    const { width, height } = this.scale;
    this.audio = new PhaserAudioAdapter(this);

    this.add.text(width / 2, height / 2 - 200, 'Highscores', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.createTabs(width / 2, height / 2 - 140);
    this.createTable(width / 2, height / 2 + 40);

    const menuItems: MenuItem[] = [
      {
        label: 'Back to Title',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('title');
        },
      },
    ];

    this.menu = new Menu(this, menuItems);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.audio?.playSfx(SFX_KEYS.uiClick);
      this.scene.start('title');
    });
  }

  private createTabs(x: number, y: number): void {
    const tabWidth = 100;
    const tabHeight = 36;
    const gap = 10;

    const tabs: { mode: TabMode; label: string }[] = [
      { mode: 'survival', label: 'Survival' },
      { mode: 'quest', label: 'Quest' },
    ];

    tabs.forEach((tab, index) => {
      const tabX = x - tabWidth - gap / 2 + index * (tabWidth + gap);
      const isSelected = tab.mode === this.tabMode;

      const bg = this.add.rectangle(tabX, y, tabWidth, tabHeight, isSelected ? 0x1e40af : 0x1f2937)
        .setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0x3b82f6 : 0x4b5563)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(tabX, y, tab.label, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '16px',
        color: isSelected ? '#ffffff' : '#9ca3af',
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        this.audio?.playSfx(SFX_KEYS.uiClick);
        this.setTabMode(tab.mode);
      });

      bg.on('pointerover', () => {
        if (tab.mode !== this.tabMode) {
          bg.setStrokeStyle(2, 0x6b7280);
        }
      });

      bg.on('pointerout', () => {
        if (tab.mode !== this.tabMode) {
          bg.setStrokeStyle(1, 0x4b5563);
        }
      });

      const container = this.add.container(0, 0, [bg, txt]);
      this.tabButtons.push(container);
    });
  }

  private setTabMode(mode: TabMode): void {
    if (this.tabMode === mode) return;

    this.tabMode = mode;
    this.updateTabs();
    this.updateTable();
  }

  private updateTabs(): void {
    const tabs: TabMode[] = ['survival', 'quest'];

    this.tabButtons.forEach((container, index) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      const txt = container.last as Phaser.GameObjects.Text;
      const mode = tabs[index];
      const isSelected = mode === this.tabMode;

      bg?.setFillStyle(isSelected ? 0x1e40af : 0x1f2937);
      bg?.setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0x3b82f6 : 0x4b5563);
      txt?.setColor(isSelected ? '#ffffff' : '#9ca3af');
    });
  }

  private createTable(x: number, y: number): void {
    this.tableContainer = this.add.container(x, y);
    this.updateTable();
  }

  private updateTable(): void {
    const tableContainer = this.tableContainer;
    if (!tableContainer) return;

    tableContainer.removeAll(true);

    const records = this.tabMode === 'survival'
      ? getSurvivalHighscores()
      : [];

    if (records.length === 0) {
      const noScoresText = this.add.text(0, 0, 'No scores yet', {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '18px',
        color: '#9ca3af',
      }).setOrigin(0.5);

      tableContainer.add(noScoresText);
      return;
    }

    const headerBg = this.add.rectangle(0, -60, 500, 30, 0x1f2937);
    const rankText = this.add.text(-200, -60, '#', {
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '14px',
      color: '#f3f4f6',
    }).setOrigin(0, 0.5);

    const scoreText = this.add.text(-80, -60, 'Score', {
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '14px',
      color: '#f3f4f6',
    }).setOrigin(0, 0.5);

    const timeText = this.add.text(50, -60, 'Time', {
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '14px',
      color: '#f3f4f6',
    }).setOrigin(0, 0.5);

    const dateText = this.add.text(150, -60, 'Date', {
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '14px',
      color: '#f3f4f6',
    }).setOrigin(0, 0.5);

    tableContainer.add([headerBg, rankText, scoreText, timeText, dateText]);

    records.forEach((record, index) => {
      const rowY = -30 + index * 25;
      const rowBg = this.add.rectangle(0, rowY, 500, 22, index % 2 === 0 ? 0x111827 : 0x0f1219);

      const rank = this.add.text(-200, rowY, `${index + 1}.`, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '14px',
        color: index < 3 ? '#fbbf24' : '#e5e7eb',
      }).setOrigin(0, 0.5);

      const score = this.add.text(-80, rowY, Math.round(record.score).toLocaleString(), {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '14px',
        color: '#e5e7eb',
      }).setOrigin(0, 0.5);

      const time = this.add.text(50, rowY, `${Math.round(record.timeSeconds)}s`, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '14px',
        color: '#9ca3af',
      }).setOrigin(0, 0.5);

      const date = new Date(record.dateISO);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
      const dateTxt = this.add.text(150, rowY, dateStr, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '14px',
        color: '#9ca3af',
      }).setOrigin(0, 0.5);

      tableContainer.add([rowBg, rank, score, time, dateTxt]);
    });
  }

  shutdown(): void {
    this.menu?.destroy();
    this.tabButtons.forEach((container) => container.destroy());
    this.tableContainer?.destroy();
  }
}
