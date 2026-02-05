import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { spawnBonus } from '../src/sim/systems/bonuses';

function collectPointsAmounts(seed: number, count: number): Set<number> {
  const sim = new Sim({ seed });
  const amounts = new Set<number>();

  for (let i = 0; i < count; i += 1) {
    const events = [];
    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'points');
    const bonus = sim.state.bonuses[sim.state.bonuses.length - 1];
    if (bonus?.amount !== undefined) {
      amounts.add(bonus.amount);
    }
  }

  return amounts;
}

describe('Sim: points bonus amounts', () => {
  it('produces both 500 and 1000 with a fixed seed', () => {
    const amounts = collectPointsAmounts(1, 200);
    expect(amounts.has(500)).toBe(true);
    expect(amounts.has(1000)).toBe(true);
  });
});
