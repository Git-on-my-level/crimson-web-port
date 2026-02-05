import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { EMPTY_INPUT } from '../../src/sim/types';
import { spawnCreatureAtPosition } from '../../src/sim/systems/creatures';

function clearTerrain(sim: Sim): void {
  sim.state.terrain.blocked.fill(0);
}

function spawnTestCreature(sim: Sim): void {
  spawnCreatureAtPosition(sim.state, [], 'grunt', { x: 10, y: 0 });
  const creature = sim.state.creatures[0];
  if (!creature) {
    throw new Error('Expected creature to spawn');
  }
}

describe('ref parity: freeze bonus', () => {
  it('stops creature movement while freeze is active', () => {
    const sim = new Sim({ seed: 32 });
    clearTerrain(sim);
    spawnTestCreature(sim);
    sim.state.player.activeEffects.freeze = 300;

    const creature = sim.state.creatures[0];
    if (!creature) {
      throw new Error('Expected creature to spawn');
    }
    const initialX = creature.pos.x;
    const initialY = creature.pos.y;

    for (let i = 0; i < 60; i += 1) {
      sim.step(EMPTY_INPUT);
    }

    const updatedCreature = sim.state.creatures[0];
    if (!updatedCreature) {
      throw new Error('Expected creature to still exist');
    }
    expect(updatedCreature.pos.x).toBe(initialX);
    expect(updatedCreature.pos.y).toBe(initialY);
  });
});
