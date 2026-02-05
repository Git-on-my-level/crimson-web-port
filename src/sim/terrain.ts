import { Rng } from './rng';
import type { Vec2 } from './types';
import { WORLD_BOUNDS, clampToWorld } from './world';

export interface TerrainGrid {
  cellSize: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  blocked: Uint8Array;
}

const TERRAIN_CELL_SIZE = 4;
const TERRAIN_FILL_CHANCE = 0;
const TERRAIN_SMOOTH_PASSES = 0;
const TERRAIN_EDGE_CLEAR_CELLS = 1;
const TERRAIN_CLEAR_RADIUS = 6;

export function terrain_generate(seed: number): TerrainGrid {
  const rng = new Rng(seed ^ 0x9e3779b9);
  return terrain_generate_random(rng);
}

export function terrain_generate_random(rng: Rng): TerrainGrid {
  const width = Math.ceil((WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / TERRAIN_CELL_SIZE);
  const height = Math.ceil((WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY) / TERRAIN_CELL_SIZE);
  let blocked = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = x + y * width;
      blocked[idx] = rng.nextFloat01() < TERRAIN_FILL_CHANCE ? 1 : 0;
    }
  }

  for (let pass = 0; pass < TERRAIN_SMOOTH_PASSES; pass += 1) {
    const next = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = x + y * width;
        const neighbors = countNeighbors(blocked, width, height, x, y);
        if (blocked[idx]) {
          next[idx] = neighbors >= 3 ? 1 : 0;
        } else {
          next[idx] = neighbors >= 5 ? 1 : 0;
        }
      }
    }
    blocked = next;
  }

  clearEdges(blocked, width, height, TERRAIN_EDGE_CLEAR_CELLS);
  clearRadius(blocked, width, height, TERRAIN_CLEAR_RADIUS);

  return {
    cellSize: TERRAIN_CELL_SIZE,
    width,
    height,
    originX: WORLD_BOUNDS.minX,
    originY: WORLD_BOUNDS.minY,
    blocked,
  };
}

function countNeighbors(
  blocked: Uint8Array,
  width: number,
  height: number,
  cellX: number,
  cellY: number,
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = cellX + dx;
      const ny = cellY + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        continue;
      }
      if (blocked[nx + ny * width]) {
        count += 1;
      }
    }
  }
  return count;
}

function clearEdges(blocked: Uint8Array, width: number, height: number, cells: number): void {
  if (cells <= 0) {
    return;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x < cells || y < cells || x >= width - cells || y >= height - cells) {
        blocked[x + y * width] = 0;
      }
    }
  }
}

function clearRadius(blocked: Uint8Array, width: number, height: number, radiusWorld: number): void {
  if (radiusWorld <= 0) {
    return;
  }
  const centerX = Math.floor((0 - WORLD_BOUNDS.minX) / TERRAIN_CELL_SIZE);
  const centerY = Math.floor((0 - WORLD_BOUNDS.minY) / TERRAIN_CELL_SIZE);
  const radiusCells = Math.ceil(radiusWorld / TERRAIN_CELL_SIZE);

  for (let y = centerY - radiusCells; y <= centerY + radiusCells; y += 1) {
    if (y < 0 || y >= height) continue;
    for (let x = centerX - radiusCells; x <= centerX + radiusCells; x += 1) {
      if (x < 0 || x >= width) continue;
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= radiusCells * radiusCells) {
        blocked[x + y * width] = 0;
      }
    }
  }
}

export function getTerrainCellCoords(terrain: TerrainGrid, x: number, y: number): { cellX: number; cellY: number } {
  const cellX = Math.floor((x - terrain.originX) / terrain.cellSize);
  const cellY = Math.floor((y - terrain.originY) / terrain.cellSize);
  return { cellX, cellY };
}

export function getTerrainIndex(terrain: TerrainGrid, cellX: number, cellY: number): number {
  return cellX + cellY * terrain.width;
}

export function isTerrainBlocked(_terrain: TerrainGrid, x: number, y: number, radius = 0): boolean {
  const minX = x - radius;
  const maxX = x + radius;
  const minY = y - radius;
  const maxY = y + radius;

  return (
    minX < WORLD_BOUNDS.minX ||
    maxX > WORLD_BOUNDS.maxX ||
    minY < WORLD_BOUNDS.minY ||
    maxY > WORLD_BOUNDS.maxY
  );
}

export function clampOrSlide(
  _terrain: TerrainGrid,
  pos: Vec2,
  radius: number,
  _prev: Vec2,
): boolean {
  const originalX = pos.x;
  const originalY = pos.y;
  const clamped = clampToWorld({ x: pos.x, y: pos.y }, radius);
  pos.x = clamped.x;
  pos.y = clamped.y;
  return pos.x !== originalX || pos.y !== originalY;
}

export function findOpenTerrainPosition(
  _terrain: TerrainGrid,
  _rng: Rng,
  pos: Vec2,
  radius: number,
  _attempts = 20,
): Vec2 {
  return clampToWorld({ x: pos.x, y: pos.y }, radius);
}
