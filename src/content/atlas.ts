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
      revolver: 0,
      shotgun: 1,
      smg: 2,
      burst_rifle: 3,
      rifle: 3,
      sniper: 3,
      flamethrower: 2,
      plasma: 4,
      railgun: 4,
      rocket: 1,
      laser: 4,
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
      score: 12,
      energizer: 10,
      weapon: 1,
      weapon_power_up: 7,
      nuke: 1,
      double_xp: 4,
      shock_chain: 3,
      fireblast: 2,
      reflex_boost: 5,
      shield: 6,
      freeze: 8,
      medkit: 14,
      speed: 9,
      fire_bullets: 11,
    },
  },
];

export const PROJECTILE_FRAMES: Record<WeaponId, number> = {
  pistol: 0,
  revolver: 0,
  shotgun: 1,
  smg: 2,
  burst_rifle: 3,
  rifle: 3,
  sniper: 3,
  flamethrower: 2,
  plasma: 4,
  railgun: 4,
  rocket: 1,
  laser: 4,
};

export const BONUS_FRAMES: Record<BonusId, number> = {
  score: 12,
  energizer: 10,
  weapon: 1,
  weapon_power_up: 7,
  nuke: 1,
  double_xp: 4,
  shock_chain: 3,
  fireblast: 2,
  reflex_boost: 5,
  shield: 6,
  freeze: 8,
  medkit: 14,
  speed: 9,
  fire_bullets: 11,
};
