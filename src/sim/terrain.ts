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

const TERRAIN_CELL_SIZE = 8;
const TERRAIN_FILL_CHANCE = 0.12;
const TERRAIN_SMOOTH_PASSES = 2;
const TERRAIN_EDGE_CLEAR_CELLS = 1;
const TERRAIN_CLEAR_RADIUS = 8;
const TERRAIN_SPAWN_SEARCH_RADIUS = 10;

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

export function isTerrainBlocked(terrain: TerrainGrid, x: number, y: number, radius = 0): boolean {
  const minX = x - radius;
  const maxX = x + radius;
  const minY = y - radius;
  const maxY = y + radius;

  if (
    minX < WORLD_BOUNDS.minX ||
    maxX > WORLD_BOUNDS.maxX ||
    minY < WORLD_BOUNDS.minY ||
    maxY > WORLD_BOUNDS.maxY
  ) {
    return true;
  }

  const start = getTerrainCellCoords(terrain, minX, minY);
  const end = getTerrainCellCoords(terrain, maxX, maxY);
  const minCellX = Math.max(0, Math.min(start.cellX, end.cellX));
  const maxCellX = Math.min(terrain.width - 1, Math.max(start.cellX, end.cellX));
  const minCellY = Math.max(0, Math.min(start.cellY, end.cellY));
  const maxCellY = Math.min(terrain.height - 1, Math.max(start.cellY, end.cellY));

  for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      if (terrain.blocked[getTerrainIndex(terrain, cellX, cellY)]) {
        return true;
      }
    }
  }

  return false;
}

export function clampOrSlide(
  terrain: TerrainGrid,
  pos: Vec2,
  radius: number,
  prev: Vec2,
): boolean {
  if (!isTerrainBlocked(terrain, pos.x, pos.y, radius)) {
    return false;
  }

  const tryX = { x: pos.x, y: prev.y };
  if (!isTerrainBlocked(terrain, tryX.x, tryX.y, radius)) {
    pos.y = prev.y;
    return true;
  }

  const tryY = { x: prev.x, y: pos.y };
  if (!isTerrainBlocked(terrain, tryY.x, tryY.y, radius)) {
    pos.x = prev.x;
    return true;
  }

  pos.x = prev.x;
  pos.y = prev.y;
  return true;
}

export function findOpenTerrainPosition(
  terrain: TerrainGrid,
  rng: Rng,
  pos: Vec2,
  radius: number,
  attempts = 20,
): Vec2 {
  const clamped = clampToWorld({ x: pos.x, y: pos.y }, radius);
  if (!isTerrainBlocked(terrain, clamped.x, clamped.y, radius)) {
    return clamped;
  }

  for (let i = 0; i < attempts; i += 1) {
    const angle = rng.nextFloat01() * Math.PI * 2;
    const dist = rng.nextFloat01() * TERRAIN_SPAWN_SEARCH_RADIUS;
    const candidate = clampToWorld(
      {
        x: pos.x + Math.cos(angle) * dist,
        y: pos.y + Math.sin(angle) * dist,
      },
      radius,
    );
    if (!isTerrainBlocked(terrain, candidate.x, candidate.y, radius)) {
      return candidate;
    }
  }

  const nearest = findNearestOpenCell(terrain, clamped, radius, 6);
  return nearest ?? clamped;
}

function findNearestOpenCell(
  terrain: TerrainGrid,
  pos: Vec2,
  radius: number,
  maxRadiusCells: number,
): Vec2 | null {
  const start = getTerrainCellCoords(terrain, pos.x, pos.y);
  for (let r = 1; r <= maxRadiusCells; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) {
          continue;
        }
        const cellX = start.cellX + dx;
        const cellY = start.cellY + dy;
        if (cellX < 0 || cellY < 0 || cellX >= terrain.width || cellY >= terrain.height) {
          continue;
        }
        if (terrain.blocked[getTerrainIndex(terrain, cellX, cellY)]) {
          continue;
        }
        const center = cellToWorldCenter(terrain, cellX, cellY);
        const clamped = clampToWorld(center, radius);
        if (!isTerrainBlocked(terrain, clamped.x, clamped.y, radius)) {
          return clamped;
        }
      }
    }
  }
  return null;
}

function cellToWorldCenter(terrain: TerrainGrid, cellX: number, cellY: number): Vec2 {
  return {
    x: terrain.originX + (cellX + 0.5) * terrain.cellSize,
    y: terrain.originY + (cellY + 0.5) * terrain.cellSize,
  };
}
