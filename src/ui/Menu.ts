import Phaser from 'phaser';
import { UI_STYLE } from './style';

export interface MenuItem {
  label: string;
  action: () => void;
  enabled?: boolean;
}

export class Menu {
  private scene: Phaser.Scene;
  private items: MenuItem[];
  private selectedIndex = 0;
  private buttons: Phaser.GameObjects.Text[] = [];
  private backgrounds: Phaser.GameObjects.Rectangle[] = [];
  private container: Phaser.GameObjects.Container;
  private onIndexChange?: (index: number) => void;

  constructor(
    scene: Phaser.Scene,
    items: MenuItem[],
    options: { x?: number; y?: number; depth?: number; scrollFactor?: number } = {},
  ) {
    this.scene = scene;
    this.items = items;

    const { width, height } = scene.scale;
    const { buttonHeight, buttonWidth, colors } = UI_STYLE;

    const x = options.x ?? width / 2;
    const y = options.y ?? height / 2;
    const scrollFactor = options.scrollFactor ?? 0;
    this.container = scene.add.container(x, y).setScrollFactor(scrollFactor);
    if (options.depth !== undefined) {
      this.container.setDepth(options.depth);
    }

    const totalHeight = items.length * (buttonHeight + 8);
    const startY = -totalHeight / 2 + buttonHeight / 2;

    items.forEach((item, index) => {
      const y = startY + index * (buttonHeight + 8);

      const bg = scene.add.rectangle(0, y, buttonWidth, buttonHeight, 0x1e40af)
        .setStrokeStyle(2, 0x3b82f6)
        .setScrollFactor(scrollFactor)
        .setInteractive({ useHandCursor: true })
        .setAlpha(item.enabled !== false ? 1 : 0.5);

      const txt = scene.add.text(0, y, item.label, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '18px',
        color: item.enabled !== false ? colors.text : colors.textSecondary,
      })
        .setOrigin(0.5)
        .setScrollFactor(scrollFactor)
        .setInteractive({ useHandCursor: true })
        .setAlpha(item.enabled !== false ? 1 : 0.5);

      const handleOver = () => {
        this.selectIndex(index);
        if (item.enabled !== false) {
          bg.setFillStyle(0x2563eb);
        }
      };

      const handleOut = () => {
        if (item.enabled !== false) {
          bg.setFillStyle(0x1e40af);
        }
      };

      const handleDown = () => {
        if (item.enabled !== false) {
          item.action();
        }
      };

      bg.on('pointerover', handleOver);
      bg.on('pointerout', handleOut);
      bg.on('pointerdown', handleDown);

      txt.on('pointerover', handleOver);
      txt.on('pointerout', handleOut);
      txt.on('pointerdown', handleDown);

      this.backgrounds.push(bg);
      this.buttons.push(txt);
      this.container.add([bg, txt]);
    });

    this.updateSelection();

    scene.input.keyboard?.on('keydown-UP', this.handleKeyUp, this);
    scene.input.keyboard?.on('keydown-DOWN', this.handleKeyDown, this);
    scene.input.keyboard?.on('keydown-ENTER', this.handleKeyEnter, this);
    scene.input.keyboard?.on('keydown-SPACE', this.handleKeyEnter, this);
  }

  private handleKeyUp(): void {
    this.selectIndex((this.selectedIndex - 1 + this.items.length) % this.items.length);
  }

  private handleKeyDown(): void {
    this.selectIndex((this.selectedIndex + 1) % this.items.length);
  }

  private handleKeyEnter(): void {
    const item = this.items[this.selectedIndex];
    if (item && item.enabled !== false) {
      item.action();
    }
  }

  selectIndex(index: number): void {
    this.selectedIndex = index;
    this.updateSelection();
    this.onIndexChange?.(index);
  }

  private updateSelection(): void {
    this.backgrounds.forEach((bg, index) => {
      const isSelected = index === this.selectedIndex;
      const item = this.items[index];
      if (isSelected && item.enabled !== false) {
        bg.setStrokeStyle(4, 0x60a5fa);
        bg.setFillStyle(0x2563eb);
      } else {
        bg.setStrokeStyle(2, 0x3b82f6);
        bg.setFillStyle(0x1e40af);
      }
    });

    this.buttons.forEach((txt, index) => {
      const isSelected = index === this.selectedIndex;
      const item = this.items[index];
      if (isSelected && item.enabled !== false) {
        txt.setColor('#ffffff');
      } else {
        txt.setColor(item.enabled !== false ? UI_STYLE.colors.text : UI_STYLE.colors.textSecondary);
      }
    });
  }

  setOnIndexChange(callback: (index: number) => void): void {
    this.onIndexChange = callback;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  destroy(): void {
    this.backgrounds.forEach((bg) => bg.destroy());
    this.buttons.forEach((txt) => txt.destroy());
    this.container.destroy();

    this.scene.input.keyboard?.off('keydown-UP', this.handleKeyUp, this);
    this.scene.input.keyboard?.off('keydown-DOWN', this.handleKeyDown, this);
    this.scene.input.keyboard?.off('keydown-ENTER', this.handleKeyEnter, this);
    this.scene.input.keyboard?.off('keydown-SPACE', this.handleKeyEnter, this);
  }
}
