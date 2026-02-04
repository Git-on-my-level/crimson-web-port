export type WeaponId = 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'plasma';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  fireMode: 'single' | 'auto' | 'burst';
  fireRate: number;
  pellets?: number;
  spreadRadians?: number;
  projectileSpeed: number;
  projectileLifeTicks: number;
  damage: number;
  recoil?: number;
  ammoMax?: number;
  reloadTicks?: number;
  muzzleOffset: number;
}

export const WEAPONS: WeaponDef[] = [
  {
    id: 'pistol',
    name: 'Pistol',
    fireMode: 'single',
    fireRate: 4.5,
    projectileSpeed: 24,
    projectileLifeTicks: 72,
    damage: 12,
    muzzleOffset: 1.4,
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    fireMode: 'single',
    fireRate: 1.1,
    pellets: 6,
    spreadRadians: 0.6,
    projectileSpeed: 18,
    projectileLifeTicks: 48,
    damage: 6,
    ammoMax: 8,
    reloadTicks: 120,
    muzzleOffset: 1.6,
  },
  {
    id: 'smg',
    name: 'SMG',
    fireMode: 'auto',
    fireRate: 10.5,
    projectileSpeed: 21,
    projectileLifeTicks: 60,
    damage: 5,
    ammoMax: 30,
    reloadTicks: 90,
    muzzleOffset: 1.3,
  },
  {
    id: 'rifle',
    name: 'Rifle',
    fireMode: 'auto',
    fireRate: 3.5,
    projectileSpeed: 30,
    projectileLifeTicks: 84,
    damage: 18,
    ammoMax: 20,
    reloadTicks: 120,
    muzzleOffset: 1.5,
  },
  {
    id: 'plasma',
    name: 'Plasma',
    fireMode: 'single',
    fireRate: 0.9,
    projectileSpeed: 14,
    projectileLifeTicks: 90,
    damage: 48,
    ammoMax: 6,
    reloadTicks: 180,
    muzzleOffset: 1.7,
  },
];

export const WEAPON_ORDER: WeaponId[] = WEAPONS.map((weapon) => weapon.id);

export const WEAPON_BY_ID: Record<WeaponId, WeaponDef> = WEAPONS.reduce(
  (acc, weapon) => {
    acc[weapon.id] = weapon;
    return acc;
  },
  {} as Record<WeaponId, WeaponDef>
);
