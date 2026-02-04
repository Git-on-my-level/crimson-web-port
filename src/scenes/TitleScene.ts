import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';

export class TitleScene extends Phaser.Scene {
  private menu?: Menu;
  private audio?: PhaserAudioAdapter;

  constructor() {
    super('title');
  }

  create() {
    const { width, height } = this.scale;
    this.audio = new PhaserAudioAdapter(this);
    this.audio.playMusic('music-intro', true);

    this.add.text(width / 2, height / 2 - 120, 'Crimson Web Port', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 80, 'Press Enter or Click to Start', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    const menuItems: MenuItem[] = [
      {
        label: 'Survival',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.startSurvival();
        },
      },
      {
        label: 'Quest',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.startQuest();
        },
      },
      {
        label: 'Options',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('options');
        },
      },
      {
        label: 'Highscores',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('highscores');
        },
      },
    ];

    if (this.isAtlasPreviewEnabled()) {
      menuItems.push({
        label: 'Atlas Preview',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('atlasPreview');
        },
      });
    }

    this.menu = new Menu(this, menuItems);
  }

  private startSurvival(): void {
    this.scene.start('game', { mode: 'survival' });
  }

  private startQuest(): void {
    this.scene.start('questSelect');
  }

  private isAtlasPreviewEnabled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('debug')) || params.get('atlas') === '1' || import.meta.env.DEV;
  }

  shutdown(): void {
    this.menu?.destroy();
  }
}
