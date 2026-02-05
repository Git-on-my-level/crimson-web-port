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
  creature.aiMode = 2;
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
  let prevX = creature.pos.x;
  let prevY = creature.pos.y;
  let totalDistance = 0;

  const steps = 60;
  for (let i = 0; i < steps; i += 1) {
    sim.step(EMPTY_INPUT);
    const updatedCreature = sim.state.creatures[0];
    if (!updatedCreature) {
      throw new Error('Expected creature to still exist');
    }
    const stepDistance = Math.hypot(updatedCreature.pos.x - prevX, updatedCreature.pos.y - prevY);
    totalDistance += stepDistance;
    prevX = updatedCreature.pos.x;
    prevY = updatedCreature.pos.y;
  }

  return totalDistance;
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
