import type { Rng } from '../rng';
import type { Vec2 } from '../types';
import { refPos } from './survival_ref';

export type SurvivalWaveSpawn = {
  kind: string;
  pos: Vec2;
};

const TYPE_ID_TO_KIND: Record<number, string> = {
  0: 'zombie',
  1: 'runner',
  2: 'alien',
  3: 'spider',
  4: 'spider_elite',
  5: 'grunt',
};

export function tickSurvivalWaveSpawns(
  spawnCooldownMs: number,
  frameDtMs: number,
  rng: Rng,
  options: {
    playerCount: number;
    survivalElapsedMs: number;
    playerExperience: number;
    terrainWidth: number;
    terrainHeight: number;
  },
): { spawnCooldownMs: number; spawns: SurvivalWaveSpawn[] } {
  const { playerCount, survivalElapsedMs, playerExperience, terrainWidth, terrainHeight } = options;
  let cooldown = spawnCooldownMs - playerCount * frameDtMs;
  if (cooldown > -1) {
    return { spawnCooldownMs: cooldown, spawns: [] };
  }

  let intervalMs = 500 - Math.floor(survivalElapsedMs / 1800);
  const spawns: SurvivalWaveSpawn[] = [];

  if (intervalMs < 0) {
    const extra = (1 - intervalMs) >> 1;
    intervalMs += extra * 2;
    for (let i = 0; i < extra; i += 1) {
      spawns.push({
        kind: pickSurvivalWaveKind(rng, playerExperience),
        pos: randSurvivalSpawnPos(rng, terrainWidth, terrainHeight),
      });
    }
  }

  if (intervalMs < 1) {
    intervalMs = 1;
  }
  cooldown += intervalMs;

  spawns.push({
    kind: pickSurvivalWaveKind(rng, playerExperience),
    pos: randSurvivalSpawnPos(rng, terrainWidth, terrainHeight),
  });

  return { spawnCooldownMs: cooldown, spawns };
}

function randSurvivalSpawnPos(rng: Rng, terrainWidth: number, terrainHeight: number): Vec2 {
  const edge = rng.nextUint32() & 3;
  const xRef = rng.nextUint32() % terrainWidth;
  const yRef = rng.nextUint32() % terrainHeight;

  if (edge === 0) {
    return refPos(xRef, -40);
  }
  if (edge === 1) {
    return refPos(xRef, terrainHeight + 40);
  }
  if (edge === 2) {
    return refPos(-40, yRef);
  }
  return refPos(terrainWidth + 40, yRef);
}

function pickSurvivalWaveKind(rng: Rng, playerExperience: number): string {
  const xp = Math.floor(playerExperience);
  const r10 = rng.nextUint32() % 10;
  let typeId: number;

  if (xp < 12000) {
    typeId = r10 < 9 ? 2 : 3;
  } else if (xp < 25000) {
    typeId = r10 < 4 ? 0 : 3;
    if (r10 > 8) {
      typeId = 2;
    }
  } else if (xp < 42000) {
    if (r10 < 5) {
      typeId = 2;
    } else {
      typeId = (rng.nextUint32() & 1) + 3;
    }
  } else if (xp < 50000) {
    typeId = 2;
  } else if (xp < 90000) {
    typeId = 4;
  } else {
    if (xp > 109999) {
      if (r10 < 6) {
        typeId = 2;
      } else if (r10 < 9) {
        typeId = 4;
      } else {
        typeId = 0;
      }
    } else {
      typeId = 0;
    }
  }

  if ((rng.nextUint32() & 0x1f) === 2) {
    typeId = 3;
  }

  return TYPE_ID_TO_KIND[typeId] ?? 'grunt';
}
