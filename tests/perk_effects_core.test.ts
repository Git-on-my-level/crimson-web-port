import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { createSimState } from '../src/sim/state';
import { grantXp } from '../src/sim/systems/progression';
import { recomputePerkStats } from '../src/sim/perks';
import type { SimEvent } from '../src/sim/types';
import { getWeaponById } from '../src/sim/weapons/weaponTable';
import { PERKS, PERK_BY_ID } from '../src/content/perks';

const NO_INPUT = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  openPerkMenu: false,
  perkChoice: null,
};

describe('Perk effects core', () => {
  it('Fastshot reduces shot cooldown by 12% (0.88 multiplier)', () => {
    const sim = new Sim({ seed: 42 });
    const weapon = getWeaponById('assault_rifle');
    if (!weapon) {
      throw new Error('Weapon not found');
    }

    const baseCooldown = weapon.shotCooldown ?? 0.1;

    sim.state.player.perks['fastshot'] = 1;
    sim.state.player.weaponId = 'assault_rifle';

    const events: SimEvent[] = [];
    sim.step({ ...NO_INPUT, fire: true });

    expect(sim.state.player.shotCooldown).toBeCloseTo(baseCooldown * 0.88, 3);
  });

  it('Fastloader reduces reload time by 30% (faster reload)', () => {
    const sim = new Sim({ seed: 42 });
    const weapon = getWeaponById('shotgun');
    if (!weapon) {
      throw new Error('Weapon not found');
    }

    const baseReloadTime = weapon.reloadTime ?? 0.5;

    sim.state.player.perks['fastloader'] = 1;
    recomputePerkStats(sim.state.player);
    sim.state.player.weaponId = 'shotgun';
    sim.state.player.ammo = 0;

    const events: SimEvent[] = [];
    sim.step({ ...NO_INPUT });

    sim.state.player.input = { ...NO_INPUT, reload: true };
    sim.step({ ...NO_INPUT });

    const expectedAfterOneTick = baseReloadTime - (1 / 60) * 1.43;
    expect(sim.state.player.reloadTimer).toBeCloseTo(expectedAfterOneTick, 3);
  });

  it('Sharpshooter pins spreadHeat to 0.02 regardless of firing', () => {
    const sim = new Sim({ seed: 42 });

    sim.state.player.perks['sharpshooter'] = 1;
    sim.state.player.spreadHeat = 0.3;

    const events: SimEvent[] = [];
    for (let i = 0; i < 10; i++) {
      sim.step({ ...NO_INPUT, fire: true });
    }

    expect(sim.state.player.spreadHeat).toBe(0.02);
  });

  it('Instant Winner adds exactly 2500 XP', () => {
    const sim = new Sim({ seed: 42 });
    const initialXp = sim.state.player.xp;

    sim.state.phase = 'PerkSelect';
    sim.state.perkChoices = ['instant_winner'];
    sim.state.pendingPerks = 1;

    const events: SimEvent[] = [];
    sim.step({ ...NO_INPUT, perkChoice: 1 });

    expect(sim.state.player.xp).toBe(initialXp + 2500);
  });

  it('Bloody Mess / Quick Learner increases XP multiplier by 30%', () => {
    const sim = new Sim({ seed: 42 });

    sim.state.player.perks['bloody_mess_quick_learner'] = 1;
    recomputePerkStats(sim.state.player);

    const events: SimEvent[] = [];
    grantXp(sim.state, events, 100);

    const xpEvent = events.find((e) => e.type === 'xp');
    expect(xpEvent).toBeDefined();
    expect(xpEvent?.amount).toBe(130);
  });

  it('Regeneration adds passive HP regen', () => {
    const sim = new Sim({ seed: 42 });

    sim.state.player.perks['regeneration'] = 1;
    recomputePerkStats(sim.state.player);
    sim.state.player.hp = 50;

    const events: SimEvent[] = [];
    sim.step({ ...NO_INPUT });

    expect(sim.state.player.hp).toBeGreaterThan(50);
    expect(sim.state.player.hp).toBeLessThan(51);
  });

  it('Long Distance Runner increases movement speed multiplier', () => {
    const state = createSimState(42);

    state.player.perks['long_distance_runner'] = 0;
    const baseSpeedMultiplier = state.player.perkStats.moveSpeedMultiplier;
    expect(baseSpeedMultiplier).toBe(1);

    state.player.perks['long_distance_runner'] = 1;
    recomputePerkStats(state.player);

    expect(state.player.perkStats.moveSpeedMultiplier).toBe(1.2);
  });

  it('Grim Deal sets hp to -1 and grants 18% XP bonus', () => {
    const sim = new Sim({ seed: 42 });
    sim.state.player.xp = 1000;
    sim.state.player.hp = 100;

    sim.state.phase = 'PerkSelect';
    sim.state.perkChoices = ['grim_deal'];
    sim.state.pendingPerks = 1;

    const events: SimEvent[] = [];
    sim.step({ ...NO_INPUT, perkChoice: 1 });

    expect(sim.state.player.hp).toBe(-1);
    expect(sim.state.player.xp).toBe(1180);
  });
});
