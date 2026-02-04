import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';
import { ControlsOverlay } from '../ui/ControlsOverlay';

export class TitleScene extends Phaser.Scene {
  private menu?: Menu;
  private audio?: PhaserAudioAdapter;
  private controlsOverlay?: ControlsOverlay;
  private controlsKeyHandler?: () => void;
  private escHandler?: () => void;

  constructor() {
    super('title');
  }

  create() {
    const { width, height } = this.scale;
    this.audio = new PhaserAudioAdapter(this);
    this.audio.playMusic('music-intro', true);
    this.controlsOverlay = new ControlsOverlay(this);

    this.add.text(width / 2, height / 2 - 120, 'Crimson Web Port', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 80, 'Press Enter or Click to Start', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50, 'Press H for Controls', {
      ...UI_STYLE.text.small,
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
        label: 'Controls',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.controlsOverlay?.show();
        },
      },
      {
        label: 'Options',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('options', { returnTo: 'title' });
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

    this.controlsKeyHandler = () => {
      if (this.controlsOverlay?.isVisible()) {
        this.controlsOverlay.hide();
        return;
      }
      this.controlsOverlay?.show();
    };
    this.input.keyboard?.on('keydown-H', this.controlsKeyHandler);
    this.escHandler = () => {
      if (this.controlsOverlay?.isVisible()) {
        this.controlsOverlay.hide();
      }
    };
    this.input.keyboard?.on('keydown-ESC', this.escHandler);
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
    this.controlsOverlay?.destroy();
    if (this.controlsKeyHandler) {
      this.input.keyboard?.off('keydown-H', this.controlsKeyHandler);
    }
    if (this.escHandler) {
      this.input.keyboard?.off('keydown-ESC', this.escHandler);
    }
  }
}
