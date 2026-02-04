import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';

export class TitleScene extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('title');
  }

  create() {
    const { width, height } = this.scale;

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
        action: () => this.startSurvival(),
      },
      {
        label: 'Quest',
        action: () => this.startQuest(),
      },
      {
        label: 'Options',
        action: () => this.scene.start('options'),
      },
      {
        label: 'Highscores',
        action: () => this.scene.start('highscores'),
      },
    ];

    this.menu = new Menu(this, menuItems);
  }

  private startSurvival(): void {
    this.scene.start('game', { mode: 'survival' });
  }

  private startQuest(): void {
    this.scene.start('questSelect');
  }

  shutdown(): void {
    this.menu?.destroy();
  }
}
