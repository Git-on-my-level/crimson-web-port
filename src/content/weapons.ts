import type { ProjectileProfileId } from './projectiles';

export type WeaponId =
  | 'pistol'
  | 'revolver'
  | 'smg'
  | 'shotgun'
  | 'burst_rifle'
  | 'rifle'
  | 'sniper'
  | 'flamethrower'
  | 'plasma'
  | 'railgun'
  | 'rocket'
  | 'laser';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  fireMode: 'single' | 'auto' | 'burst';
  fireRate: number;
  unlockLevel?: number;
  pellets?: number;
  spreadRadians?: number;
  projectileProfileId?: ProjectileProfileId;
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
    unlockLevel: 1,
    projectileSpeed: 24,
    projectileLifeTicks: 72,
    damage: 12,
    ammoMax: 12,
    reloadTicks: 72,
    muzzleOffset: 1.4,
  },
  {
    id: 'revolver',
    name: 'Revolver',
    fireMode: 'single',
    fireRate: 2.5,
    unlockLevel: 1,
    projectileSpeed: 26,
    projectileLifeTicks: 72,
    damage: 20,
    ammoMax: 12,
    reloadTicks: 120,
    muzzleOffset: 1.4,
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    fireMode: 'single',
    fireRate: 1.1,
    unlockLevel: 1,
    pellets: 12,
    spreadRadians: 0.6,
    projectileSpeed: 18,
    projectileLifeTicks: 48,
    damage: 6,
    ammoMax: 12,
    reloadTicks: 114,
    muzzleOffset: 1.6,
  },
  {
    id: 'smg',
    name: 'SMG',
    fireMode: 'auto',
    fireRate: 10.5,
    unlockLevel: 1,
    projectileSpeed: 21,
    projectileLifeTicks: 60,
    damage: 5,
    ammoMax: 30,
    reloadTicks: 72,
    muzzleOffset: 1.3,
  },
  {
    id: 'burst_rifle',
    name: 'Burst Rifle',
    fireMode: 'burst',
    fireRate: 6.5,
    unlockLevel: 1,
    projectileSpeed: 28,
    projectileLifeTicks: 72,
    damage: 9,
    ammoMax: 25,
    reloadTicks: 72,
    muzzleOffset: 1.5,
  },
  {
    id: 'rifle',
    name: 'Rifle',
    fireMode: 'auto',
    fireRate: 3.5,
    unlockLevel: 1,
    projectileSpeed: 30,
    projectileLifeTicks: 84,
    damage: 18,
    ammoMax: 8,
    reloadTicks: 81,
    muzzleOffset: 1.5,
  },
  {
    id: 'sniper',
    name: 'Sniper',
    fireMode: 'single',
    fireRate: 0.8,
    unlockLevel: 1,
    projectileProfileId: 'piercing',
    projectileSpeed: 40,
    projectileLifeTicks: 120,
    damage: 60,
    ammoMax: 6,
    reloadTicks: 96,
    muzzleOffset: 1.7,
  },
  {
    id: 'flamethrower',
    name: 'Flamethrower',
    fireMode: 'auto',
    fireRate: 14,
    unlockLevel: 1,
    projectileSpeed: 12,
    projectileLifeTicks: 30,
    damage: 3,
    ammoMax: 30,
    reloadTicks: 120,
    muzzleOffset: 1.3,
  },
  {
    id: 'plasma',
    name: 'Plasma',
    fireMode: 'single',
    fireRate: 0.9,
    unlockLevel: 1,
    projectileSpeed: 14,
    projectileLifeTicks: 90,
    damage: 48,
    ammoMax: 20,
    reloadTicks: 72,
    muzzleOffset: 1.7,
  },
  {
    id: 'railgun',
    name: 'Railgun',
    fireMode: 'single',
    fireRate: 1.2,
    unlockLevel: 1,
    projectileProfileId: 'piercing',
    projectileSpeed: 38,
    projectileLifeTicks: 100,
    damage: 70,
    ammoMax: 3,
    reloadTicks: 180,
    muzzleOffset: 1.8,
  },
  {
    id: 'rocket',
    name: 'Rocket Launcher',
    fireMode: 'single',
    fireRate: 0.7,
    unlockLevel: 1,
    projectileProfileId: 'explosive',
    projectileSpeed: 16,
    projectileLifeTicks: 110,
    damage: 80,
    ammoMax: 5,
    reloadTicks: 72,
    muzzleOffset: 1.8,
  },
  {
    id: 'laser',
    name: 'Laser',
    fireMode: 'auto',
    fireRate: 8,
    unlockLevel: 1,
    projectileSpeed: 32,
    projectileLifeTicks: 90,
    damage: 11,
    ammoMax: 16,
    reloadTicks: 6,
    muzzleOffset: 1.5,
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
