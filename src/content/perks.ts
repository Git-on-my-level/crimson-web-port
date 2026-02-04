export type PerkId =
  | 'damage_up'
  | 'rapid_fire'
  | 'kinetic_rounds'
  | 'heavy_armor'
  | 'adrenaline'
  | 'bulwark'
  | 'field_medic'
  | 'scavenger'
  | 'long_arms'
  | 'sharpshooter'
  | 'spray_and_pray'
  | 'power_cell';

export type PerkTag = 'offense' | 'defense' | 'mobility' | 'utility';
export type PerkRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type PerkModifiers = {
  damageMultiplier?: number;
  fireRateMultiplier?: number;
  projectileSpeedMultiplier?: number;
  moveSpeedMultiplier?: number;
  hpMaxBonus?: number;
  damageReduction?: number;
  regenPerSecond?: number;
  bonusDropMultiplier?: number;
  pickupRangeBonus?: number;
};

export interface PerkDef {
  id: PerkId;
  name: string;
  description: string;
  maxStacks: number;
  tags: PerkTag[];
  rarity: PerkRarity;
  weight?: number;
  prereqs?: PerkId[];
  exclusiveGroup?: string;
  modifiers: PerkModifiers;
}

export const PERKS: PerkDef[] = [
  {
    id: 'damage_up',
    name: 'High Caliber',
    description: '+10% weapon damage per stack.',
    maxStacks: 5,
    tags: ['offense'],
    rarity: 'common',
    modifiers: { damageMultiplier: 0.1 },
  },
  {
    id: 'rapid_fire',
    name: 'Rapid Cycling',
    description: '+10% fire rate per stack.',
    maxStacks: 5,
    tags: ['offense'],
    rarity: 'common',
    modifiers: { fireRateMultiplier: 0.1 },
  },
  {
    id: 'kinetic_rounds',
    name: 'Kinetic Rounds',
    description: '+15% projectile speed per stack.',
    maxStacks: 4,
    tags: ['offense'],
    rarity: 'uncommon',
    modifiers: { projectileSpeedMultiplier: 0.15 },
  },
  {
    id: 'power_cell',
    name: 'Power Cell',
    description: '+10% damage and +5% fire rate per stack.',
    maxStacks: 3,
    tags: ['offense'],
    rarity: 'rare',
    prereqs: ['damage_up'],
    modifiers: { damageMultiplier: 0.1, fireRateMultiplier: 0.05 },
  },
  {
    id: 'heavy_armor',
    name: 'Heavy Armor',
    description: '+12 max HP per stack.',
    maxStacks: 5,
    tags: ['defense'],
    rarity: 'common',
    modifiers: { hpMaxBonus: 12 },
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    description: '+5% damage reduction per stack (caps at 60%).',
    maxStacks: 6,
    tags: ['defense'],
    rarity: 'uncommon',
    modifiers: { damageReduction: 0.05 },
  },
  {
    id: 'field_medic',
    name: 'Field Medic',
    description: 'Regenerate 0.6 HP per second per stack.',
    maxStacks: 3,
    tags: ['defense'],
    rarity: 'uncommon',
    modifiers: { regenPerSecond: 0.6 },
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline',
    description: '+10% movement speed per stack.',
    maxStacks: 5,
    tags: ['mobility'],
    rarity: 'common',
    modifiers: { moveSpeedMultiplier: 0.1 },
  },
  {
    id: 'long_arms',
    name: 'Long Arms',
    description: '+0.4 pickup radius per stack.',
    maxStacks: 4,
    tags: ['utility'],
    rarity: 'common',
    modifiers: { pickupRangeBonus: 0.4 },
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    description: '+20% bonus drop chance per stack.',
    maxStacks: 3,
    tags: ['utility'],
    rarity: 'uncommon',
    modifiers: { bonusDropMultiplier: 0.2 },
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: '+25% damage and +15% projectile speed (exclusive).',
    maxStacks: 1,
    tags: ['offense'],
    rarity: 'rare',
    exclusiveGroup: 'style',
    modifiers: { damageMultiplier: 0.25, projectileSpeedMultiplier: 0.15 },
  },
  {
    id: 'spray_and_pray',
    name: 'Spray and Pray',
    description: '+25% fire rate (exclusive).',
    maxStacks: 1,
    tags: ['offense'],
    rarity: 'rare',
    exclusiveGroup: 'style',
    modifiers: { fireRateMultiplier: 0.25 },
  },
];

const PERK_BY_ID = new Map<PerkId, PerkDef>(PERKS.map((perk) => [perk.id, perk]));

export function getPerkDef(id: PerkId): PerkDef {
  return PERK_BY_ID.get(id) ?? PERKS[0];
}
