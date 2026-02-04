import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'Crimson Web Port', {
      fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif',
      fontSize: '48px',
      color: '#f5f5f5',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30, 'Press Enter or Click to Start', {
      fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif',
      fontSize: '20px',
      color: '#9aa4b2',
    }).setOrigin(0.5);

    const startGame = () => {
      this.scene.start('game');
    };

    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, startGame);
  }
}
