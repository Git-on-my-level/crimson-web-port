import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { WEAPON_BY_ID } from '../src/content/weapons';

describe('reload input consumption', () => {
  it('processes reload input exactly once per press', () => {
    const sim = new Sim({ seed: 42 });

    const pistol = sim.state.player.weaponId;
    const weapon = WEAPON_BY_ID[pistol];
    if (!weapon || weapon.ammoMax === undefined) {
      return;
    }

    sim.state.player.ammo = 1;
    sim.state.player.fireCooldownTicks = 0;
    sim.state.player.reloadTicksRemaining = 0;

    const baseInput: InputFrame = {
      moveX: 0,
      moveY: 0,
      aimX: sim.state.player.pos.x + 10,
      aimY: sim.state.player.pos.y,
      fire: false,
      reload: false,
      weaponSwitch: null,
      pause: false,
      perkChoice: null,
    };

    sim.step(baseInput);
    expect(sim.state.player.reloadTicksRemaining).toBe(0);

    sim.step({ ...baseInput, reload: true });
    const reloadTicksAfterPress = sim.state.player.reloadTicksRemaining;
    expect(reloadTicksAfterPress).toBeGreaterThan(0);

    let reloadStartedTick = 0;
    for (let i = 0; i < 10; i++) {
      sim.step({ ...baseInput, reload: true });
      if (sim.state.player.reloadTicksRemaining > reloadTicksAfterPress) {
        reloadStartedTick++;
      }
    }
    expect(reloadStartedTick).toBe(0);
  });

  it('auto-reloads when ammo reaches zero', () => {
    const sim = new Sim({ seed: 42 });

    const pistol = sim.state.player.weaponId;
    const weapon = WEAPON_BY_ID[pistol];
    if (!weapon || weapon.ammoMax === undefined) {
      return;
    }

    sim.state.player.ammo = 1;
    sim.state.player.fireCooldownTicks = 0;
    sim.state.player.reloadTicksRemaining = 0;

    const input: InputFrame = {
      moveX: 0,
      moveY: 0,
      aimX: sim.state.player.pos.x + 10,
      aimY: sim.state.player.pos.y,
      fire: true,
      reload: false,
      weaponSwitch: null,
      pause: false,
      perkChoice: null,
    };

    sim.step(input);
    sim.step({ ...input, fire: false });
    expect(sim.state.player.ammo).toBe(0);
    expect(sim.state.player.reloadTicksRemaining).toBeGreaterThan(0);
  });

  it('allows new reload after previous reload completes', () => {
    const sim = new Sim({ seed: 42 });

    const pistol = sim.state.player.weaponId;
    const weapon = WEAPON_BY_ID[pistol];
    if (!weapon || weapon.ammoMax === undefined) {
      return;
    }

    sim.state.player.ammo = 1;
    sim.state.player.fireCooldownTicks = 0;
    sim.state.player.reloadTicksRemaining = 0;

    const baseInput: InputFrame = {
      moveX: 0,
      moveY: 0,
      aimX: sim.state.player.pos.x + 10,
      aimY: sim.state.player.pos.y,
      fire: false,
      reload: false,
      weaponSwitch: null,
      pause: false,
      perkChoice: null,
    };

    sim.step({ ...baseInput, reload: true });
    expect(sim.state.player.reloadTicksRemaining).toBeGreaterThan(0);

    while (sim.state.player.reloadTicksRemaining > 0) {
      sim.step(baseInput);
    }
    expect(sim.state.player.ammo).toBe(weapon.ammoMax);

    sim.state.player.ammo = 1;
    sim.step({ ...baseInput, reload: true });
    expect(sim.state.player.reloadTicksRemaining).toBeGreaterThan(0);
  });
});
