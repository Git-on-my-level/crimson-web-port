import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { SimEvent } from '../src/sim/types';
import { spawnBonus, updateBonuses } from '../src/sim/systems/bonuses';

function setupSim(): Sim {
  const sim = new Sim({ seed: 123 });
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;
  return sim;
}

describe('Sim: bonus payloads', () => {
  it('stores weapon id at spawn and uses it on pickup', () => {
    const sim = setupSim();
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'weapon');
    const bonus = sim.state.bonuses[0];
    expect(bonus?.weaponId).toBeDefined();

    sim.state.player.pos.x = bonus.pos.x;
    sim.state.player.pos.y = bonus.pos.y;

    const expectedWeaponId = bonus.weaponId ?? sim.state.player.weaponId;
    updateBonuses(sim.state, events);

    expect(sim.state.player.weaponId).toBe(expectedWeaponId);
  });

  it('stores points amount and applies it on pickup', () => {
    const sim = setupSim();
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'points');
    const bonus = sim.state.bonuses[0];
    expect(bonus?.amount === 500 || bonus?.amount === 1000).toBe(true);

    sim.state.player.pos.x = bonus.pos.x;
    sim.state.player.pos.y = bonus.pos.y;

    updateBonuses(sim.state, events);

    expect(sim.state.score).toBe(bonus.amount ?? 0);
  });
});
