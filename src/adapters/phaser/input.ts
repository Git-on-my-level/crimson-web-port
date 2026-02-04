import Phaser from 'phaser';
import type { InputFrame } from '../../sim/types';

export type InputTransform = {
  originX: number;
  originY: number;
  pixelsPerUnit: number;
};

export class PhaserInputAdapter {
  private readonly scene: Phaser.Scene;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly getTransform: () => InputTransform;

  constructor(scene: Phaser.Scene, getTransform: () => InputTransform) {
    this.scene = scene;
    this.getTransform = getTransform;
    this.keys = scene.input.keyboard?.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,R,P,ESC,ONE,TWO,THREE,FOUR,FIVE'
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  readInput(): InputFrame {
    const moveX = (this.isDown('LEFT') || this.isDown('A') ? -1 : 0)
      + (this.isDown('RIGHT') || this.isDown('D') ? 1 : 0);
    const moveY = (this.isDown('UP') || this.isDown('W') ? -1 : 0)
      + (this.isDown('DOWN') || this.isDown('S') ? 1 : 0);

    const pointer = this.scene.input.activePointer;
    const { originX, originY, pixelsPerUnit } = this.getTransform();
    const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const aimWorldX = (world.x - originX) / pixelsPerUnit;
    const aimWorldY = (world.y - originY) / pixelsPerUnit;

    return {
      moveX,
      moveY,
      aimX: aimWorldX,
      aimY: aimWorldY,
      fire: pointer.isDown || this.isDown('SPACE'),
      reload: this.isDown('R'),
      weaponSwitch: this.readWeaponSwitch(),
      pause: this.isDown('P') || this.isDown('ESC'),
      perkChoice: this.readPerkChoice(),
    };
  }

  private isDown(key: string): boolean {
    return Boolean(this.keys[key]?.isDown);
  }

  private readWeaponSwitch(): number | null {
    const mapping: Array<[string, number]> = [
      ['ONE', 1],
      ['TWO', 2],
      ['THREE', 3],
      ['FOUR', 4],
      ['FIVE', 5],
    ];

    for (const [key, slot] of mapping) {
      const keyObj = this.keys[key];
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
}
