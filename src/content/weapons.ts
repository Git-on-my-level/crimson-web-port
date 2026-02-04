export type WeaponDef = {
  id: string;
  fireRate: number;
  projectileSpeed: number;
  damage: number;
  spreadRadians: number;
  projectileLifeSeconds: number;
  muzzleOffset: number;
};

export const WEAPONS: WeaponDef[] = [
  {
    id: 'pistol',
    fireRate: 5,
    projectileSpeed: 22,
    damage: 12,
    spreadRadians: 0,
    projectileLifeSeconds: 1.2,
    muzzleOffset: 1.4,
  },
];
