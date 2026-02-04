import Phaser from 'phaser';

const TEXTURE_KEY = 'terrain-q1-base';
const TILE_SIZE = 128;

export class TerrainBackground {
  private readonly tile: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.ensureTexture(scene);
    this.tile = scene.add
      .tileSprite(width / 2, height / 2, width, height, TEXTURE_KEY)
      .setDepth(-50)
      .setScrollFactor(0);
  }

  resize(width: number, height: number): void {
    this.tile.setPosition(width / 2, height / 2);
    this.tile.setSize(width, height);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.tile.tilePositionX = camera.scrollX * 0.4;
    this.tile.tilePositionY = camera.scrollY * 0.4;
  }

  private ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(TEXTURE_KEY)) {
      return;
    }

    const gfx = scene.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x0b0f1c, 1);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    gfx.fillStyle(0x0f172a, 0.8);
    for (let i = 0; i < 40; i += 1) {
      const size = 2 + (i % 3);
      const x = (i * 23) % TILE_SIZE;
      const y = (i * 37) % TILE_SIZE;
      gfx.fillRect(x, y, size, size);
    }

    gfx.lineStyle(1, 0x1f2937, 0.55);
    for (let i = 0; i <= TILE_SIZE; i += 32) {
      gfx.lineBetween(i, 0, i, TILE_SIZE);
      gfx.lineBetween(0, i, TILE_SIZE, i);
    }

    gfx.lineStyle(2, 0x1e293b, 0.7);
    gfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

    gfx.generateTexture(TEXTURE_KEY, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }
}
