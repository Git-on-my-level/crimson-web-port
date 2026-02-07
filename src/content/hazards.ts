export type HazardDef = {
  id: string;
  radius: number;
  damage: number;
  damageCooldownTicks: number;
  color: number;
};

export const HAZARDS: HazardDef[] = [
  {
    id: 'spike_trap',
    radius: 1.5,
    damage: 15,
    damageCooldownTicks: 60,
    color: 0xff4444,
  },
  {
    id: 'lava_pool',
    radius: 2.0,
    damage: 20,
    damageCooldownTicks: 30,
    color: 0xff8800,
  },
  {
    id: 'acid_cloud',
    radius: 1.8,
    damage: 10,
    damageCooldownTicks: 45,
    color: 0x00ff88,
  },
];

const HAZARDS_BY_ID = new Map<string, HazardDef>(HAZARDS.map((def) => [def.id, def]));

export function getHazardDef(id: string): HazardDef {
  return HAZARDS_BY_ID.get(id) ?? HAZARDS[0];
}
