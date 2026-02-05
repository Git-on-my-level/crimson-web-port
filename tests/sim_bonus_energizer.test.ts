import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { resolveCollisions } from '../src/sim/systems/collision';
import { spawnCreatureAtPosition } from '../src/sim/systems/creatures';

function setupOverlap(sim: Sim): void {
  const spawnEvents: SimEvent[] = [];
  const playerPos = { x: sim.state.player.pos.x, y: sim.state.player.pos.y };
  spawnCreatureAtPosition(sim.state, spawnEvents, 'grunt', playerPos);
  const creature = sim.state.creatures[0];
  if (!creature) {
    throw new Error('Expected creature to spawn');
  }
  sim.state.player.pos.x = creature.pos.x;
  sim.state.player.pos.y = creature.pos.y;
}

describe('Energizer bonus', () => {
  it('kills overlapping creatures without hurting the player', () => {
    const sim = new Sim({ seed: 41 });
    setupOverlap(sim);
    sim.state.player.activeEffects.energizer = 60;

    const creature = sim.state.creatures[0];
    if (!creature) {
      throw new Error('Expected creature to spawn');
    }

    const initialHp = sim.state.player.hp;
    const initialXp = sim.state.player.xp;
    const events: SimEvent[] = [];
    resolveCollisions(sim.state, events);

    expect(sim.state.player.hp).toBe(initialHp);
    expect(creature.alive).toBe(false);
    expect(sim.state.player.xp).toBeGreaterThan(initialXp);
  });
});
