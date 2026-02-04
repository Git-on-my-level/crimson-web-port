import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { spawnCreatureAtEdge } from './creatures';

type SpawnWeight = {
  kind: string;
  weight: number;
};

type SurvivalTier = {
  minSeconds: number;
  spawnRatePerSecond: number;
  maxCreatures: number;
  weights: SpawnWeight[];
};

const TICKS_PER_SECOND = 60;

const SURVIVAL_TIERS: SurvivalTier[] = [
  {
    minSeconds: 0,
    spawnRatePerSecond: 0.5,
    maxCreatures: 6,
    weights: [{ kind: 'grunt', weight: 1 }],
  },
  {
    minSeconds: 30,
    spawnRatePerSecond: 0.8,
    maxCreatures: 8,
    weights: [
      { kind: 'grunt', weight: 4 },
      { kind: 'runner', weight: 1 },
    ],
  },
  {
    minSeconds: 60,
    spawnRatePerSecond: 1.1,
    maxCreatures: 10,
    weights: [
      { kind: 'grunt', weight: 3 },
      { kind: 'runner', weight: 2 },
    ],
  },
  {
    minSeconds: 90,
    spawnRatePerSecond: 1.4,
    maxCreatures: 12,
    weights: [
      { kind: 'grunt', weight: 3 },
      { kind: 'runner', weight: 2 },
      { kind: 'tank', weight: 1 },
    ],
  },
  {
    minSeconds: 120,
    spawnRatePerSecond: 1.8,
    maxCreatures: 14,
    weights: [
      { kind: 'grunt', weight: 2 },
      { kind: 'runner', weight: 2 },
      { kind: 'tank', weight: 1 },
    ],
  },
  {
    minSeconds: 180,
    spawnRatePerSecond: 2.3,
    maxCreatures: 16,
    weights: [
      { kind: 'grunt', weight: 2 },
      { kind: 'runner', weight: 3 },
      { kind: 'tank', weight: 2 },
    ],
  },
];

const CREATURE_COST: Record<string, number> = {
  grunt: 1,
  runner: 1.4,
  tank: 3,
};

const DEFAULT_COST = 1;
const MAX_SPAWNS_PER_TICK = 4;

export function updateSurvivalMode(state: SimState, events: SimEvent[]): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  modeState.elapsedTicks += 1;

  const elapsedSeconds = modeState.elapsedTicks / TICKS_PER_SECOND;
  const tierIndex = getTierIndex(elapsedSeconds);
  const tier = SURVIVAL_TIERS[tierIndex];

  modeState.difficultyLevel = tierIndex;
  modeState.maxCreaturesSoftCap = tier.maxCreatures;
  modeState.spawnBudget += tier.spawnRatePerSecond / TICKS_PER_SECOND;

  let aliveCount = 0;
  for (const creature of state.creatures) {
    if (creature.alive) {
      aliveCount += 1;
    }
  }

  const minCost = getMinCost(tier.weights);
  let spawnsThisTick = 0;
  while (
    spawnsThisTick < MAX_SPAWNS_PER_TICK &&
    aliveCount < modeState.maxCreaturesSoftCap &&
    modeState.spawnBudget >= minCost
  ) {
    const pick = pickAffordableKind(state, tier.weights, modeState.spawnBudget);
    if (!pick) {
      break;
    }
    spawnCreatureAtEdge(state, events, pick.kind);
    modeState.spawnBudget -= pick.cost;
    aliveCount += 1;
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
    maxCreaturesSoftCap: SURVIVAL_TIERS[0]?.maxCreatures ?? 6,
  };
  state.modeState = next;
  return next;
}

function getTierIndex(elapsedSeconds: number): number {
  let index = 0;
  for (let i = 0; i < SURVIVAL_TIERS.length; i += 1) {
    if (elapsedSeconds >= SURVIVAL_TIERS[i].minSeconds) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

function getMinCost(weights: SpawnWeight[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const entry of weights) {
    const cost = CREATURE_COST[entry.kind] ?? DEFAULT_COST;
    if (cost < min) {
      min = cost;
    }
  }
  return min === Number.POSITIVE_INFINITY ? DEFAULT_COST : min;
}

function pickAffordableKind(
  state: SimState,
  weights: SpawnWeight[],
  budget: number,
): { kind: string; cost: number } | null {
  let totalWeight = 0;
  for (const entry of weights) {
    const cost = CREATURE_COST[entry.kind] ?? DEFAULT_COST;
    if (cost <= budget && entry.weight > 0) {
      totalWeight += entry.weight;
    }
  }

  if (totalWeight <= 0) {
    return null;
  }

  let roll = state.rng.nextFloat01() * totalWeight;
  for (const entry of weights) {
    const cost = CREATURE_COST[entry.kind] ?? DEFAULT_COST;
    if (cost > budget || entry.weight <= 0) {
      continue;
    }
    roll -= entry.weight;
    if (roll <= 0) {
      return { kind: entry.kind, cost };
    }
  }

  const fallback = weights.find((entry) => (CREATURE_COST[entry.kind] ?? DEFAULT_COST) <= budget);
  if (!fallback) {
    return null;
  }
  return { kind: fallback.kind, cost: CREATURE_COST[fallback.kind] ?? DEFAULT_COST };
}
