import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { isTerrainBlocked } from '../src/sim/terrain';
import { WORLD_BOUNDS, pickRandomWorldPos } from '../src/sim/world';

describe('Terrain background-only invariant', () => {
  it('isTerrainBlocked returns false for all in-bounds positions', () => {
    const sim = new Sim({ seed: 42 });
    const terrain = sim.state.terrain;
    const rng = sim.state.rng;

    const SAMPLE_COUNT = 50;

    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const pos = pickRandomWorldPos(rng, 5);
      const radius = rng.nextFloat01() * 3;
      expect(isTerrainBlocked(terrain, pos.x, pos.y, radius)).toBe(false);
    }
  });

  it('isTerrainBlocked returns true for out-of-bounds positions', () => {
    const sim = new Sim({ seed: 43 });
    const terrain = sim.state.terrain;

    const testCases = [
      { x: WORLD_BOUNDS.minX - 10, y: 0, radius: 0 },
      { x: WORLD_BOUNDS.maxX + 10, y: 0, radius: 0 },
      { x: 0, y: WORLD_BOUNDS.minY - 10, radius: 0 },
      { x: 0, y: WORLD_BOUNDS.maxY + 10, radius: 0 },
      { x: WORLD_BOUNDS.maxX - 1, y: 0, radius: 2 },
      { x: WORLD_BOUNDS.minX + 1, y: 0, radius: 2 },
      { x: 0, y: WORLD_BOUNDS.maxY - 1, radius: 2 },
      { x: 0, y: WORLD_BOUNDS.minY + 1, radius: 2 },
    ];

    for (const { x, y, radius } of testCases) {
      expect(isTerrainBlocked(terrain, x, y, radius)).toBe(true);
    }
  });

  it('terrain generates with all zeros in blocked array', () => {
    const sim = new Sim({ seed: 44 });
    const terrain = sim.state.terrain;

    for (let i = 0; i < terrain.blocked.length; i += 1) {
      expect(terrain.blocked[i]).toBe(0);
    }
  });
});
