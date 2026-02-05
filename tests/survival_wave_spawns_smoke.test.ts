import { describe, expect, it } from 'vitest';
import { Rng } from '../src/sim/rng';
import { tickSurvivalWaveSpawns } from '../src/sim/modes/survival_wave_spawns';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../src/sim/world';

const TICKS_PER_SECOND = 60;
const DURATION_SECONDS = 60;
const DT_MS = 1000 / TICKS_PER_SECOND;

function runWave(seed: number): { count: number; sample: Array<{ kind: string; x: number; y: number }> } {
  const rng = new Rng(seed);
  let spawnCooldownMs = 0;
  let elapsedMs = 0;
  const sample: Array<{ kind: string; x: number; y: number }> = [];
  let count = 0;

  for (let tick = 0; tick < DURATION_SECONDS * TICKS_PER_SECOND; tick += 1) {
    const result = tickSurvivalWaveSpawns(spawnCooldownMs, DT_MS, rng, {
      playerCount: 1,
      survivalElapsedMs: elapsedMs,
      playerExperience: 45000,
      terrainWidth: WORLD_WIDTH,
      terrainHeight: WORLD_HEIGHT,
    });
    spawnCooldownMs = result.spawnCooldownMs;
    elapsedMs += DT_MS;

    for (const spawn of result.spawns) {
      count += 1;
      if (sample.length < 10) {
        sample.push({ kind: spawn.kind, x: spawn.pos.x, y: spawn.pos.y });
      }
    }
  }

  return { count, sample };
}

describe('Survival wave spawns', () => {
  it('produces deterministic wave spawns over 60 seconds', () => {
    const runA = runWave(1337);
    const runB = runWave(1337);

    expect(runA.count).toBeGreaterThan(0);
    expect(runA.count).toBeLessThan(20000);
    expect(runA.count).toBe(runB.count);
    expect(runA.sample).toEqual(runB.sample);
  });
});
