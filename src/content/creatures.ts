export type CreatureDef = {
  id: string;
  hp: number;
  speed: number;
  radius: number;
  touchDamage: number;
  xpValue: number;
  scoreValue: number;
  color?: number;
  behavior?: CreatureBehavior;
  aiMode?: number;
  aiFlags?: number;
};

export type CreatureBehavior = 'seek' | 'strafe' | 'burst';

export const CREATURES: CreatureDef[] = [
  {
    id: 'grunt',
    hp: 30,
    speed: 3.2,
    radius: 1.1,
    touchDamage: 8,
    xpValue: 40,
    scoreValue: 10,
    color: 0x22c55e,
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'runner',
    hp: 18,
    speed: 5.1,
    radius: 0.9,
    touchDamage: 6,
    xpValue: 32,
    scoreValue: 12,
    color: 0x38bdf8,
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'tank',
    hp: 90,
    speed: 1.8,
    radius: 1.5,
    touchDamage: 12,
    xpValue: 80,
    scoreValue: 25,
    color: 0xf97316,
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'zombie',
    hp: 38,
    speed: 2.6,
    radius: 1.1,
    touchDamage: 7,
    xpValue: 44,
    scoreValue: 12,
    color: 0x84cc16,
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'zombie_elite',
    hp: 80,
    speed: 2.2,
    radius: 1.3,
    touchDamage: 12,
    xpValue: 90,
    scoreValue: 30,
    color: 0x65a30d,
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'alien',
    hp: 26,
    speed: 4.2,
    radius: 1.0,
    touchDamage: 7,
    xpValue: 40,
    scoreValue: 14,
    color: 0x22d3ee,
    behavior: 'burst',
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'alien_elite',
    hp: 60,
    speed: 3.4,
    radius: 1.2,
    touchDamage: 12,
    xpValue: 92,
    scoreValue: 30,
    color: 0x0891b2,
    behavior: 'burst',
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'spider',
    hp: 20,
    speed: 4.6,
    radius: 0.8,
    touchDamage: 5,
    xpValue: 28,
    scoreValue: 10,
    color: 0xa855f7,
    behavior: 'strafe',
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'spider_elite',
    hp: 45,
    speed: 3.9,
    radius: 1.0,
    touchDamage: 9,
    xpValue: 64,
    scoreValue: 22,
    color: 0x7c3aed,
    behavior: 'strafe',
    aiMode: 0,
    aiFlags: 0,
  },
  {
    id: 'brute',
    hp: 140,
    speed: 1.6,
    radius: 1.7,
    touchDamage: 16,
    xpValue: 140,
    scoreValue: 45,
    color: 0xfb923c,
    aiMode: 0,
    aiFlags: 0,
  },
];

const CREATURES_BY_ID = new Map<string, CreatureDef>(CREATURES.map((def) => [def.id, def]));

export function getCreatureDef(id: string): CreatureDef {
  return CREATURES_BY_ID.get(id) ?? CREATURES[0];
}

export type CreatureTemplate = {
  id: string;
  kind: string;
  minSeconds: number;
  weight: number;
  cost: number;
  maxActive: number;
};

export const CREATURE_TEMPLATES: CreatureTemplate[] = [
  { id: 'grunt', kind: 'grunt', minSeconds: 0, weight: 6, cost: 1, maxActive: 12 },
  { id: 'runner', kind: 'runner', minSeconds: 25, weight: 4, cost: 1.2, maxActive: 10 },
  { id: 'tank', kind: 'tank', minSeconds: 70, weight: 2, cost: 3, maxActive: 4 },
  { id: 'zombie', kind: 'zombie', minSeconds: 0, weight: 5, cost: 1.1, maxActive: 10 },
  { id: 'zombie_elite', kind: 'zombie_elite', minSeconds: 110, weight: 2, cost: 2.4, maxActive: 5 },
  { id: 'alien', kind: 'alien', minSeconds: 45, weight: 4, cost: 1.3, maxActive: 9 },
  { id: 'alien_elite', kind: 'alien_elite', minSeconds: 150, weight: 2, cost: 2.6, maxActive: 4 },
  { id: 'spider', kind: 'spider', minSeconds: 15, weight: 4, cost: 1.0, maxActive: 10 },
  { id: 'spider_elite', kind: 'spider_elite', minSeconds: 130, weight: 2, cost: 2.2, maxActive: 5 },
  { id: 'brute', kind: 'brute', minSeconds: 200, weight: 1, cost: 4.2, maxActive: 2 },
];

const CREATURE_TEMPLATES_BY_ID = new Map<string, CreatureTemplate>(
  CREATURE_TEMPLATES.map((template) => [template.id, template]),
);

export function getCreatureTemplate(id: string): CreatureTemplate {
  return CREATURE_TEMPLATES_BY_ID.get(id) ?? CREATURE_TEMPLATES[0];
}
