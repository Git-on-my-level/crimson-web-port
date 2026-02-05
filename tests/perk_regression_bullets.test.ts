import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { getWeaponById } from '../src/sim/weapons/weaponTable';

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

describe('Regression Bullets', () => {
  it('fires while reloading with empty ammo and spends XP', () => {
    const sim = new Sim({ seed: 3 });
    const weapon = getWeaponById('assault_rifle');
    const reloadTime = weapon.reloadTime ?? 0;
    const ammoClass = weapon.ammoClass ?? 0;
    const factor = ammoClass === 1 ? 4 : 200;

    sim.state.player.perks['regression_bullets'] = 1;
    sim.state.player.weaponId = 'assault_rifle';
    sim.state.player.ammo = 0;
    sim.state.player.reloadTimer = Math.max(0.01, reloadTime || 1);
    sim.state.player.reloadTimerMax = sim.state.player.reloadTimer;
    sim.state.player.xp = 1000;

    const { events } = sim.step({ ...NO_INPUT, fire: true });

    const expectedXp = Math.max(0, Math.floor(1000 - reloadTime * factor));
    expect(sim.state.player.xp).toBe(expectedXp);
    expect(sim.state.player.ammo).toBe(0);
    expect(events.some((event) => event.type === 'spawnProjectile')).toBe(true);
  });
});
