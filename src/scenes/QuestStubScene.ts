import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';

export class QuestStubScene extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('questStub');
  }

  create() {
    const { width, height } = this.scale;

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
        action: () => this.scene.start('game', { mode: 'quest' }),
      },
      {
        label: 'Back to Title',
        action: () => this.scene.start('title'),
      },
    ];

    this.menu = new Menu(this, menuItems);
  }

  shutdown(): void {
    this.menu?.destroy();
  }
}
