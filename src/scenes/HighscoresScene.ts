import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';

export class HighscoresScene extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('highscores');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 120, 'Highscores', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 80, 'Coming soon...', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    const menuItems: MenuItem[] = [
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
