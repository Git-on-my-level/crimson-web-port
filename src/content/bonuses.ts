export type BonusId = 'medkit' | 'ammo' | 'score' | 'damage_boost' | 'fire_rate_boost' | 'speed_boost';

export interface BonusDef {
  id: BonusId;
  name: string;
  kind: 'instant' | 'timed';
  durationTicks?: number;
  rarityWeight: number;
  color?: number;
}

export const BONUSES: BonusDef[] = [
  {
    id: 'medkit',
    name: 'Medkit',
    kind: 'instant',
    rarityWeight: 100,
    color: 0x22c55e,
  },
  {
    id: 'ammo',
    name: 'Ammo',
    kind: 'instant',
    rarityWeight: 80,
    color: 0x60a5fa,
  },
  {
    id: 'score',
    name: 'Score Bonus',
    kind: 'instant',
    rarityWeight: 60,
    color: 0xfacc15,
  },
  {
    id: 'damage_boost',
    name: 'Damage Boost',
    kind: 'timed',
    durationTicks: 600,
    rarityWeight: 40,
    color: 0xef4444,
  },
  {
    id: 'fire_rate_boost',
    name: 'Fire Rate Boost',
    kind: 'timed',
    durationTicks: 600,
    rarityWeight: 40,
    color: 0xf97316,
  },
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    kind: 'timed',
    durationTicks: 600,
    rarityWeight: 40,
    color: 0x3b82f6,
  },
];

const BONUS_BY_ID = new Map<BonusId, BonusDef>(BONUSES.map((def) => [def.id, def]));

export function getBonusDef(id: BonusId): BonusDef {
  return BONUS_BY_ID.get(id) ?? BONUSES[0];
}

export function pickRandomBonusType(rng: { nextFloat01: () => number }): BonusId {
  const totalWeight = BONUSES.reduce((sum, b) => sum + b.rarityWeight, 0);
  let roll = rng.nextFloat01() * totalWeight;
  for (const bonus of BONUSES) {
    roll -= bonus.rarityWeight;
    if (roll <= 0) {
      return bonus.id;
    }
  }
  return BONUSES[0].id;
}
