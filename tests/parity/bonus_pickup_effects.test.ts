import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import type { SimEvent } from '../../src/sim/types';
import { getBonusDef } from '../../src/content/bonuses';
import { spawnBonus, updateBonuses, getFireRateMultiplier } from '../../src/sim/systems/bonuses';
import { WEAPON_BY_ID } from '../../src/content/weapons';

function setupSim(): Sim {
  const sim = new Sim({ seed: 77 });
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;
  return sim;
}

describe('Parity: bonus pickup effects', () => {
  it('applies instant ammo bonus on pickup', () => {
    const sim = setupSim();
    sim.state.player.weaponId = 'smg';
    sim.state.player.ammo = 0;
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'ammo');
    updateBonuses(sim.state, events);
    updateBonuses(sim.state, []);

    const weapon = WEAPON_BY_ID.smg;
    expect(sim.state.player.ammo).toBe(weapon.ammoMax);
    expect(events.some((event) => event.type === 'pickup' && event.bonusType === 'ammo')).toBe(true);
    expect(sim.state.bonuses.length).toBe(0);
  });

  it('applies timed fire rate bonus and expires', () => {
    const sim = setupSim();
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'fire_rate_boost');
    updateBonuses(sim.state, events);

    expect(getFireRateMultiplier(sim.state.player)).toBeGreaterThan(1);

    const duration = getBonusDef('fire_rate_boost').durationTicks ?? 0;
    for (let i = 0; i < duration; i += 1) {
      updateBonuses(sim.state, []);
    }

    expect(getFireRateMultiplier(sim.state.player)).toBe(1);
    updateBonuses(sim.state, []);
    expect(sim.state.player.activeEffects.fire_rate_boost).toBeUndefined();
  });
});
