import Phaser from 'phaser';

const BASE_TEXTURE_KEY = 'terrain-q1-fb';
const DETAIL_TEXTURE_KEY = 'terrain-q1-base';
const FALLBACK_TEXTURE_KEY = 'terrain-fallback';
const FALLBACK_TILE_SIZE = 256;
const BACKDROP_COLOR = 0x352c19;
const DETAIL_TILE_LARGE_SCALE = 1.6;
const DETAIL_TILE_LARGE_ALPHA = 0.35;
const DETAIL_TILE_ALPHA = 0.55;
const DETAIL_TILE_LARGE_OFFSET_X = 97;
const DETAIL_TILE_LARGE_OFFSET_Y = 41;

export class TerrainBackground {
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly baseTile: Phaser.GameObjects.TileSprite;
  private readonly detailTile?: Phaser.GameObjects.TileSprite;
  private readonly detailTileLarge?: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.ensureFallbackTexture(scene);
    const baseKey = scene.textures.exists(BASE_TEXTURE_KEY) ? BASE_TEXTURE_KEY : FALLBACK_TEXTURE_KEY;
    const detailKey = scene.textures.exists(DETAIL_TEXTURE_KEY) ? DETAIL_TEXTURE_KEY : null;

    this.backdrop = scene.add
      .rectangle(width / 2, height / 2, width, height, BACKDROP_COLOR, 1)
      .setDepth(-60)
      .setScrollFactor(0);

    this.baseTile = scene.add
      .tileSprite(width / 2, height / 2, width, height, baseKey)
      .setDepth(-50)
      .setScrollFactor(0);

    if (detailKey) {
      this.detailTileLarge = scene.add
        .tileSprite(width / 2, height / 2, width, height, detailKey)
        .setDepth(-45)
        .setScrollFactor(0)
        .setAlpha(DETAIL_TILE_LARGE_ALPHA)
        .setTileScale(DETAIL_TILE_LARGE_SCALE);
      this.detailTile = scene.add
        .tileSprite(width / 2, height / 2, width, height, detailKey)
        .setDepth(-40)
        .setScrollFactor(0)
        .setAlpha(DETAIL_TILE_ALPHA);
    }
  }

  resize(width: number, height: number): void {
    this.backdrop.setPosition(width / 2, height / 2);
    this.backdrop.setSize(width, height);
    this.baseTile.setPosition(width / 2, height / 2);
    this.baseTile.setSize(width, height);
    this.detailTileLarge?.setPosition(width / 2, height / 2);
    this.detailTileLarge?.setSize(width, height);
    this.detailTile?.setPosition(width / 2, height / 2);
    this.detailTile?.setSize(width, height);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.baseTile.tilePositionX = camera.scrollX;
    this.baseTile.tilePositionY = camera.scrollY;
    if (this.detailTileLarge) {
      this.detailTileLarge.tilePositionX = camera.scrollX + DETAIL_TILE_LARGE_OFFSET_X;
      this.detailTileLarge.tilePositionY = camera.scrollY + DETAIL_TILE_LARGE_OFFSET_Y;
    }
    if (this.detailTile) {
      this.detailTile.tilePositionX = camera.scrollX;
      this.detailTile.tilePositionY = camera.scrollY;
    }
  }

  private ensureFallbackTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(FALLBACK_TEXTURE_KEY)) {
      return;
    }

    const gfx = scene.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(BACKDROP_COLOR, 1);
    gfx.fillRect(0, 0, FALLBACK_TILE_SIZE, FALLBACK_TILE_SIZE);

    gfx.fillStyle(0x0f172a, 0.8);
    for (let i = 0; i < 40; i += 1) {
      const size = 2 + (i % 3);
      const x = (i * 23) % FALLBACK_TILE_SIZE;
      const y = (i * 37) % FALLBACK_TILE_SIZE;
      gfx.fillRect(x, y, size, size);
    }

    gfx.lineStyle(1, 0x1f2937, 0.55);
    for (let i = 0; i <= FALLBACK_TILE_SIZE; i += 32) {
      gfx.lineBetween(i, 0, i, FALLBACK_TILE_SIZE);
      gfx.lineBetween(0, i, FALLBACK_TILE_SIZE, i);
    }

    gfx.lineStyle(2, 0x1e293b, 0.7);
    gfx.strokeRect(0, 0, FALLBACK_TILE_SIZE, FALLBACK_TILE_SIZE);

    gfx.generateTexture(FALLBACK_TEXTURE_KEY, FALLBACK_TILE_SIZE, FALLBACK_TILE_SIZE);
    gfx.destroy();
  }
}
