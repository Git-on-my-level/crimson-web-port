import type { WeaponId } from './weapons.generated';
import { WEAPONS } from './weapons.generated';

export type { WeaponId, WeaponDef } from './weapons.generated';
export { WEAPONS, WEAPON_BY_ID, weaponIdFromRefId, weaponRefIdFromWeaponId } from './weapons.generated';

export const WEAPON_ORDER: WeaponId[] = WEAPONS.map((w) => w.id);
