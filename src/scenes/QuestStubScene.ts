import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';
import { SFX_KEYS } from '../audio/sfx';

export class QuestStubScene extends Phaser.Scene {
  private menu?: Menu;
  private audio?: PhaserAudioAdapter;

  constructor() {
    super('questStub');
  }

  create() {
    const { width, height } = this.scale;
    this.audio = new PhaserAudioAdapter(this);

    this.add.text(width / 2, height / 2 - 120, 'Quest Mode', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 80, 'Prototype runtime now available.', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    const menuItems: MenuItem[] = [
      {
        label: 'Start Quest',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('game', { mode: 'quest' });
        },
      },
      {
        label: 'Back to Title',
        action: () => {
          this.audio?.playSfx(SFX_KEYS.uiClick);
          this.scene.start('title');
        },
      },
    ];

    this.menu = new Menu(this, menuItems);
  }

  shutdown(): void {
    this.menu?.destroy();
  }
}
