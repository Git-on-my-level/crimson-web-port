import { WEAPON_BY_ID, WEAPON_ORDER, WEAPONS, type WeaponDef, type WeaponId } from '../../content/weapons';
import type { Rng } from '../rng';

export type WeaponAvailabilityCarrier = {
  level: number;
  unlockedWeapons: Set<WeaponId>;
  availableWeapons: WeaponId[];
};

export type WeaponAvailabilityContext = {
  mode: 'survival' | 'quest';
};

export type WeaponCarrier = {
  weaponId: WeaponId;
  ammo: number;
  reloadTimer: number;
  shotCooldown: number;
  spreadHeat: number;
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

export function refreshAvailableWeapons(player: WeaponAvailabilityCarrier, context?: WeaponAvailabilityContext): WeaponId[] {
  const available = new Set<WeaponId>();
  const unlocked = player.unlockedWeapons;
  const isSurvival = context?.mode === 'survival';

  for (const weaponId of WEAPON_ORDER) {
    const def = WEAPON_BY_ID[weaponId];
    if (!def) {
      continue;
    }

    if (def.refId === 1) {
      available.add(weaponId);
    } else if (isSurvival && (def.refId === 2 || def.refId === 3 || def.refId === 5)) {
      available.add(weaponId);
    } else if (unlocked.has(weaponId)) {
      available.add(weaponId);
    }
  }

  const sortedAvailable = Array.from(available).sort((a, b) => {
    const defA = WEAPON_BY_ID[a];
    const defB = WEAPON_BY_ID[b];
    return (defA?.refId ?? 0) - (defB?.refId ?? 0);
  });

  player.availableWeapons = sortedAvailable;
  return sortedAvailable;
}

export function unlockWeapon(player: WeaponAvailabilityCarrier, weaponId: WeaponId, context?: WeaponAvailabilityContext): void {
  if (!player.unlockedWeapons.has(weaponId)) {
    player.unlockedWeapons.add(weaponId);
  }
  refreshAvailableWeapons(player, context);
}

export function isWeaponAvailable(player: WeaponAvailabilityCarrier, weaponId: WeaponId): boolean {
  return player.availableWeapons.includes(weaponId);
}

export function assignWeapon(player: WeaponCarrier, weaponId: WeaponId): void {
  player.weaponId = weaponId;
  player.shotCooldown = 0;
  player.reloadTimer = 0;
  player.spreadHeat = 0.01;
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
