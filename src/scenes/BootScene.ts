import Phaser from 'phaser';
import { PhaserAudioAdapter } from '../adapters/phaser/audio';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    const audio = new PhaserAudioAdapter(this);
    audio.initMusic();
    audio.initSfx();
    audio.shutdownAll();
    this.scene.start('preload');
  }
}
