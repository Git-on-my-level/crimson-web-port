import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { CREATURE_SPAWN_MIN_DISTANCE, spawnCreatureAtEdge } from '../src/sim/systems/creatures';
import { isTerrainBlocked } from '../src/sim/terrain';
import { WORLD_BOUNDS } from '../src/sim/world';
import type { SimEvent } from '../src/sim/types';

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('Spawn avoidance', () => {
  it('spawns creatures away from the player', () => {
    const sim = new Sim({ seed: 1337 });
    const events: SimEvent[] = [];

    sim.state.player.pos.x = WORLD_BOUNDS.maxX - sim.state.player.radius;
    sim.state.player.pos.y = 0;

    for (let i = 0; i < 100; i += 1) {
      spawnCreatureAtEdge(sim.state, events, 'grunt');
    }

    for (const creature of sim.state.creatures) {
      const dist = distance(creature.pos, sim.state.player.pos);
      expect(dist).toBeGreaterThanOrEqual(CREATURE_SPAWN_MIN_DISTANCE - 0.01);
      expect(isTerrainBlocked(sim.state.terrain, creature.pos.x, creature.pos.y, creature.radius)).toBe(false);
    }
  });
});
