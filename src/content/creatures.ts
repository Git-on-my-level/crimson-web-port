export type CreatureDef = {
  id: string;
  hp: number;
  speed: number;
  radius: number;
  touchDamage: number;
  color?: number;
};

export const CREATURES: CreatureDef[] = [
  {
    id: 'grunt',
    hp: 30,
    speed: 3.2,
    radius: 1.1,
    touchDamage: 8,
    color: 0x22c55e,
  },
];

const CREATURES_BY_ID = new Map<string, CreatureDef>(CREATURES.map((def) => [def.id, def]));

export function getCreatureDef(id: string): CreatureDef {
  return CREATURES_BY_ID.get(id) ?? CREATURES[0];
}
