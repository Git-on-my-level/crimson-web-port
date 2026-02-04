export type BonusId =
  | 'score'
  | 'energizer'
  | 'weapon'
  | 'weapon_power_up'
  | 'nuke'
  | 'double_xp'
  | 'shock_chain'
  | 'fireblast'
  | 'reflex_boost'
  | 'shield'
  | 'freeze'
  | 'medkit'
  | 'speed'
  | 'fire_bullets';

export type BonusStackMode = 'refresh' | 'stack' | 'replace';

export interface BonusDef {
  id: BonusId;
  name: string;
  kind: 'instant' | 'timed';
  durationTicks?: number;
  rarityWeight: number;
  stackMode?: BonusStackMode;
  color?: number;
}

const TICKS_PER_SECOND = 60;

export const BONUSES: BonusDef[] = [
  {
    id: 'score',
    name: 'Points',
    kind: 'instant',
    rarityWeight: 832,
    color: 0xfacc15,
  },
  {
    id: 'energizer',
    name: 'Energizer',
    kind: 'timed',
    durationTicks: 8 * TICKS_PER_SECOND,
    rarityWeight: 1,
    stackMode: 'refresh',
    color: 0x22c55e,
  },
  {
    id: 'weapon',
    name: 'Weapon',
    kind: 'instant',
    rarityWeight: 1343,
    color: 0x94a3b8,
  },
  {
    id: 'weapon_power_up',
    name: 'Weapon Power Up',
    kind: 'timed',
    durationTicks: 10 * TICKS_PER_SECOND,
    rarityWeight: 1280,
    stackMode: 'refresh',
    color: 0xf97316,
  },
  {
    id: 'nuke',
    name: 'Nuke',
    kind: 'instant',
    rarityWeight: 1152,
    color: 0xef4444,
  },
  {
    id: 'double_xp',
    name: 'Double XP',
    kind: 'timed',
    durationTicks: 10 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'stack',
    color: 0x38bdf8,
  },
  {
    id: 'shock_chain',
    name: 'Shock Chain',
    kind: 'instant',
    rarityWeight: 640,
    color: 0xa855f7,
  },
  {
    id: 'fireblast',
    name: 'Fireblast',
    kind: 'instant',
    rarityWeight: 640,
    color: 0xf97316,
  },
  {
    id: 'reflex_boost',
    name: 'Reflex Boost',
    kind: 'timed',
    durationTicks: 3 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'refresh',
    color: 0x22d3ee,
  },
  {
    id: 'shield',
    name: 'Shield',
    kind: 'timed',
    durationTicks: 7 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'refresh',
    color: 0x60a5fa,
  },
  {
    id: 'freeze',
    name: 'Freeze',
    kind: 'timed',
    durationTicks: 5 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'refresh',
    color: 0x38bdf8,
  },
  {
    id: 'medkit',
    name: 'MediKit',
    kind: 'instant',
    rarityWeight: 640,
    color: 0x22c55e,
  },
  {
    id: 'speed',
    name: 'Speed',
    kind: 'timed',
    durationTicks: 8 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'refresh',
    color: 0x3b82f6,
  },
  {
    id: 'fire_bullets',
    name: 'Fire Bullets',
    kind: 'timed',
    durationTicks: 4 * TICKS_PER_SECOND,
    rarityWeight: 640,
    stackMode: 'refresh',
    color: 0xf87171,
  },
];

const BONUS_BY_ID = new Map<BonusId, BonusDef>(BONUSES.map((def) => [def.id, def]));

export function getBonusDef(id: BonusId): BonusDef {
  return BONUS_BY_ID.get(id) ?? BONUSES[0];
}

export function pickRandomBonusType(rng: { nextFloat01: () => number }): BonusId {
  const totalWeight = BONUSES.reduce((sum, b) => sum + b.rarityWeight, 0);
  if (totalWeight <= 0) {
    return BONUSES[0].id;
  }
  let roll = rng.nextFloat01() * totalWeight;
  for (const bonus of BONUSES) {
    if (bonus.rarityWeight <= 0) {
      continue;
    }
    roll -= bonus.rarityWeight;
    if (roll <= 0) {
      return bonus.id;
    }
  }
  return BONUSES[0].id;
}
