import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { refreshAvailableWeapons, unlockWeapon, type WeaponAvailabilityCarrier } from '../src/sim/weapons/weaponTable';
import { WEAPON_BY_ID } from '../src/content/weapons';

describe('Weapon availability candidates', () => {
  it('contains at least pistol with empty unlocked set and is deterministic', () => {
    const sim1 = new Sim({ seed: 1 });
    const sim2 = new Sim({ seed: 1 });

    const available1 = refreshAvailableWeapons(sim1.state.player);
    const available2 = refreshAvailableWeapons(sim2.state.player);

    expect(available1.length).toBeGreaterThan(0);
    expect(available1).toContain('pistol');
    expect(available1).toEqual(available2);
  });

  it('adds unlocked weapon to candidate list', () => {
    const sim = new Sim({ seed: 1 });

    const initialAvailable = refreshAvailableWeapons(sim.state.player);
    expect(initialAvailable).toContain('pistol');
    expect(initialAvailable).not.toContain('assault_rifle');

    unlockWeapon(sim.state.player, 'assault_rifle');
    const afterUnlock = refreshAvailableWeapons(sim.state.player);
    expect(afterUnlock).toContain('pistol');
    expect(afterUnlock).toContain('assault_rifle');
  });

  it('no level dependence - available weapons do not change with level', () => {
    const sim = new Sim({ seed: 1 });

    sim.state.player.unlockedWeapons.clear();
    sim.state.player.unlockedWeapons.add('pistol');

    const level1Available = refreshAvailableWeapons(sim.state.player);

    sim.state.player.level = 50;
    const level50Available = refreshAvailableWeapons(sim.state.player);

    expect(level1Available).toEqual(level50Available);
  });

  it('candidate list is sorted by refId for determinism', () => {
    const sim = new Sim({ seed: 1 });

    unlockWeapon(sim.state.player, 'plasma_rifle');
    unlockWeapon(sim.state.player, 'shotgun');
    unlockWeapon(sim.state.player, 'assault_rifle');

    const available = refreshAvailableWeapons(sim.state.player);

    const refIds = available.map((id) => WEAPON_BY_ID[id]?.refId ?? 0);
    const sortedRefIds = [...refIds].sort((a, b) => a - b);

    expect(refIds).toEqual(sortedRefIds);
  });

  it('removing a weapon from unlocked removes it from available', () => {
    const sim = new Sim({ seed: 1 });

    unlockWeapon(sim.state.player, 'assault_rifle');
    unlockWeapon(sim.state.player, 'shotgun');

    const withUnlocks = refreshAvailableWeapons(sim.state.player);
    expect(withUnlocks).toContain('assault_rifle');
    expect(withUnlocks).toContain('shotgun');

    sim.state.player.unlockedWeapons.delete('assault_rifle');
    const afterDelete = refreshAvailableWeapons(sim.state.player);
    expect(afterDelete).not.toContain('assault_rifle');
    expect(afterDelete).toContain('shotgun');
  });
});
