import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { EMPTY_INPUT } from '../src/sim/types';
import { spawnCreatureAtPosition } from '../src/sim/systems/creatures';

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

describe('Freeze bonus', () => {
  it('allows creatures to move when freeze is inactive', () => {
    const sim = new Sim({ seed: 31 });
    clearTerrain(sim);
    spawnTestCreature(sim);

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
    const movement = Math.hypot(updatedCreature.pos.x - initialX, updatedCreature.pos.y - initialY);
    expect(movement).toBeGreaterThan(0);
  });

  it('freezes creature movement while freeze is active', () => {
    const sim = new Sim({ seed: 32 });
    clearTerrain(sim);
    spawnTestCreature(sim);
    sim.state.player.activeEffects.freeze = 60;

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
