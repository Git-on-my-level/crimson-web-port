import { describe, expect, it } from 'vitest';
import { createSimState } from '../src/sim/state';
import { getWeaponOrder, pickRandomWeapon, refreshAvailableWeapons, unlockWeapon } from '../src/sim/weapons/weaponTable';

describe('Weapon availability', () => {
  it('filters by unlock level in a stable order', () => {
    const state = createSimState(7);
    const expectedOrder = getWeaponOrder();
    expect(state.player.availableWeapons).toEqual(expectedOrder);

    state.player.level = 4;
    refreshAvailableWeapons(state.player);
    expect(state.player.availableWeapons).toEqual(expectedOrder);
  });

  it('is deterministic and respects unlocked weapons', () => {
    const stateA = createSimState(123);
    const stateB = createSimState(123);

    stateA.player.level = 3;
    stateB.player.level = 3;
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
});
