import { describe, expect, it } from 'vitest';
import { WEAPONS, type WeaponId } from '../src/content/weapons';
import { extractRefSpecsFromFile } from '../src/tools/extract_ref_specs';

const TICKS_PER_SECOND = 60;

const REF_WEAPON_MAPPING: Record<WeaponId, string> = {
  pistol: 'Pistol',
  revolver: 'RayGun',
  shotgun: 'Shotgun',
  smg: 'Submachine Gun',
  burst_rifle: 'Assault Rifle',
  rifle: 'Ion Rifle',
  sniper: 'Gauss Gun',
  flamethrower: 'Flamethrower',
  plasma: 'Plasma Rifle',
  railgun: 'Ion Cannon',
  rocket: 'Rocket Launcher',
  laser: 'Pulse Gun',
};

describe('ref weapon table parity', () => {
  it('matches key weapon fields against the ref specs', () => {
    const { weapon_table } = extractRefSpecsFromFile();
    const refByName = new Map(weapon_table.map((weapon) => [weapon.name, weapon]));

    const mappedNames = new Set<string>();
    for (const weapon of WEAPONS) {
      const refName = REF_WEAPON_MAPPING[weapon.id];
      expect(refName).toBeTruthy();
      if (mappedNames.has(refName)) {
        throw new Error(`Duplicate ref weapon mapping for ${refName}`);
      }
      mappedNames.add(refName);

      const refWeapon = refByName.get(refName);
      expect(refWeapon).toBeTruthy();
      if (!refWeapon) {
        continue;
      }

      const expectedClip = weapon.ammoMax ?? null;
      const expectedReloadSeconds =
        weapon.reloadTicks !== undefined ? weapon.reloadTicks / TICKS_PER_SECOND : null;
      const expectedPellets = weapon.pellets ?? 1;

      expect(refWeapon.clip_size).toBe(expectedClip);
      expect(refWeapon.reload_time).toBe(expectedReloadSeconds);
      expect(refWeapon.pellet_count).toBe(expectedPellets);
    }
  });
});
