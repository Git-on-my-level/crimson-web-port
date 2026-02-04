import Phaser from 'phaser';
import { Menu, type MenuItem } from '../ui/Menu';
import { UI_STYLE } from '../ui/style';
import { loadSettings, updateKeybindSetting, updateVolumeSettings, resetKeybindsToDefaults, resetVolumeToDefaults, type Keybinds } from '../persistence/settings';

type KeybindAction = keyof Keybinds;

const KEYBIND_LABELS: Record<KeybindAction, string> = {
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

export class OptionsScene extends Phaser.Scene {
  private menu?: Menu;
  private currentTab: 'keybinds' | 'volume' = 'keybinds';
  private keybindList?: Phaser.GameObjects.Container;
  private volumeSliders?: Phaser.GameObjects.Container;
  private remapPrompt?: Phaser.GameObjects.Text;
  private volumeDisplay: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('options');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, 50, 'Options', {
      ...UI_STYLE.text.title,
      fontSize: '40px',
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.createTabs(width, height);
    this.updateTabContent();
  }

  private createTabs(width: number, height: number): void {
    const tabButtons = [
      { label: 'Controls', tab: 'keybinds' as const },
      { label: 'Volume', tab: 'volume' as const },
    ];

    const tabY = 110;
    const tabWidth = 120;
    const tabSpacing = 140;
    const startX = width / 2 - tabSpacing;

    tabButtons.forEach((tab, index) => {
      const x = startX + index * tabSpacing;
      const isSelected = this.currentTab === tab.tab;

      const bg = this.add.rectangle(x, tabY, tabWidth, 40, isSelected ? 0x2563eb : 0x1e40af)
        .setStrokeStyle(isSelected ? 3 : 2, isSelected ? 0x60a5fa : 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, tabY, tab.label, {
        fontSize: '16px',
        color: isSelected ? '#ffffff' : UI_STYLE.colors.text,
        fontFamily: UI_STYLE.fontFamily,
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        this.currentTab = tab.tab;
        this.createTabs(width, height);
        this.updateTabContent();
      });
    });
  }

  private updateTabContent(): void {
    if (this.keybindList) {
      this.keybindList.destroy();
    }
    if (this.volumeSliders) {
      this.volumeSliders.destroy();
    }
    if (this.menu) {
      this.menu.destroy();
    }

    const { width } = this.scale;

    if (this.currentTab === 'keybinds') {
      this.createKeybindList(width);
    } else {
      this.createVolumeControls(width);
    }

    const menuItems: MenuItem[] = [
      {
        label: 'Back to Title',
        action: () => this.scene.start('title'),
      },
    ];

    this.menu = new Menu(this, menuItems);
  }

  private createKeybindList(width: number): void {
    const settings = loadSettings();
    const startY = 160;
    const rowHeight = 45;

    const container = this.add.container(width / 2, startY);

    const actions: KeybindAction[] = Object.keys(settings.keybinds) as KeybindAction[];

    actions.forEach((action, index) => {
      const y = index * rowHeight;

      const label = this.add.text(-200, y, KEYBIND_LABELS[action], {
        fontSize: '16px',
        color: UI_STYLE.colors.text,
        fontFamily: UI_STYLE.fontFamily,
      }).setOrigin(0, 0.5);

      const keyCode = settings.keybinds[action];
      const keyText = this.add.text(150, y, this.formatKeyCode(keyCode), {
        fontSize: '16px',
        color: '#60a5fa',
        fontFamily: UI_STYLE.fontFamily,
      }).setOrigin(0, 0.5);

      const buttonBg = this.add.rectangle(150, y, 80, 35, 0x1e40af)
        .setStrokeStyle(2, 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      buttonBg.on('pointerdown', () => {
        this.startRemap(action);
      });

      buttonBg.on('pointerover', () => {
        buttonBg.setFillStyle(0x2563eb);
      });

      buttonBg.on('pointerout', () => {
        buttonBg.setFillStyle(0x1e40af);
      });

      container.add([label, buttonBg, keyText]);
    });

    this.keybindList = container;

    const resetY = startY + actions.length * rowHeight + 30;
    const resetBtn = this.add.text(0, resetY, 'Reset to Defaults', {
      fontSize: '16px',
      color: '#f87171',
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerover', () => resetBtn.setColor('#fca5a5'));
    resetBtn.on('pointerout', () => resetBtn.setColor('#f87171'));
    resetBtn.on('pointerdown', () => {
      resetKeybindsToDefaults();
      this.updateTabContent();
    });

    container.add(resetBtn);
  }

  private createVolumeControls(width: number): void {
    const settings = loadSettings();
    const startY = 160;
    const rowHeight = 80;

    const container = this.add.container(width / 2, startY);

    const volumeTypes: Array<'master' | 'sfx' | 'music'> = ['master', 'sfx', 'music'];
    const labels: Record<string, string> = {
      master: 'Master Volume',
      sfx: 'SFX Volume',
      music: 'Music Volume',
    };

    this.volumeDisplay = [];

    volumeTypes.forEach((type, index) => {
      const y = index * rowHeight;

      const label = this.add.text(-200, y, labels[type], {
        fontSize: '16px',
        color: UI_STYLE.colors.text,
        fontFamily: UI_STYLE.fontFamily,
      }).setOrigin(0, 0.5);

      const value = settings.volume[type];
      const displayText = this.add.text(150, y, `${Math.round(value * 100)}%`, {
        fontSize: '16px',
        color: '#60a5fa',
        fontFamily: UI_STYLE.fontFamily,
      }).setOrigin(0, 0.5);

      this.volumeDisplay.push(displayText);

      const sliderBg = this.add.rectangle(150, y + 25, 200, 8, 0x1e40af);
      const sliderFill = this.add.rectangle(150 - 100 + value * 100, y + 25, value * 200, 8, 0x2563eb);

      const sliderHandle = this.add.circle(150 - 100 + value * 200, y + 25, 10, 0x60a5fa)
        .setInteractive({ useHandCursor: true, draggableY: false });

      let isDragging = false;

      sliderHandle.on('pointerdown', () => {
        isDragging = true;
        sliderHandle.setFillStyle(0xffffff);
      });

      this.input.on('pointerup', () => {
        if (isDragging) {
          isDragging = false;
          sliderHandle.setFillStyle(0x60a5fa);
        }
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (isDragging) {
          const localX = pointer.x - (width / 2 - 200);
          const clampedX = Math.max(0, Math.min(200, localX));
          const newValue = clampedX / 200;

          sliderHandle.x = width / 2 - 200 + clampedX;
          sliderFill.width = clampedX;
          sliderFill.x = width / 2 - 200 + clampedX / 2;

          displayText.text = `${Math.round(newValue * 100)}%`;

          updateVolumeSettings({ [type]: newValue });
        }
      });

      sliderHandle.on('drag', (pointer: Phaser.Input.Pointer) => {
        const localX = pointer.x - (width / 2 - 200);
        const clampedX = Math.max(0, Math.min(200, localX));
        const newValue = clampedX / 200;

        sliderHandle.x = width / 2 - 200 + clampedX;
        sliderFill.width = clampedX;
        sliderFill.x = width / 2 - 200 + clampedX / 2;

        displayText.text = `${Math.round(newValue * 100)}%`;

        updateVolumeSettings({ [type]: newValue });
      });

      container.add([label, sliderBg, sliderFill, sliderHandle, displayText]);
    });

    this.volumeSliders = container;

    const resetY = startY + volumeTypes.length * rowHeight + 30;
    const resetBtn = this.add.text(0, resetY, 'Reset to Defaults', {
      fontSize: '16px',
      color: '#f87171',
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerover', () => resetBtn.setColor('#fca5a5'));
    resetBtn.on('pointerout', () => resetBtn.setColor('#f87171'));
    resetBtn.on('pointerdown', () => {
      resetVolumeToDefaults();
      this.updateTabContent();
    });

    container.add(resetBtn);
  }

  private startRemap(action: KeybindAction): void {
    this.scene.pause();

    const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.8);

    this.remapPrompt = this.add.text(this.scale.width / 2, this.scale.height / 2, `Press a key for ${KEYBIND_LABELS[action]}...`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: UI_STYLE.fontFamily,
    }).setOrigin(0.5);

    this.input.keyboard!.once('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        this.cancelRemap(overlay);
        return;
      }

      const keyCode = this.eventToKeyCode(event);
      if (keyCode) {
        updateKeybindSetting(action, keyCode);
      }

      this.cancelRemap(overlay);
    });
  }

  private cancelRemap(overlay: Phaser.GameObjects.Rectangle): void {
    this.remapPrompt?.destroy();
    overlay.destroy();
    this.scene.resume();
    this.updateTabContent();
  }

  private eventToKeyCode(event: KeyboardEvent): string {
    const code = event.code;
    const keyMap: Record<string, string> = {
      'KeyW': 'W',
      'KeyA': 'A',
      'KeyS': 'S',
      'KeyD': 'D',
      'ArrowUp': 'UP',
      'ArrowDown': 'DOWN',
      'ArrowLeft': 'LEFT',
      'ArrowRight': 'RIGHT',
      'Space': 'SPACE',
      'KeyR': 'R',
      'KeyP': 'P',
      'Escape': 'ESC',
      'Digit1': 'ONE',
      'Digit2': 'TWO',
      'Digit3': 'THREE',
      'Digit4': 'FOUR',
      'Digit5': 'FIVE',
    };

    return keyMap[code] || code.toUpperCase();
  }

  private formatKeyCode(code: string): string {
    const displayNames: Record<string, string> = {
      'W': 'W', 'A': 'A', 'S': 'S', 'D': 'D',
      'UP': '↑', 'DOWN': '↓', 'LEFT': '←', 'RIGHT': '→',
      'SPACE': 'Space',
      'R': 'R', 'P': 'P', 'ESC': 'Esc',
      'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5',
    };

    return displayNames[code] || code;
  }

  shutdown(): void {
    this.menu?.destroy();
    this.keybindList?.destroy();
    this.volumeSliders?.destroy();
  }
}
