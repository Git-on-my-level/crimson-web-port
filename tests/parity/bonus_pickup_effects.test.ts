import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import type { SimEvent } from '../../src/sim/types';
import { getBonusDef } from '../../src/content/bonuses';
import { spawnBonus, updateBonuses, getFireRateMultiplier, getXpMultiplier } from '../../src/sim/systems/bonuses';
import { WEAPON_BY_ID } from '../../src/content/weapons';

function setupSim(): Sim {
  const sim = new Sim({ seed: 77 });
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;
  return sim;
}

describe('Parity: bonus pickup effects', () => {
  it('applies instant medkit bonus on pickup', () => {
    const sim = setupSim();
    sim.state.player.hp = 50;
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'medkit');
    updateBonuses(sim.state, events);
    updateBonuses(sim.state, []);

    expect(sim.state.player.hp).toBe(60);
    expect(events.some((event) => event.type === 'pickup' && event.bonusType === 'medkit')).toBe(true);
    expect(sim.state.bonuses.length).toBe(0);
  });

  it('applies points to both score and xp on pickup', () => {
    const sim = setupSim();
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'points');
    const bonus = sim.state.bonuses[0];
    const amount = bonus?.amount ?? 0;

    sim.state.player.pos.x = bonus.pos.x;
    sim.state.player.pos.y = bonus.pos.y;
    updateBonuses(sim.state, events);

    expect(sim.state.score).toBe(amount);
    expect(sim.state.player.xp).toBe(amount);
    expect(events.some((event) => event.type === 'pickup' && event.bonusType === 'points')).toBe(true);
  });

  it('applies timed weapon power up bonus and expires', () => {
    const sim = setupSim();
    sim.state.player.weaponId = 'smg';
    sim.state.player.ammo = WEAPON_BY_ID.smg.ammoMax ?? 0;
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'weapon_power_up');
    updateBonuses(sim.state, events);

    expect(getFireRateMultiplier(sim.state.player)).toBeGreaterThan(1);

    const duration = getBonusDef('weapon_power_up').durationTicks ?? 0;
    for (let i = 0; i < duration; i += 1) {
      updateBonuses(sim.state, []);
    }

    expect(getFireRateMultiplier(sim.state.player)).toBe(1);
    updateBonuses(sim.state, []);
    expect(sim.state.player.activeEffects.weapon_power_up).toBeUndefined();
  });

  it('refreshes speed bonus and stacks double xp', () => {
    const sim = setupSim();
    const events: SimEvent[] = [];

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'speed');
    updateBonuses(sim.state, events);
    const speedDuration = getBonusDef('speed').durationTicks ?? 0;
    const doubleXpDuration = getBonusDef('double_xp').durationTicks ?? 0;
    expect(sim.state.player.activeEffects.speed).toBe(speedDuration);

    for (let i = 0; i < 10; i += 1) {
      updateBonuses(sim.state, []);
    }

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'speed');
    updateBonuses(sim.state, events);
    expect(sim.state.player.activeEffects.speed).toBe(speedDuration);

    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'double_xp');
    updateBonuses(sim.state, events);
    spawnBonus(sim.state, events, { x: 0, y: 0 }, 'double_xp');
    updateBonuses(sim.state, events);
    expect(sim.state.player.activeEffects.double_xp).toBeGreaterThanOrEqual(doubleXpDuration * 2 - 1);
    expect(getXpMultiplier(sim.state.player)).toBe(2);
  });
});
