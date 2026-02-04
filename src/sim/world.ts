import type { Rng } from './rng';
import type { Vec2 } from './types';

export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 2000;

export const WORLD_BOUNDS = {
  minX: -WORLD_WIDTH / 2,
  maxX: WORLD_WIDTH / 2,
  minY: -WORLD_HEIGHT / 2,
  maxY: WORLD_HEIGHT / 2,
};

export function clampToWorld(pos: Vec2, radius = 0): Vec2 {
  const minX = WORLD_BOUNDS.minX + radius;
  const maxX = WORLD_BOUNDS.maxX - radius;
  const minY = WORLD_BOUNDS.minY + radius;
  const maxY = WORLD_BOUNDS.maxY - radius;

  if (pos.x < minX) pos.x = minX;
  if (pos.x > maxX) pos.x = maxX;
  if (pos.y < minY) pos.y = minY;
  if (pos.y > maxY) pos.y = maxY;

  return pos;
}

export function pickRandomWorldEdge(rng: Rng, margin = 0): Vec2 {
  const minX = WORLD_BOUNDS.minX + margin;
  const maxX = WORLD_BOUNDS.maxX - margin;
  const minY = WORLD_BOUNDS.minY + margin;
  const maxY = WORLD_BOUNDS.maxY - margin;
  const side = rng.nextInt(4);
  const t = rng.nextFloat01();

  if (side === 0) {
    return { x: minX, y: minY + t * (maxY - minY) };
  }
  if (side === 1) {
    return { x: maxX, y: minY + t * (maxY - minY) };
  }
  if (side === 2) {
    return { x: minX + t * (maxX - minX), y: minY };
  }
  return { x: minX + t * (maxX - minX), y: maxY };
}

export function pickRandomWorldPos(rng: Rng, margin = 0): Vec2 {
  const minX = WORLD_BOUNDS.minX + margin;
  const maxX = WORLD_BOUNDS.maxX - margin;
  const minY = WORLD_BOUNDS.minY + margin;
  const maxY = WORLD_BOUNDS.maxY - margin;
  return {
    x: minX + rng.nextFloat01() * (maxX - minX),
    y: minY + rng.nextFloat01() * (maxY - minY),
  };
}

export function findSpawnPosAwayFromPlayer(
  rng: Rng,
  playerPos: Vec2,
  minDistance: number,
  attempts = 20,
  pickCandidate?: (rng: Rng) => Vec2,
  isValid?: (pos: Vec2) => boolean,
): Vec2 {
  const minDistSq = minDistance * minDistance;
  const candidateFn = pickCandidate ?? ((nextRng: Rng) => pickRandomWorldEdge(nextRng, 0));

  let best = candidateFn(rng);
  let bestDistSq = (best.x - playerPos.x) ** 2 + (best.y - playerPos.y) ** 2;
  let bestValid = isValid ? isValid(best) : true;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = candidateFn(rng);
    const dx = candidate.x - playerPos.x;
    const dy = candidate.y - playerPos.y;
    const distSq = dx * dx + dy * dy;
    const valid = isValid ? isValid(candidate) : true;

    if (valid && distSq >= minDistSq) {
      return candidate;
    }

    if (valid && (!bestValid || distSq > bestDistSq)) {
      best = candidate;
      bestDistSq = distSq;
      bestValid = true;
    } else if (!bestValid && distSq > bestDistSq) {
      best = candidate;
      bestDistSq = distSq;
    }
  }

  return best;
}
