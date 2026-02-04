import type { BonusId } from './bonuses';
import type { WeaponId } from './weapons';

export type AtlasSheet = {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  labels?: Record<string, number>;
};

export const ATLAS_SHEETS: AtlasSheet[] = [
  {
    key: 'game-projs-grid4',
    path: 'assets/crimson/game/projs.png',
    frameWidth: 32,
    frameHeight: 32,
    labels: {
      pistol: 0,
      shotgun: 1,
      smg: 2,
      rifle: 3,
      plasma: 4,
    },
  },
  {
    key: 'game-projs-grid2',
    path: 'assets/crimson/game/projs.png',
    frameWidth: 64,
    frameHeight: 64,
  },
  {
    key: 'game-particles-grid8',
    path: 'assets/crimson/game/particles.png',
    frameWidth: 32,
    frameHeight: 32,
  },
  {
    key: 'game-particles-grid4',
    path: 'assets/crimson/game/particles.png',
    frameWidth: 64,
    frameHeight: 64,
  },
  {
    key: 'game-bonuses-grid4',
    path: 'assets/crimson/game/bonuses.png',
    frameWidth: 32,
    frameHeight: 32,
    labels: {
      medkit: 0,
      ammo: 1,
      score: 2,
      damage_boost: 3,
      fire_rate_boost: 4,
      speed_boost: 5,
    },
  },
];

export const PROJECTILE_FRAMES: Record<WeaponId, number> = {
  pistol: 0,
  shotgun: 1,
  smg: 2,
  rifle: 3,
  plasma: 4,
};

export const BONUS_FRAMES: Record<BonusId, number> = {
  medkit: 0,
  ammo: 1,
  score: 2,
  damage_boost: 3,
  fire_rate_boost: 4,
  speed_boost: 5,
};
