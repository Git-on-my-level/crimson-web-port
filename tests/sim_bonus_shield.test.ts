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

describe('Shield bonus', () => {
  it('applies touch damage when shield is inactive', () => {
    const sim = new Sim({ seed: 21 });
    setupOverlap(sim);

    const initialHp = sim.state.player.hp;
    const events: SimEvent[] = [];
    resolveCollisions(sim.state, events);

    expect(sim.state.player.hp).toBeLessThan(initialHp);
    expect(events.some((event) => event.type === 'damage' && event.target === 'player')).toBe(true);
  });

  it('blocks touch damage and events when shield is active', () => {
    const sim = new Sim({ seed: 22 });
    setupOverlap(sim);
    sim.state.player.activeEffects.shield = 60;

    const initialHp = sim.state.player.hp;
    const events: SimEvent[] = [];
    resolveCollisions(sim.state, events);

    expect(sim.state.player.hp).toBe(initialHp);
    expect(events.some((event) => event.type === 'damage' && event.target === 'player')).toBe(false);
    expect(events.some((event) => event.type === 'death' && event.target === 'player')).toBe(false);
  });
});
