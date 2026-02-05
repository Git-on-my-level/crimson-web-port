import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { CREATURE_TEMPLATES, type CreatureTemplate } from '../../content/creatures';
import { spawnCreatureAtEdge, spawnCreatureInRing, spawnCreatureNearPlayer } from './creatures';

type SurvivalPhase = {
  minSeconds: number;
  spawnRatePerSecond: number;
  maxCreatures: number;
  templateIds: string[];
};

const TICKS_PER_SECOND = 60;

const SURVIVAL_PHASES: SurvivalPhase[] = [
  {
    minSeconds: 0,
    spawnRatePerSecond: 0.7,
    maxCreatures: 8,
    templateIds: ['grunt', 'zombie', 'spider'],
  },
  {
    minSeconds: 40,
    spawnRatePerSecond: 0.95,
    maxCreatures: 11,
    templateIds: ['grunt', 'runner', 'zombie', 'spider'],
  },
  {
    minSeconds: 80,
    spawnRatePerSecond: 1.25,
    maxCreatures: 14,
    templateIds: ['grunt', 'runner', 'zombie', 'spider', 'alien'],
  },
  {
    minSeconds: 120,
    spawnRatePerSecond: 1.6,
    maxCreatures: 18,
    templateIds: ['runner', 'zombie', 'spider', 'alien', 'tank'],
  },
  {
    minSeconds: 150,
    spawnRatePerSecond: 2.05,
    maxCreatures: 22,
    templateIds: ['runner', 'zombie_elite', 'spider_elite', 'alien', 'alien_elite', 'tank', 'brute'],
  },
];

type SurvivalWaveEntry = {
  kind: string;
  count: number;
  pattern: 'edge' | 'near' | 'ring';
  intervalTicks: number;
};

type SurvivalWave = {
  startSeconds: number;
  entries: SurvivalWaveEntry[];
};

const SURVIVAL_WAVES: SurvivalWave[] = [
  {
    startSeconds: 45,
    entries: [{ kind: 'spider', count: 8, pattern: 'ring', intervalTicks: 4 }],
  },
  {
    startSeconds: 90,
    entries: [{ kind: 'alien', count: 10, pattern: 'edge', intervalTicks: 3 }],
  },
  {
    startSeconds: 135,
    entries: [{ kind: 'zombie_elite', count: 5, pattern: 'ring', intervalTicks: 6 }],
  },
  {
    startSeconds: 180,
    entries: [{ kind: 'spider_elite', count: 8, pattern: 'near', intervalTicks: 4 }],
  },
  {
    startSeconds: 220,
    entries: [
      { kind: 'brute', count: 1, pattern: 'edge', intervalTicks: 10 },
      { kind: 'tank', count: 4, pattern: 'edge', intervalTicks: 6 },
    ],
  },
];

const MAX_SPAWNS_PER_TICK = 4;
const MAX_WAVE_SPAWNS_PER_TICK = 3;
const WAVE_RING_RADIUS = 14;

export function updateSurvivalMode(state: SimState, events: SimEvent[], dt: number): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  const tickDelta = dt * TICKS_PER_SECOND;
  modeState.elapsedTicks += tickDelta;

  const elapsedSeconds = modeState.elapsedTicks / TICKS_PER_SECOND;
  const phaseIndex = getPhaseIndex(elapsedSeconds);
  const phase = SURVIVAL_PHASES[phaseIndex];

  modeState.difficultyLevel = phaseIndex;
  modeState.maxCreaturesSoftCap = phase.maxCreatures;
  modeState.spawnBudget += phase.spawnRatePerSecond * dt;

  let aliveCount = 0;
  const activeByKind: Record<string, number> = {};
  for (const creature of state.creatures) {
    if (creature.alive) {
      aliveCount += 1;
      activeByKind[creature.kind] = (activeByKind[creature.kind] ?? 0) + 1;
    }
  }

  while (
    modeState.nextWaveIndex < SURVIVAL_WAVES.length &&
    elapsedSeconds >= SURVIVAL_WAVES[modeState.nextWaveIndex].startSeconds
  ) {
    queueSurvivalWave(modeState, SURVIVAL_WAVES[modeState.nextWaveIndex]);
    modeState.nextWaveIndex += 1;
  }

  aliveCount = processWaveQueue(state, events, modeState, activeByKind, aliveCount);

  const templates = getTemplatesForPhase(phase, elapsedSeconds);
  const minCost = getMinCost(templates, activeByKind);
  let spawnsThisTick = 0;
  while (
    spawnsThisTick < MAX_SPAWNS_PER_TICK &&
    aliveCount < modeState.maxCreaturesSoftCap &&
    modeState.spawnBudget >= minCost
  ) {
    const pick = pickAffordableTemplate(state, templates, activeByKind, modeState.spawnBudget);
    if (!pick) {
      break;
    }
    spawnCreatureNearPlayer(
      state,
      events,
      pick.kind,
      modeState.spawnMinDistance,
      modeState.spawnMaxDistance,
    );
    modeState.spawnBudget -= pick.cost;
    aliveCount += 1;
    activeByKind[pick.kind] = (activeByKind[pick.kind] ?? 0) + 1;
    spawnsThisTick += 1;
  }
}

