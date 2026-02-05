import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { CREATURE_TEMPLATES, type CreatureTemplate } from '../../content/creatures';
import { spawnCreatureAtEdge } from './creatures';

const BASE_SPAWN_INTERVAL_MS = 500;
const INTERVAL_DECAY_MS = 1800;
const MS_PER_SECOND = 1000;

export function updateSurvivalMode(state: SimState, events: SimEvent[], dt: number): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  const dtMs = dt * MS_PER_SECOND;
  modeState.elapsedMs += dtMs;

  const elapsedSeconds = modeState.elapsedMs / MS_PER_SECOND;
  const activeByKind: Record<string, number> = {};
  for (const creature of state.creatures) {
    if (!creature.alive) {
      continue;
    }
    activeByKind[creature.kind] = (activeByKind[creature.kind] ?? 0) + 1;
  }

  const spawnCount = advanceSpawnCooldown(modeState, dtMs);
  if (spawnCount <= 0) {
    return;
  }

  const templates = getTemplatesForElapsedSeconds(elapsedSeconds);
  for (let i = 0; i < spawnCount; i += 1) {
    const pick = pickWeightedTemplate(state, templates, activeByKind);
    if (!pick) {
      break;
    }
    spawnCreatureAtEdge(state, events, pick.kind);
    activeByKind[pick.kind] = (activeByKind[pick.kind] ?? 0) + 1;
  }
}

function ensureSurvivalState(state: SimState): SurvivalModeState {
  if (state.modeState.kind === 'survival') {
    return state.modeState;
  }
  const next: SurvivalModeState = {
    kind: 'survival',
    elapsedMs: 0,
    spawnCooldownMs: 0,
    spawnMinDistance: 10,
    spawnMaxDistance: 24,
    killsTotal: 0,
  };
  state.modeState = next;
  return next;
}

function getTemplatesForElapsedSeconds(elapsedSeconds: number): CreatureTemplate[] {
  return CREATURE_TEMPLATES.filter((template) => elapsedSeconds >= template.minSeconds);
}

function pickWeightedTemplate(
  state: SimState,
  templates: CreatureTemplate[],
  activeByKind: Record<string, number>,
): { kind: string } | null {
  let totalWeight = 0;
  for (const entry of templates) {
    const active = activeByKind[entry.kind] ?? 0;
    if (entry.weight > 0 && active < entry.maxActive) {
      totalWeight += entry.weight;
    }
  }

  if (totalWeight <= 0) {
    return null;
  }

  let roll = state.rng.nextFloat01() * totalWeight;
  for (const entry of templates) {
    const active = activeByKind[entry.kind] ?? 0;
    if (entry.weight <= 0 || active >= entry.maxActive) {
      continue;
    }
    roll -= entry.weight;
    if (roll <= 0) {
      return { kind: entry.kind };
    }
  }

  const fallback = templates.find(
    (entry) => (activeByKind[entry.kind] ?? 0) < entry.maxActive,
  );
  if (!fallback) {
    return null;
  }
  return { kind: fallback.kind };
}

function advanceSpawnCooldown(modeState: SurvivalModeState, dtMs: number): number {
  modeState.spawnCooldownMs -= dtMs;
  if (modeState.spawnCooldownMs > -1) {
    return 0;
  }

  let intervalMs = BASE_SPAWN_INTERVAL_MS - Math.floor(modeState.elapsedMs / INTERVAL_DECAY_MS);
  let extra = 0;
  if (intervalMs < 0) {
    extra = Math.floor((1 - intervalMs) / 2);
    intervalMs += extra * 2;
  }
  if (intervalMs < 1) {
    intervalMs = 1;
  }
  modeState.spawnCooldownMs += intervalMs;

  return 1 + extra;
}

export function registerSurvivalKill(modeState: SurvivalModeState): void {
  modeState.killsTotal += 1;
}
