import type { QuestDef, QuestSpawnPoint, QuestTimelineEvent } from './types';
import { QUEST_TITLES } from './quest_ids';

const MS_PER_TICK = 1000 / 60;
const REF_HALF = 512;
const WORLD_HALF = 1000;
const REF_TO_WORLD = WORLD_HALF / REF_HALF;

function msToTick(ms: number): number {
  return Math.round(ms / MS_PER_TICK);
}

function refCoord(value: number): number {
  return (value - REF_HALF) * REF_TO_WORLD;
}

function refPos(x: number, y: number): QuestSpawnPoint {
  return { x: refCoord(x), y: refCoord(y) };
}

function refRadius(value: number): number {
  return value * REF_TO_WORLD;
}

const REF_CENTER = refPos(512, 512);
const REF_EDGES = {
  top: refPos(512, 0),
  bottom: refPos(512, 1024),
  left: refPos(0, 512),
  right: refPos(1024, 512),
};
const REF_CORNERS = {
  topLeft: refPos(0, 0),
  topRight: refPos(1024, 0),
  bottomLeft: refPos(0, 1024),
  bottomRight: refPos(1024, 1024),
};

function spawn(
  ms: number,
  creatureKind: string,
  count: number,
  options: Partial<Extract<QuestTimelineEvent, { type: 'spawn' }>> = {},
): Extract<QuestTimelineEvent, { type: 'spawn' }> {
  return {
    atTick: msToTick(ms),
    type: 'spawn',
    creatureKind,
    count,
    ...options,
  };
}

function spawnStream(
  startMs: number,
  durationMs: number,
  intervalMs: number,
  creatureKind: string,
  count: number,
  options: Partial<Extract<QuestTimelineEvent, { type: 'spawnStream' }>> = {},
): Extract<QuestTimelineEvent, { type: 'spawnStream' }> {
  return {
    atTick: msToTick(startMs),
    type: 'spawnStream',
    creatureKind,
    count,
    intervalTicks: msToTick(intervalMs),
    durationTicks: msToTick(durationMs),
    ...options,
  };
}

function message(ms: number, text: string): Extract<QuestTimelineEvent, { type: 'message' }> {
  return { atTick: msToTick(ms), type: 'message', text };
}

function grantBonus(
  ms: number,
  bonusType: Extract<QuestTimelineEvent, { type: 'grantBonus' }>['bonusType'],
  count?: number,
): Extract<QuestTimelineEvent, { type: 'grantBonus' }> {
  return { atTick: msToTick(ms), type: 'grantBonus', bonusType, count };
}

