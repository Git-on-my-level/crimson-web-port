import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { QUESTS } from '../content/quests/catalog';

export class QuestSelectScene extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('questSelect');
  }

  create() {
    const { width } = this.scale;

    this.add.text(width / 2, 60, 'Select Quest', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.add.text(width / 2, 100, 'Choose a challenge to begin', {
      ...UI_STYLE.text.subtitle,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    const menuItems: MenuItem[] = QUESTS.map((quest) => ({
      label: quest.title,
      action: () => this.startQuest(quest.id),
    }));

    menuItems.push({
      label: 'Back to Title',
      action: () => this.scene.start('title'),
    });

    this.menu = new Menu(this, menuItems);
  }

  private startQuest(questId: string): void {
    this.scene.start('game', { mode: 'quest', questId });
  }

  shutdown(): void {
    this.menu?.destroy();
  }
}
