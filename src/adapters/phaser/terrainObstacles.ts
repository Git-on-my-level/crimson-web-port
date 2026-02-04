import Phaser from 'phaser';
import type { TerrainGrid } from '../../sim/terrain';
import type { RenderTransform } from './render';

const OBSTACLE_COLOR = 0x101826;
const OBSTACLE_ALPHA = 0.85;

export class TerrainObstacles {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private transform: RenderTransform;
  private terrain: TerrainGrid;

  constructor(scene: Phaser.Scene, transform: RenderTransform, terrain: TerrainGrid) {
    this.transform = transform;
    this.terrain = terrain;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-30);
    this.redraw();
  }

  setTransform(transform: RenderTransform): void {
    this.transform = transform;
    this.redraw();
  }

  setTerrain(terrain: TerrainGrid): void {
    this.terrain = terrain;
    this.redraw();
  }

  private redraw(): void {
    this.graphics.clear();
    this.graphics.fillStyle(OBSTACLE_COLOR, OBSTACLE_ALPHA);

    const { cellSize, width, height, originX, originY, blocked } = this.terrain;
    const sizePx = cellSize * this.transform.pixelsPerUnit;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!blocked[x + y * width]) {
          continue;
        }
        const worldX = originX + x * cellSize;
        const worldY = originY + y * cellSize;
        const screenX = this.transform.originX + worldX * this.transform.pixelsPerUnit;
        const screenY = this.transform.originY + worldY * this.transform.pixelsPerUnit;
        this.graphics.fillRect(screenX, screenY, sizePx, sizePx);
      }
    }
  }
}
