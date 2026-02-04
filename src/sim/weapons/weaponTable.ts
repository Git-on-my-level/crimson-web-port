import { WEAPON_BY_ID, WEAPON_ORDER, WEAPONS, type WeaponDef, type WeaponId } from '../../content/weapons';
import type { Rng } from '../rng';

export type WeaponAvailabilityCarrier = {
  level: number;
  unlockedWeapons: Set<WeaponId>;
  availableWeapons: WeaponId[];
};

export type WeaponCarrier = {
  weaponId: WeaponId;
  ammo: number;
  reloadTicksRemaining: number;
  fireCooldownTicks: number;
};

export function weaponTableInit(): WeaponDef[] {
  return WEAPONS;
}

export function getWeaponById(id: WeaponId): WeaponDef {
  return WEAPON_BY_ID[id] ?? WEAPONS[0];
}

export function getWeaponOrder(): WeaponId[] {
  return WEAPON_ORDER;
}

export function refreshAvailableWeapons(player: WeaponAvailabilityCarrier): WeaponId[] {
  const available: WeaponId[] = [];
  const level = player.level;
  const unlocked = player.unlockedWeapons;

  for (const weaponId of WEAPON_ORDER) {
    const def = WEAPON_BY_ID[weaponId];
    if (!def) {
      continue;
    }
    const unlockLevel = def.unlockLevel ?? 1;
    if (level >= unlockLevel || unlocked.has(weaponId)) {
      available.push(weaponId);
    }
  }

  player.availableWeapons = available;
  return available;
}

export function unlockWeapon(player: WeaponAvailabilityCarrier, weaponId: WeaponId): void {
  if (!player.unlockedWeapons.has(weaponId)) {
    player.unlockedWeapons.add(weaponId);
  }
  refreshAvailableWeapons(player);
}

export function isWeaponAvailable(player: WeaponAvailabilityCarrier, weaponId: WeaponId): boolean {
  return player.availableWeapons.includes(weaponId);
}

export function assignWeapon(player: WeaponCarrier, weaponId: WeaponId): void {
  player.weaponId = weaponId;
  player.fireCooldownTicks = 0;
  player.reloadTicksRemaining = 0;
  const def = getWeaponById(weaponId);
  if (def.ammoMax !== undefined) {
    player.ammo = def.ammoMax;
  } else {
    player.ammo = 0;
  }
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
