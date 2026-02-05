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

function measureDistanceDelta(reflexActive: boolean): number {
  const sim = new Sim({ seed: 77 });
  clearTerrain(sim);
  spawnTestCreature(sim);
  if (reflexActive) {
    sim.state.player.activeEffects.reflex_boost = 600;
  }

  const creature = sim.state.creatures[0];
  if (!creature) {
    throw new Error('Expected creature to exist');
  }
  const initialDist = Math.hypot(
    sim.state.player.pos.x - creature.pos.x,
    sim.state.player.pos.y - creature.pos.y,
  );

  const steps = 60;
  for (let i = 0; i < steps; i += 1) {
    sim.step(EMPTY_INPUT);
  }

  const updatedCreature = sim.state.creatures[0];
  if (!updatedCreature) {
    throw new Error('Expected creature to still exist');
  }
  const updatedDist = Math.hypot(
    sim.state.player.pos.x - updatedCreature.pos.x,
    sim.state.player.pos.y - updatedCreature.pos.y,
  );

  return initialDist - updatedDist;
}

describe('Reflex Boost bonus', () => {
  it('slows creature approach distance proportionally', () => {
    const baselineDelta = measureDistanceDelta(false);
    const slowedDelta = measureDistanceDelta(true);

    expect(baselineDelta).toBeGreaterThan(0);
    const ratio = slowedDelta / baselineDelta;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(0.7);
  });
});
