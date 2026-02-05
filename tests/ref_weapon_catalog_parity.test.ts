import { describe, expect, it } from 'vitest';
import { WEAPONS, weaponIdFromRefId, type WeaponDef } from '../src/content/weapons';
import { extractRefSpecsFromFile } from '../src/tools/extract_ref_specs';

describe('ref weapon catalog parity', () => {
  it('contains all 53 weapons from the reference', () => {
    expect(WEAPONS.length).toBeGreaterThanOrEqual(53);
  });

  it('matches all reference weapon fields exactly', () => {
    const { weapon_table: refSpecs } = extractRefSpecsFromFile();
    const refByWeaponId = new Map(refSpecs.map((s) => [s.weapon_id, s]));

    for (const ref of refSpecs) {
      const weaponId = weaponIdFromRefId(ref.weapon_id);
      expect(weaponId).toBeTruthy();
      if (!weaponId) {
        throw new Error(`No weapon found for refId ${ref.weapon_id}`);
      }

      const weapon = WEAPONS.find((w) => w.id === weaponId);
      expect(weapon).toBeTruthy();
      if (!weapon) {
        continue;
      }

      expect(weapon.refId).toBe(ref.weapon_id);
      expect(weapon.clipSize).toBe(ref.clip_size);
      expect(weapon.shotCooldown).toBe(ref.shot_cooldown);
      expect(weapon.reloadTime).toBe(ref.reload_time);
      expect(weapon.spreadHeatInc).toBe(ref.spread_heat_inc);
      expect(weapon.pelletCount).toBe(ref.pellet_count);
      expect(weapon.damageScale).toBe(ref.damage_scale);
      expect(weapon.projectileMeta).toBe(ref.projectile_meta);
    }
  });

  it('provides stable mapping for all weapon IDs', () => {
    for (const weapon of WEAPONS) {
      const refId = weapon.refId;
      expect(refId).toBeGreaterThan(0);
      expect(refId).toBeLessThanOrEqual(53);

      const roundTripId = weaponIdFromRefId(refId);
      expect(roundTripId).toBe(weapon.id);
    }
  });

  it('has valid refId mapping for all 1-53 IDs', () => {
    for (let refId = 1; refId <= 53; refId++) {
      const weaponId = weaponIdFromRefId(refId);
      expect(weaponId).toBeTruthy();

      const weapon = WEAPONS.find((w) => w.id === weaponId);
      expect(weapon).toBeTruthy();
      expect(weapon?.refId).toBe(refId);
    }
  });
});
