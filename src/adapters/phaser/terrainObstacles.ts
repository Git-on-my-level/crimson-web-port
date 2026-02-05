import Phaser from 'phaser';
import type { TerrainGrid } from '../../sim/terrain';
import { WORLD_BOUNDS } from '../../sim/world';
import type { RenderTransform } from './render';

const OBSTACLE_COLOR = 0x101826;
const OBSTACLE_ALPHA = 0.85;
const BORDER_COLOR = 0x1f2937;
const BORDER_ALPHA = 0.9;
const BORDER_WIDTH = 2;
const OUTSIDE_COLOR = 0x0b0d12;
const OUTSIDE_ALPHA = 0.85;
const OUTSIDE_PADDING = 4000;

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

    const minX = this.transform.originX + WORLD_BOUNDS.minX * this.transform.pixelsPerUnit;
    const minY = this.transform.originY + WORLD_BOUNDS.minY * this.transform.pixelsPerUnit;
    const maxX = this.transform.originX + WORLD_BOUNDS.maxX * this.transform.pixelsPerUnit;
    const maxY = this.transform.originY + WORLD_BOUNDS.maxY * this.transform.pixelsPerUnit;
    this.graphics.fillStyle(OUTSIDE_COLOR, OUTSIDE_ALPHA);
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    this.graphics.fillRect(minX - OUTSIDE_PADDING, minY - OUTSIDE_PADDING, OUTSIDE_PADDING, worldHeight + OUTSIDE_PADDING * 2);
    this.graphics.fillRect(maxX, minY - OUTSIDE_PADDING, OUTSIDE_PADDING, worldHeight + OUTSIDE_PADDING * 2);
    this.graphics.fillRect(minX, minY - OUTSIDE_PADDING, worldWidth, OUTSIDE_PADDING);
    this.graphics.fillRect(minX, maxY, worldWidth, OUTSIDE_PADDING);

    this.graphics.lineStyle(BORDER_WIDTH, BORDER_COLOR, BORDER_ALPHA);
    this.graphics.strokeRect(minX, minY, maxX - minX, maxY - minY);
  }
}
