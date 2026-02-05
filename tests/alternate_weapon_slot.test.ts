import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';

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

describe('Alternate weapon slot', () => {
  it('swaps weapon state without losing ammo or reload timers', () => {
    const sim = new Sim({ seed: 4 });
    const dt = sim.fixedDeltaSeconds;

    sim.state.player.perks['alternate_weapon'] = 1;

    sim.state.player.weaponId = 'pistol';
    sim.state.player.ammo = 5;
    sim.state.player.reloadTimer = 0.6;
    sim.state.player.reloadTimerMax = 1.2;
    sim.state.player.shotCooldown = 0.2;
    sim.state.player.spreadHeat = 0.12;

    sim.state.player.altWeaponId = 'shotgun';
    sim.state.player.altAmmo = 2;
    sim.state.player.altReloadTimer = 0.4;
    sim.state.player.altReloadTimerMax = 0.9;
    sim.state.player.altShotCooldown = 0.5;
    sim.state.player.altSpreadHeat = 0.3;

    sim.step({ ...NO_INPUT, reload: true });

    expect(sim.state.player.weaponId).toBe('shotgun');
    expect(sim.state.player.ammo).toBe(2);
    expect(sim.state.player.altWeaponId).toBe('pistol');
    expect(sim.state.player.altAmmo).toBe(5);
    expect(sim.state.player.altReloadTimer).toBeCloseTo(0.6, 4);
    expect(sim.state.player.reloadTimer).toBeCloseTo(0.4 - dt, 4);
    expect(sim.state.player.shotCooldown).toBeCloseTo(0.5 + 0.1, 4);
  });
});
