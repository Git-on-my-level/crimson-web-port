import { describe, expect, it } from 'vitest';
import { createSimState } from '../src/sim/state';
import {
  getWeaponDropPool,
  pickRandomWeapon,
  refreshAvailableWeapons,
  unlockWeapon,
} from '../src/sim/weapons/weaponTable';

describe('Weapon availability', () => {
  it('only includes unlocked weapons plus pistol, sorted by refId', () => {
    const state = createSimState(7);
    refreshAvailableWeapons(state.player);

    expect(state.player.availableWeapons).toEqual(['pistol']);

    unlockWeapon(state.player, 'assault_rifle');
    unlockWeapon(state.player, 'plasma_rifle');
    refreshAvailableWeapons(state.player);

    expect(state.player.availableWeapons).toEqual(['pistol', 'assault_rifle', 'plasma_rifle']);
  });

  it('is deterministic and respects unlocked weapons', () => {
    const stateA = createSimState(123);
    const stateB = createSimState(123);

    refreshAvailableWeapons(stateA.player);
    refreshAvailableWeapons(stateB.player);

    unlockWeapon(stateA.player, 'gauss_gun');
    unlockWeapon(stateB.player, 'gauss_gun');

    const pickA = pickRandomWeapon(stateA.rng, stateA.player.availableWeapons);
    const pickB = pickRandomWeapon(stateB.rng, stateB.player.availableWeapons);

    expect(stateA.player.availableWeapons).toContain('gauss_gun');
    expect(pickA).toBe(pickB);
    expect(stateA.player.availableWeapons).toContain(pickA);
  });

  it('weapon drop pool includes advanced weapons and excludes placeholder entries', () => {
    const pool = getWeaponDropPool();
    expect(pool).toContain('gauss_gun');
    expect(pool).toContain('rocket_launcher');
    expect(pool).not.toContain('pistol');
    expect(pool.some((weaponId) => weaponId.startsWith('unknown_'))).toBe(false);
  });
});
