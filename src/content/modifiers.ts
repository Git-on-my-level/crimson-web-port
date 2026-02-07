export type ModifierId = string;

export type ModifierDef = {
  id: string;
  type: 'positive' | 'negative';
  category: 'player' | 'creatures' | 'global';
  name: string;
  effectStrength: number;
  durationTicks: number;
  spawnWeight: number;
  minSpawnSeconds: number;
  color: number;
  icon: string;
};

export const MODIFIERS: ModifierDef[] = [
  {
    id: 'player_speed_boost',
    type: 'positive',
    category: 'player',
    name: 'Speed Boost',
    effectStrength: 1.5,
    durationTicks: 600,
    spawnWeight: 3,
    minSpawnSeconds: 30,
    color: 0x00ff88,
    icon: '⚡',
  },
  {
    id: 'player_damage_boost',
    type: 'positive',
    category: 'player',
    name: 'Damage Boost',
    effectStrength: 1.4,
    durationTicks: 480,
    spawnWeight: 2,
    minSpawnSeconds: 45,
    color: 0xffaa00,
    icon: '⚔️',
  },
  {
    id: 'player_regen',
    type: 'positive',
    category: 'player',
    name: 'Regeneration',
    effectStrength: 0.5,
    durationTicks: 720,
    spawnWeight: 2,
    minSpawnSeconds: 60,
    color: 0x00aaff,
    icon: '❤️',
  },
  {
    id: 'creature_slow',
    type: 'positive',
    category: 'creatures',
    name: 'Slow Field',
    effectStrength: 0.5,
    durationTicks: 540,
    spawnWeight: 2,
    minSpawnSeconds: 30,
    color: 0xaaaaff,
    icon: '❄️',
  },
  {
    id: 'player_damage_vulnerability',
    type: 'negative',
    category: 'player',
    name: 'Vulnerability',
    effectStrength: 0.5,
    durationTicks: 480,
    spawnWeight: 2,
    minSpawnSeconds: 45,
    color: 0xff4444,
    icon: '💔',
  },
  {
    id: 'player_slow',
    type: 'negative',
    category: 'player',
    name: 'Slow Curse',
    effectStrength: 0.6,
    durationTicks: 420,
    spawnWeight: 2,
    minSpawnSeconds: 40,
    color: 0xff6666,
    icon: '🐌',
  },
  {
    id: 'creature_enrage',
    type: 'negative',
    category: 'creatures',
    name: 'Enrage',
    effectStrength: 1.6,
    durationTicks: 360,
    spawnWeight: 2,
    minSpawnSeconds: 50,
    color: 0xff0000,
    icon: '🔥',
  },
];

const MODIFIERS_BY_ID = new Map<string, ModifierDef>(MODIFIERS.map((def) => [def.id, def]));

export function getModifierDef(id: string): ModifierDef {
  return MODIFIERS_BY_ID.get(id) ?? MODIFIERS[0];
}

export function getAvailableModifiers(elapsedSeconds: number): ModifierDef[] {
  return MODIFIERS.filter((def) => elapsedSeconds >= def.minSpawnSeconds);
}

export function pickRandomModifier(rng: { nextFloat01: () => number }, available: ModifierDef[]): ModifierDef | null {
  if (available.length === 0) {
    return null;
  }

  const totalWeight = available.reduce((sum, def) => sum + def.spawnWeight, 0);
  if (totalWeight <= 0) {
    return available[0];
  }

  let roll = rng.nextFloat01() * totalWeight;
  for (const def of available) {
    roll -= def.spawnWeight;
    if (roll <= 0) {
      return def;
    }
  }

  return available[0];
}
