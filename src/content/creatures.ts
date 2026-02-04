export type CreatureDef = {
  id: string;
  hp: number;
  speed: number;
  radius: number;
  touchDamage: number;
  xpValue: number;
  scoreValue: number;
  color?: number;
};

export const CREATURES: CreatureDef[] = [
  {
    id: 'grunt',
    hp: 30,
    speed: 3.2,
    radius: 1.1,
    touchDamage: 8,
    xpValue: 20,
    scoreValue: 10,
    color: 0x22c55e,
  },
  {
    id: 'runner',
    hp: 18,
    speed: 5.1,
    radius: 0.9,
    touchDamage: 6,
    xpValue: 16,
    scoreValue: 12,
    color: 0x38bdf8,
  },
  {
    id: 'tank',
    hp: 90,
    speed: 1.8,
    radius: 1.5,
    touchDamage: 12,
    xpValue: 40,
    scoreValue: 25,
    color: 0xf97316,
  },
];

const CREATURES_BY_ID = new Map<string, CreatureDef>(CREATURES.map((def) => [def.id, def]));

export function getCreatureDef(id: string): CreatureDef {
  return CREATURES_BY_ID.get(id) ?? CREATURES[0];
}