const LAND_HOSTILE_TIMELINE = [
  spawn(500, 'alien', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(2500, 'alien', 2, { pattern: 'fixed', position: REF_CORNERS.bottomLeft }),
  spawn(6500, 'alien', 3, { pattern: 'fixed', position: REF_CORNERS.topLeft }),
  spawn(11500, 'alien', 4, { pattern: 'fixed', position: REF_CORNERS.topRight }),
  grantBonus(18000, 'score', 1),
];

const MINOR_ALIEN_BREACH_TIMELINE = (() => {
  const timeline: QuestTimelineEvent[] = [
    spawn(1000, 'alien', 2, { pattern: 'fixed', position: refPos(256, 256) }),
    spawn(1700, 'alien', 2, { pattern: 'fixed', position: refPos(256, 128) }),
  ];

  for (let i = 2; i <= 17; i += 1) {
    const trigger = (i * 5 - 10) * 720;
    timeline.push(spawn(trigger, 'alien', 1, { pattern: 'fixed', position: REF_EDGES.right }));
    if (i > 6) {
      timeline.push(spawn(trigger, 'alien', 1, { pattern: 'fixed', position: refPos(1024, 256) }));
    }
    if (i === 13) {
      timeline.push(spawn(39600, 'brute', 1, { pattern: 'fixed', position: REF_EDGES.bottom }));
    }
    if (i > 10) {
      timeline.push(spawn(trigger, 'alien', 1, { pattern: 'fixed', position: refPos(0, 768) }));
    }
  }

  timeline.push(grantBonus(22000, 'weapon', 1));

  return timeline;
})();

const TARGET_PRACTICE_TIMELINE = [
  spawnStream(2000, 42000, 1500, 'alien', 1, {
    pattern: 'ring',
    center: REF_CENTER,
    radius: refRadius(160),
  }),
];

const FRONTLINE_ASSAULT_TIMELINE = [
  spawnStream(0, 120000, 2500, 'alien', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawnStream(10000, 80000, 2500, 'alien', 1, { pattern: 'fixed', position: REF_CORNERS.topLeft }),
  spawnStream(18000, 80000, 2500, 'alien', 1, { pattern: 'fixed', position: REF_CORNERS.topRight }),
  spawn(50000, 'brute', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
];

const ALIEN_DENS_TIMELINE = [
  spawn(1500, 'alien', 1, { pattern: 'fixed', position: refPos(256, 256) }),
  spawn(1500, 'alien', 1, { pattern: 'fixed', position: refPos(768, 768) }),
  spawn(23500, 'alien', 2, { pattern: 'fixed', position: REF_CENTER }),
  spawn(38500, 'alien', 1, { pattern: 'fixed', position: refPos(256, 768) }),
  spawn(38500, 'alien', 1, { pattern: 'fixed', position: refPos(768, 256) }),
];

const RANDOM_FACTOR_TIMELINE = [
  spawnStream(1500, 100000, 10000, 'alien', 8, { pattern: 'fixed', position: REF_EDGES.right }),
  spawnStream(1700, 100000, 10000, 'alien', 6, { pattern: 'fixed', position: REF_EDGES.left }),
  spawn(21500, 'brute', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(51500, 'brute', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(81500, 'brute', 1, { pattern: 'fixed', position: REF_EDGES.bottom }),
];

const SPIDER_WAVE_SYNDROME_TIMELINE = [
  spawnStream(1500, 99000, 5500, 'spider', 8, { pattern: 'fixed', position: REF_EDGES.left }),
];

const ALIEN_SQUADS_TIMELINE = (() => {
  const timeline: QuestTimelineEvent[] = [
    spawn(1500, 'alien', 8, { pattern: 'ring', center: refPos(-256, 256), radius: refRadius(64) }),
    spawn(2500, 'alien', 8, { pattern: 'ring', center: refPos(-256, 768), radius: refRadius(64) }),
    spawn(5500, 'alien', 8, { pattern: 'ring', center: refPos(768, -256), radius: refRadius(64) }),
    spawn(8500, 'alien', 8, { pattern: 'ring', center: refPos(768, 1280), radius: refRadius(64) }),
    spawn(14500, 'alien', 8, { pattern: 'ring', center: refPos(1280, 1280), radius: refRadius(64) }),
    spawn(18500, 'alien', 8, { pattern: 'ring', center: refPos(1280, 768), radius: refRadius(64) }),
    spawn(25000, 'alien', 8, { pattern: 'ring', center: refPos(-256, 256), radius: refRadius(64) }),
    spawn(30000, 'alien', 8, { pattern: 'ring', center: refPos(-256, 768), radius: refRadius(64) }),
  ];

  timeline.push(
    spawnStream(36200, 46800, 1800, 'alien', 1, {
      pattern: 'fixed',
      positions: [refPos(-64, -64), refPos(1088, 1088)],
    }),
  );

  return timeline;
})();

const NESTING_GROUNDS_TIMELINE = [
  spawn(1500, 'alien', 8, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(8000, 'alien', 1, { pattern: 'fixed', position: refPos(256, 256) }),
  spawn(13000, 'alien', 1, { pattern: 'fixed', position: REF_CENTER }),
  spawn(18000, 'alien', 1, { pattern: 'fixed', position: refPos(768, 768) }),
  spawn(25000, 'alien', 8, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(39000, 'alien_elite', 9, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(41100, 'alien', 1, { pattern: 'fixed', position: refPos(384, 512) }),
  spawn(42100, 'alien', 1, { pattern: 'fixed', position: refPos(640, 512) }),
  spawn(43100, 'alien', 1, { pattern: 'fixed', position: refPos(512, 640) }),
  spawn(44100, 'alien', 1, { pattern: 'fixed', position: REF_CENTER }),
  spawn(50000, 'alien_elite', 7, { pattern: 'fixed', position: REF_EDGES.bottom }),
  spawn(55000, 'alien_elite', 6, { pattern: 'fixed', position: REF_EDGES.bottom }),
];

const EIGHT_LEGGED_TERROR_TIMELINE = [
  spawn(1000, 'spider_elite', 1, { pattern: 'fixed', position: refPos(768, 512) }),
  spawnStream(6000, 30800, 2200, 'spider', 1, {
    pattern: 'fixed',
    positions: [
      refPos(25, 25),
      refPos(999, 25),
      refPos(25, 999),
      refPos(999, 999),
    ],
  }),
];

const EVERRED_PASTURES_TIMELINE = (() => {
  const timeline: QuestTimelineEvent[] = [];
  for (let wave = 1; wave <= 8; wave += 1) {
    const trigger = (wave - 1) * 13000 + 1500;
    const count = wave;
    timeline.push(spawn(trigger, 'spider', count, { pattern: 'fixed', position: REF_EDGES.right }));
    timeline.push(spawn(trigger, 'spider', count, { pattern: 'fixed', position: REF_EDGES.left }));
    timeline.push(spawn(trigger, 'spider', count, { pattern: 'fixed', position: REF_EDGES.bottom }));
    timeline.push(spawn(trigger, 'spider_elite', count, { pattern: 'fixed', position: REF_EDGES.top }));
    if (wave === 4) {
      timeline.push(spawn(40500, 'spider_elite', 8, { pattern: 'fixed', position: REF_EDGES.top }));
      timeline.push(spawn(40500, 'spider_elite', 8, { pattern: 'fixed', position: REF_EDGES.bottom }));
    }
  }
  return timeline;
})();

const SPIDER_SPAWNS_TIMELINE = [
  spawn(1500, 'spider', 1, { pattern: 'fixed', position: refPos(128, 128) }),
  spawn(1500, 'spider', 1, { pattern: 'fixed', position: refPos(896, 896) }),
  spawn(1500, 'spider', 1, { pattern: 'fixed', position: refPos(896, 128) }),
  spawn(1500, 'spider', 1, { pattern: 'fixed', position: refPos(128, 896) }),
  spawn(3000, 'spider', 2, { pattern: 'fixed', position: refPos(-64, 512) }),
  spawn(18000, 'alien', 1, { pattern: 'fixed', position: REF_CENTER }),
  spawn(20500, 'alien', 1, { pattern: 'fixed', position: refPos(448, 448) }),
  spawn(26000, 'alien', 1, { pattern: 'fixed', position: refPos(576, 448) }),
  spawn(21000, 'spider', 2, { pattern: 'fixed', position: refPos(1088, 512) }),
  spawn(31500, 'alien', 1, { pattern: 'fixed', position: refPos(576, 576) }),
  spawn(22000, 'alien', 1, { pattern: 'fixed', position: refPos(448, 576) }),
];

const TWO_FRONTS_TIMELINE = [
  spawnStream(1000, 80000, 2000, 'alien', 1, { pattern: 'fixed', position: REF_EDGES.right }),
  spawnStream(2000, 80000, 2000, 'spider', 1, { pattern: 'fixed', position: REF_EDGES.left }),
  spawn(22500, 'alien', 1, { pattern: 'fixed', position: refPos(256, 256) }),
  spawn(22500, 'alien', 1, { pattern: 'fixed', position: refPos(768, 768) }),
  spawn(62500, 'alien', 1, { pattern: 'fixed', position: refPos(768, 256) }),
  spawn(62500, 'alien', 1, { pattern: 'fixed', position: refPos(256, 768) }),
];

const SWEEP_STAKES_TIMELINE = [
  spawnStream(2000, 22000, 1200, 'alien', 6, {
    pattern: 'ring',
    center: REF_CENTER,
    radius: refRadius(120),
  }),
  grantBonus(5000, 'weapon_power_up', 1),
];

const EVIL_ZOMBIES_AT_LARGE_TIMELINE = (() => {
  const timeline: QuestTimelineEvent[] = [];
  let trigger = 1500;
  let count = 4;
  while (count <= 13) {
    timeline.push(spawn(trigger, 'zombie', count, { pattern: 'fixed', position: REF_EDGES.right }));
    timeline.push(spawn(trigger, 'zombie', count, { pattern: 'fixed', position: REF_EDGES.left }));
    timeline.push(spawn(trigger, 'zombie', count, { pattern: 'fixed', position: REF_EDGES.bottom }));
    timeline.push(spawn(trigger, 'zombie', count, { pattern: 'fixed', position: REF_EDGES.top }));
    trigger += 5000;
    count += 1;
  }
  return timeline;
})();

export const QUESTS: QuestDef[] = [
  {
    id: 'nagolipoli',
    title: QUEST_TITLES.nagolipoli,
    description: 'Survive waves of enemies attacking from all directions.',
    objectives: [{ type: 'survive', durationTicks: msToTick(35000) }],
    timeline: [
      spawn(2000, 'tank', 8, { pattern: 'ring', radius: 14 }),
      spawn(8000, 'tank', 12, { pattern: 'ring', radius: 14 }),
      spawn(13000, 'grunt', 1),
      spawn(13800, 'grunt', 2),
      spawn(14600, 'grunt', 2),
      spawn(15400, 'grunt', 3),
      spawn(16200, 'grunt', 3),
      spawn(17000, 'grunt', 4),
      spawn(17800, 'grunt', 4),
      spawn(18600, 'grunt', 5),
      spawn(19400, 'grunt', 6),
      spawn(25000, 'runner', 6),
      spawn(27000, 'runner', 6),
      message(28500, 'Final wave incoming!'),
      spawn(28500, 'grunt', 8),
      spawn(28500, 'grunt', 8),
    ],
  },
  {
    id: 'monster_blues',
    title: QUEST_TITLES.monster_blues,
    description: 'Blue creatures attack from multiple sides.',
    objectives: [{ type: 'survive', durationTicks: msToTick(20000) }],
    timeline: [
      spawn(500, 'runner', 10),
      spawn(7500, 'tank', 10),
      spawn(17500, 'grunt', 12),
      spawn(17500, 'grunt', 12),
    ],
  },
  {
    id: 'the_gathering',
    title: QUEST_TITLES.the_gathering,
    description: 'Enemies gather at strategic positions.',
    objectives: [{ type: 'survive', durationTicks: msToTick(18000) }],
    timeline: [
      spawn(500, 'runner', 1),
      spawn(9500, 'runner', 2),
      spawn(15500, 'tank', 2),
      spawn(24500, 'tank', 2),
      spawn(30500, 'grunt', 2),
      spawn(39500, 'grunt', 2),
      spawn(54500, 'runner', 2),
      spawn(54500, 'runner', 1),
      spawn(54500, 'runner', 2),
      spawn(54500, 'runner', 1),
      spawn(57000, 'runner', 6),
      spawn(62000, 'runner', 4),
      spawn(69000, 'runner', 2),
    ],
  },
  {
    id: 'army_of_three',
    title: QUEST_TITLES.army_of_three,
    description: 'Three enemy types attack in sequence.',
    objectives: [{ type: 'survive', durationTicks: msToTick(15000) }],
    timeline: [
      spawn(500, 'tank', 1),
      spawn(5500, 'tank', 1),
      spawn(15000, 'tank', 1),
      spawn(19500, 'runner', 1),
      spawn(22500, 'runner', 1),
      spawn(26500, 'runner', 1),
      spawn(35500, 'grunt', 1),
      spawn(39500, 'grunt', 1),
      spawn(42500, 'grunt', 1),
      spawn(52500, 'tank', 3),
      spawn(56500, 'runner', 3),
    ],
  },
  {
    id: 'knee_deep_in_the_dead',
    title: QUEST_TITLES.knee_deep_in_the_dead,
    description: 'Wave-based zombie assault.',
    objectives: [{ type: 'survive', durationTicks: msToTick(97000) }],
    timeline: [
      spawn(100, 'tank', 1),
      spawn(500, 'runner', 1),
      spawn(1500, 'runner', 2),
      spawn(2500, 'runner', 2),
      spawn(3500, 'runner', 1),
      spawn(4500, 'runner', 2),
      spawn(5500, 'runner', 1),
      spawn(6500, 'runner', 1),
      spawn(7500, 'runner', 1),
      spawn(8500, 'runner', 1),
      spawn(9500, 'runner', 1),
      spawn(10500, 'runner', 1),
      spawn(11500, 'runner', 1),
      spawn(12500, 'runner', 1),
      spawn(13500, 'runner', 1),
      spawn(14500, 'runner', 1),
      spawn(15500, 'runner', 1),
      spawn(16500, 'runner', 1),
      spawn(17500, 'runner', 1),
      spawn(18500, 'runner', 1),
      spawn(19500, 'runner', 1),
      spawn(20500, 'runner', 1),
      spawn(21500, 'runner', 1),
      spawn(22500, 'runner', 1),
      spawn(23500, 'runner', 1),
      spawn(24500, 'runner', 1),
      spawn(25500, 'runner', 1),
      spawn(26500, 'runner', 1),
      spawn(27500, 'runner', 1),
      spawn(28500, 'runner', 1),
      spawn(29500, 'runner', 1),
      spawn(30500, 'runner', 1),
      spawn(31500, 'runner', 1),
      spawn(32500, 'runner', 1),
      spawn(33500, 'runner', 1),
      spawn(34500, 'runner', 1),
      spawn(35500, 'runner', 1),
      spawn(36500, 'runner', 1),
      spawn(37500, 'runner', 1),
      spawn(38500, 'runner', 1),
      spawn(39500, 'runner', 1),
      spawn(40500, 'runner', 1),
      spawn(41500, 'runner', 1),
      spawn(42500, 'runner', 1),
      spawn(43500, 'runner', 1),
      spawn(44500, 'runner', 1),
      spawn(45500, 'runner', 1),
      spawn(46500, 'runner', 1),
      spawn(47500, 'runner', 1),
      spawn(48500, 'runner', 1),
      spawn(49500, 'runner', 1),
      spawn(50500, 'runner', 1),
      spawn(51500, 'runner', 1),
      spawn(52500, 'runner', 1),
      spawn(53500, 'runner', 1),
      spawn(54500, 'runner', 1),
      spawn(55500, 'runner', 1),
      spawn(56500, 'runner', 1),
      spawn(57500, 'runner', 1),
      spawn(58500, 'runner', 1),
      spawn(59500, 'runner', 1),
    ],
  },
  {
    id: 'land_hostile',
    title: QUEST_TITLES.land_hostile,
    description: 'Small alien vanguard near the edges.',
    objectives: [
      { type: 'survive', durationTicks: msToTick(120000) },
      { type: 'bonusCollect', count: 1 },
    ],
    timeline: LAND_HOSTILE_TIMELINE,
  },
  {
    id: 'minor_alien_breach',
    title: QUEST_TITLES.minor_alien_breach,
    description: 'A breach opens and spills alien squads.',
    objectives: [
      { type: 'survive', durationTicks: msToTick(120000) },
      { type: 'bonusCollect', count: 1 },
    ],
    timeline: MINOR_ALIEN_BREACH_TIMELINE,
  },
  {
    id: 'target_practice',
    title: QUEST_TITLES.target_practice,
    description: 'Pick off orbiters circling the center.',
    objectives: [{ type: 'survive', durationTicks: msToTick(65000) }],
    timeline: TARGET_PRACTICE_TIMELINE,
  },
  {
    id: 'frontline_assault',
    title: QUEST_TITLES.frontline_assault,
    description: 'Continuous pressure from multiple fronts.',
    objectives: [{ type: 'survive', durationTicks: msToTick(300000) }],
    timeline: FRONTLINE_ASSAULT_TIMELINE,
  },
  {
    id: 'alien_dens',
    title: QUEST_TITLES.alien_dens,
    description: 'Destroy spawners and weather the rush.',
    objectives: [{ type: 'survive', durationTicks: msToTick(180000) }],
    timeline: ALIEN_DENS_TIMELINE,
  },
  {
    id: 'the_random_factor',
    title: QUEST_TITLES.the_random_factor,
    description: 'Unpredictable alien surges.',
    objectives: [{ type: 'survive', durationTicks: msToTick(300000) }],
    timeline: RANDOM_FACTOR_TIMELINE,
  },
  {
    id: 'spider_wave_syndrome',
    title: QUEST_TITLES.spider_wave_syndrome,
    description: 'Wave after wave of spiders.',
    objectives: [{ type: 'survive', durationTicks: msToTick(240000) }],
    timeline: SPIDER_WAVE_SYNDROME_TIMELINE,
  },
  {
    id: 'alien_squads',
    title: QUEST_TITLES.alien_squads,
    description: 'Organized alien formations attack.',
    objectives: [{ type: 'survive', durationTicks: msToTick(180000) }],
    timeline: ALIEN_SQUADS_TIMELINE,
  },
  {
    id: 'nesting_grounds',
    title: QUEST_TITLES.nesting_grounds,
    description: 'Spawners emerge around the center.',
    objectives: [{ type: 'survive', durationTicks: msToTick(240000) }],
    timeline: NESTING_GROUNDS_TIMELINE,
  },
  {
    id: '8_legged_terror',
    title: QUEST_TITLES['8_legged_terror'],
    description: 'Face the spider boss and its brood.',
    objectives: [{ type: 'survive', durationTicks: msToTick(240000) }],
    timeline: EIGHT_LEGGED_TERROR_TIMELINE,
  },
  {
    id: 'everred_pastures',
    title: QUEST_TITLES.everred_pastures,
    description: 'Rising spider waves from all edges.',
    objectives: [{ type: 'survive', durationTicks: msToTick(300000) }],
    timeline: EVERRED_PASTURES_TIMELINE,
  },
  {
    id: 'spider_spawns',
    title: QUEST_TITLES.spider_spawns,
    description: 'Spawners appear on the grid.',
    objectives: [{ type: 'survive', durationTicks: msToTick(300000) }],
    timeline: SPIDER_SPAWNS_TIMELINE,
  },
  {
    id: 'two_fronts',
    title: QUEST_TITLES.two_fronts,
    description: 'Aliens and spiders converge from both sides.',
    objectives: [{ type: 'survive', durationTicks: msToTick(240000) }],
    timeline: TWO_FRONTS_TIMELINE,
  },
  {
    id: 'sweep_stakes',
    title: QUEST_TITLES.sweep_stakes,
    description: 'Orbiting targets sweep the arena.',
    objectives: [
      { type: 'survive', durationTicks: msToTick(35000) },
      { type: 'bonusCollect', count: 1 },
    ],
    timeline: SWEEP_STAKES_TIMELINE,
  },
  {
    id: 'evil_zombies_at_large',
    title: QUEST_TITLES.evil_zombies_at_large,
    description: 'Zombie waves grow more intense.',
    objectives: [{ type: 'survive', durationTicks: msToTick(180000) }],
    timeline: EVIL_ZOMBIES_AT_LARGE_TIMELINE,
  },
];

export const DEFAULT_QUEST_ID = QUESTS[0]?.id ?? 'nagolipoli';

const QUESTS_BY_ID = new Map<string, QuestDef>(QUESTS.map((quest) => [quest.id, quest]));

export function getQuestDef(id: string): QuestDef {
  return QUESTS_BY_ID.get(id) ?? QUESTS[0];
}

export type { QuestDef, QuestId, QuestObjective, QuestStatus, QuestTimelineEvent } from './types';
