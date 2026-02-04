import Phaser from 'phaser';
import { UI_STYLE } from './style';
import { loadSettings, type Keybinds } from '../persistence/settings';

type KeybindAction = keyof Keybinds;

const ACTION_LABELS: Record<KeybindAction, string> = {
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  fire: 'Fire',
  reload: 'Reload',
  weaponSwitch1: 'Weapon 1',
  weaponSwitch2: 'Weapon 2',
  weaponSwitch3: 'Weapon 3',
  weaponSwitch4: 'Weapon 4',
  weaponSwitch5: 'Weapon 5',
  pause: 'Pause',
};

const ACTION_ORDER: KeybindAction[] = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'fire',
  'reload',
  'weaponSwitch1',
  'weaponSwitch2',
  'weaponSwitch3',
  'weaponSwitch4',
  'weaponSwitch5',
  'pause',
];

export class ControlsOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private entries: Phaser.GameObjects.Text[] = [];
  private visible = false;
  private overlayWidth = 0;
  private overlayHeight = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.container = scene.add.container(width / 2, height / 2);
    this.container.setDepth(950).setVisible(false);

    this.background = scene.add.rectangle(0, 0, 10, 10, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0x3b82f6);

    this.title = scene.add.text(0, 0, 'Controls', {
      ...UI_STYLE.text.title,
      fontFamily: UI_STYLE.fontFamily,
      fontSize: '36px',
    }).setOrigin(0.5);

    this.hint = scene.add.text(0, 0, 'Press Esc or H to close', {
      ...UI_STYLE.text.small,
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.container.add([this.background, this.title, this.hint]);
    this.resize(width, height);
    this.refresh();
  }

  show(): void {
    this.refresh();
    this.visible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  refresh(): void {
    this.entries.forEach((entry) => entry.destroy());
    this.entries = [];

    const settings = loadSettings();
    const startY = -this.overlayHeight / 2 + 96;
    const lineHeight = 26;
    const leftX = -this.overlayWidth / 2 + 40;

    ACTION_ORDER.forEach((action, index) => {
      const label = ACTION_LABELS[action];
      const key = this.formatKeyCode(settings.keybinds[action]);
      const text = `${label}: ${key}`;
      const entry = this.scene.add.text(leftX, startY + index * lineHeight, text, {
        fontFamily: UI_STYLE.fontFamily,
        fontSize: '16px',
        color: '#e2e8f0',
      }).setOrigin(0, 0.5);
      this.entries.push(entry);
      this.container.add(entry);
    });
  }

  resize(width: number, height: number): void {
    this.overlayWidth = Math.min(width * 0.8, 520);
    this.overlayHeight = Math.min(height * 0.8, 520);

    this.container.setPosition(width / 2, height / 2);
    this.background.setSize(this.overlayWidth, this.overlayHeight);
    this.title.setPosition(0, -this.overlayHeight / 2 + 40);
    this.hint.setPosition(0, this.overlayHeight / 2 - 30);
    if (this.visible) {
      this.refresh();
    }
  }

  destroy(): void {
    this.entries.forEach((entry) => entry.destroy());
    this.container.destroy();
  }

  private formatKeyCode(code: string): string {
    const displayNames: Record<string, string> = {
      'W': 'W',
      'A': 'A',
      'S': 'S',
      'D': 'D',
      'UP': 'Up',
      'DOWN': 'Down',
      'LEFT': 'Left',
      'RIGHT': 'Right',
      'SPACE': 'Space',
      'R': 'R',
      'P': 'P',
      'ESC': 'Esc',
      'ONE': '1',
      'TWO': '2',
      'THREE': '3',
      'FOUR': '4',
      'FIVE': '5',
    };

    return displayNames[code] || code;
  }
}
