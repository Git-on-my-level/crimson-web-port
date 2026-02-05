import Phaser from 'phaser';
import type { InputFrame } from '../../sim/types';
import { loadSettings, type Keybinds } from '../../persistence/settings';

export type InputTransform = {
  originX: number;
  originY: number;
  pixelsPerUnit: number;
};

export class PhaserInputAdapter {
  private readonly scene: Phaser.Scene;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly getTransform: () => InputTransform;
  private keybinds: Keybinds;
  private suppressPointerFireUntilUp: boolean;

  constructor(scene: Phaser.Scene, getTransform: () => InputTransform) {
    this.scene = scene;
    this.getTransform = getTransform;
    this.keybinds = loadSettings().keybinds;
    this.keys = this.setupKeys();
    this.suppressPointerFireUntilUp = this.scene.input.activePointer.isDown;
  }

  private setupKeys(): Record<string, Phaser.Input.Keyboard.Key> {
    const allCodes = new Set<string>();
    allCodes.add('W');
    allCodes.add('A');
    allCodes.add('S');
    allCodes.add('D');
    allCodes.add('UP');
    allCodes.add('DOWN');
    allCodes.add('LEFT');
    allCodes.add('RIGHT');
    allCodes.add('SPACE');
    allCodes.add('R');
    allCodes.add('P');
    allCodes.add('ESC');
    allCodes.add('TAB');
    allCodes.add('ONE');
    allCodes.add('TWO');
    allCodes.add('THREE');
    allCodes.add('FOUR');
    allCodes.add('FIVE');

    Object.values(this.keybinds).forEach(code => allCodes.add(code));

    return this.scene.input.keyboard?.addKeys(Array.from(allCodes).join(',')) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  reloadKeybinds(): void {
    this.keybinds = loadSettings().keybinds;
  }

  readInput(): InputFrame {
    const moveX = (this.isKeybindDown(this.keybinds.moveLeft) ? -1 : 0)
      + (this.isKeybindDown(this.keybinds.moveRight) ? 1 : 0);
    const moveY = (this.isKeybindDown(this.keybinds.moveUp) ? -1 : 0)
      + (this.isKeybindDown(this.keybinds.moveDown) ? 1 : 0);

    const pointer = this.scene.input.activePointer;
    if (this.suppressPointerFireUntilUp && !pointer.isDown) {
      this.suppressPointerFireUntilUp = false;
    }
    const { originX, originY, pixelsPerUnit } = this.getTransform();
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const aimWorldX = (world.x - originX) / pixelsPerUnit;
    const aimWorldY = (world.y - originY) / pixelsPerUnit;
    const pointerFire = pointer.isDown && !this.suppressPointerFireUntilUp;

    return {
      moveX,
      moveY,
      aimX: aimWorldX,
      aimY: aimWorldY,
      fire: pointerFire || this.isKeybindDown(this.keybinds.fire),
      reload: this.isKeybindDown(this.keybinds.reload),
      weaponSwitch: this.readWeaponSwitch(),
      pause: this.isKeybindDown(this.keybinds.pause) || this.isDown('ESC'),
      openPerkMenu: this.readOpenPerkMenu(),
      perkChoice: this.readPerkChoice(),
    };
  }

  private isDown(key: string): boolean {
    return Boolean(this.keys[key]?.isDown);
  }

  private isKeybindDown(keyCode: string): boolean {
    return Boolean(this.keys[keyCode]?.isDown);
  }

  private readWeaponSwitch(): number | null {
    const mapping: Array<[keyof Keybinds, number]> = [
      ['weaponSwitch1', 1],
      ['weaponSwitch2', 2],
      ['weaponSwitch3', 3],
      ['weaponSwitch4', 4],
      ['weaponSwitch5', 5],
    ];

    for (const [keybind, slot] of mapping) {
      const keyCode = this.keybinds[keybind];
      const keyObj = this.keys[keyCode];
      if (keyObj && Phaser.Input.Keyboard.JustDown(keyObj)) {
        return slot;
      }
    }

    return null;
  }

  private readPerkChoice(): number | null {
    const mapping: Array<[string, number]> = [
      ['ONE', 1],
      ['TWO', 2],
      ['THREE', 3],
    ];

    for (const [key, slot] of mapping) {
      const keyObj = this.keys[key];
      if (keyObj && Phaser.Input.Keyboard.JustDown(keyObj)) {
        return slot;
      }
    }

    return null;
  }

  private readOpenPerkMenu(): boolean {
    const keyObj = this.keys.TAB;
    return Boolean(keyObj && Phaser.Input.Keyboard.JustDown(keyObj));
  }
}
