import Phaser from 'phaser';

type CursorKeys = {
  up?: Phaser.Input.Keyboard.Key;
  down?: Phaser.Input.Keyboard.Key;
  left?: Phaser.Input.Keyboard.Key;
  right?: Phaser.Input.Keyboard.Key;
  W?: Phaser.Input.Keyboard.Key;
  A?: Phaser.Input.Keyboard.Key;
  S?: Phaser.Input.Keyboard.Key;
  D?: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: CursorKeys;
  private speed = 260;

  constructor() {
    super('game');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width * 0.9, height * 0.9, 0x111826)
      .setStrokeStyle(2, 0x1f2937);

    this.player = this.add.rectangle(width / 2, height / 2, 36, 36, 0xf97316);

    this.cursors = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as CursorKeys;
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.cursors) return;

    const moveX = (this.cursors.left?.isDown || this.cursors.A?.isDown ? -1 : 0)
      + (this.cursors.right?.isDown || this.cursors.D?.isDown ? 1 : 0);
    const moveY = (this.cursors.up?.isDown || this.cursors.W?.isDown ? -1 : 0)
      + (this.cursors.down?.isDown || this.cursors.S?.isDown ? 1 : 0);

    const length = Math.hypot(moveX, moveY) || 1;
    const velocityX = (moveX / length) * this.speed;
    const velocityY = (moveY / length) * this.speed;

    const dt = delta / 1000;
    const nextX = this.player.x + velocityX * dt;
    const nextY = this.player.y + velocityY * dt;

    const { width, height } = this.scale;
    const half = this.player.width / 2;

    this.player.x = Phaser.Math.Clamp(nextX, half, width - half);
    this.player.y = Phaser.Math.Clamp(nextY, half, height - half);
  }
}