function ensureSurvivalState(state: SimState): SurvivalModeState {
  if (state.modeState.kind === 'survival') {
    return state.modeState;
  }
  const next: SurvivalModeState = {
    kind: 'survival',
    elapsedTicks: 0,
    spawnBudget: 0,
    difficultyLevel: 0,
    maxCreaturesSoftCap: SURVIVAL_PHASES[0]?.maxCreatures ?? 6,
    spawnMinDistance: 10,
    spawnMaxDistance: 24,
    killsTotal: 0,
    nextWaveIndex: 0,
    spawnQueue: [],
  };
  state.modeState = next;
  return next;
}

function getPhaseIndex(elapsedSeconds: number): number {
  let index = 0;
  for (let i = 0; i < SURVIVAL_PHASES.length; i += 1) {
    if (elapsedSeconds >= SURVIVAL_PHASES[i].minSeconds) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

function getTemplatesForPhase(phase: SurvivalPhase, elapsedSeconds: number): CreatureTemplate[] {
  const templateSet = new Set(phase.templateIds);
  return CREATURE_TEMPLATES.filter(
    (template) => templateSet.has(template.id) && elapsedSeconds >= template.minSeconds,
  );
}

function getMinCost(templates: CreatureTemplate[], activeByKind: Record<string, number>): number {
  let min = Number.POSITIVE_INFINITY;
  for (const entry of templates) {
    const active = activeByKind[entry.kind] ?? 0;
    if (active >= entry.maxActive || entry.cost <= 0) {
      continue;
    }
    if (entry.cost < min) {
      min = entry.cost;
    }
  }
  return min === Number.POSITIVE_INFINITY ? 1 : min;
}

function pickAffordableTemplate(
  state: SimState,
  templates: CreatureTemplate[],
  activeByKind: Record<string, number>,
  budget: number,
): { kind: string; cost: number } | null {
  let totalWeight = 0;
  for (const entry of templates) {
    const active = activeByKind[entry.kind] ?? 0;
    if (entry.cost <= budget && entry.weight > 0 && active < entry.maxActive) {
      totalWeight += entry.weight;
    }
  }

  if (totalWeight <= 0) {
    return null;
  }

  let roll = state.rng.nextFloat01() * totalWeight;
  for (const entry of templates) {
    const active = activeByKind[entry.kind] ?? 0;
    if (entry.cost > budget || entry.weight <= 0 || active >= entry.maxActive) {
      continue;
    }
    roll -= entry.weight;
    if (roll <= 0) {
      return { kind: entry.kind, cost: entry.cost };
    }
  }

  const fallback = templates.find(
    (entry) => entry.cost <= budget && (activeByKind[entry.kind] ?? 0) < entry.maxActive,
  );
  if (!fallback) {
    return null;
  }
  return { kind: fallback.kind, cost: fallback.cost };
}

function queueSurvivalWave(modeState: SurvivalModeState, wave: SurvivalWave): void {
  for (const entry of wave.entries) {
    modeState.spawnQueue.push({
      kind: entry.kind,
      remaining: entry.count,
      pattern: entry.pattern,
      intervalTicks: Math.max(1, entry.intervalTicks),
      nextTick: modeState.elapsedTicks,
    });
  }
}

function processWaveQueue(
  state: SimState,
  events: SimEvent[],
  modeState: SurvivalModeState,
  activeByKind: Record<string, number>,
  aliveCount: number,
): number {
  let spawnsThisTick = 0;
  for (let i = 0; i < modeState.spawnQueue.length && spawnsThisTick < MAX_WAVE_SPAWNS_PER_TICK; i += 1) {
    const entry = modeState.spawnQueue[i];
    if (entry.remaining <= 0 || modeState.elapsedTicks < entry.nextTick) {
      continue;
    }
    if (aliveCount >= modeState.maxCreaturesSoftCap) {
      break;
    }
    const active = activeByKind[entry.kind] ?? 0;
    const template = CREATURE_TEMPLATES.find((t) => t.kind === entry.kind);
    if (template && active >= template.maxActive) {
      entry.remaining = 0;
      continue;
    }
    spawnWaveCreature(state, events, entry);
    entry.remaining -= 1;
    entry.nextTick = modeState.elapsedTicks + entry.intervalTicks;
    aliveCount += 1;
    activeByKind[entry.kind] = active + 1;
    spawnsThisTick += 1;
  }

  modeState.spawnQueue = modeState.spawnQueue.filter((entry) => entry.remaining > 0);
  return aliveCount;
}

function spawnWaveCreature(
  state: SimState,
  events: SimEvent[],
  entry: SurvivalModeState['spawnQueue'][0],
): void {
  switch (entry.pattern) {
    case 'edge':
      spawnCreatureAtEdge(state, events, entry.kind);
      break;
    case 'ring':
      spawnCreatureInRing(state, events, entry.kind, WAVE_RING_RADIUS);
      break;
    case 'near':
    default:
      spawnCreatureNearPlayer(
        state,
        events,
        entry.kind,
        state.modeState.kind === 'survival' ? state.modeState.spawnMinDistance : 10,
        state.modeState.kind === 'survival' ? state.modeState.spawnMaxDistance : 24,
      );
      break;
  }
}

export function registerSurvivalKill(modeState: SurvivalModeState): void {
  modeState.killsTotal += 1;
}
