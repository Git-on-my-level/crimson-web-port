import { WEAPON_BY_ID, WEAPON_ORDER, WEAPONS, type WeaponDef, type WeaponId } from '../../content/weapons';
import type { Rng } from '../rng';

export function weaponTableInit(): WeaponDef[] {
  return WEAPONS;
}

export function getWeaponById(id: WeaponId): WeaponDef {
  return WEAPON_BY_ID[id] ?? WEAPONS[0];
}

export function getWeaponOrder(): WeaponId[] {
  return WEAPON_ORDER;
}

export function pickRandomWeapon(
  rng: Rng,
  allowed?: ReadonlyArray<WeaponId> | Set<WeaponId>
): WeaponId {
  let pool: ReadonlyArray<WeaponId> = WEAPON_ORDER;
  if (allowed) {
    if (allowed instanceof Set) {
      pool = WEAPON_ORDER.filter((weaponId) => allowed.has(weaponId));
    } else {
      pool = allowed;
    }
  }

  if (pool.length === 0) {
    return WEAPON_ORDER[0];
  }

  const index = Math.floor(rng.nextFloat01() * pool.length);
  return pool[index] ?? pool[0];
}
