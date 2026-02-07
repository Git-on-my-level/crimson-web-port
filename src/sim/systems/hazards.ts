import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent, Vec2 } from '../types';
import { getHazardDef } from '../../content/hazards';
import { WORLD_BOUNDS } from '../world';

export function updateHazards(state: SimState, events: SimEvent[], dt: number): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  processHazardSpawnQueue(state, events, modeState);

  const toRemove: number[] = [];

  for (const hazard of state.hazards) {
    if (!hazard.alive) {
      continue;
    }

    hazard.lifeTicksRemaining -= dt;

    if (hazard.damageCooldownRemaining > 0) {
      hazard.damageCooldownRemaining -= dt;
    }

    if (hazard.lifeTicksRemaining <= 0) {
      hazard.alive = false;
      toRemove.push(hazard.id);
      events.push({
        type: 'death',
        target: 'creature',
        id: hazard.id,
      });
    }
  }

  for (const id of toRemove) {
    despawnHazard(state, id);
  }
}

export function spawnHazard(
  state: SimState,
  events: SimEvent[],
  kind: string,
  pos: Vec2,
  lifetimeTicks: number = 300,
): void {
  const def = getHazardDef(kind);
  const id = state.nextEntityId++;
  const hazard = {
    id,
    pos: { ...pos },
    kind,
    radius: def.radius,
    damage: def.damage,
    damageCooldownTicks: def.damageCooldownTicks,
    damageCooldownRemaining: 0,
    lifeTicksRemaining: lifetimeTicks,
    lifeTicksMax: lifetimeTicks,
    alive: true,
  };
  state.hazards.push(hazard);
  events.push({
    type: 'spawnHazard',
    id,
    pos: { ...pos },
    kind,
  });
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
    lastWaveMilestoneIndex: -1,
    waveSpawnQueue: [],
    hazardSpawnQueue: [],
    modifierSpawnCooldownTicks: 1800,
  };
  state.modeState = next;
  return next;
}

function processHazardSpawnQueue(
  state: SimState,
  events: SimEvent[],
  modeState: SurvivalModeState,
): void {
  for (let i = modeState.hazardSpawnQueue.length - 1; i >= 0; i -= 1) {
    const entry = modeState.hazardSpawnQueue[i];
    entry.delayTicks -= 1;
    if (entry.delayTicks <= 0) {
      spawnHazard(state, events, entry.kind, entry.pos);
      modeState.hazardSpawnQueue.splice(i, 1);
    }
  }
}

function despawnHazard(state: SimState, id: number): void {
  const index = state.hazards.findIndex((h) => h.id === id);
  if (index !== -1) {
    state.hazards.splice(index, 1);
  }
}

export function queueHazardSpawn(
  modeState: SurvivalModeState,
  kind: string,
  pos: Vec2,
  delayTicks: number,
): void {
  modeState.hazardSpawnQueue.push({ kind, pos: { ...pos }, delayTicks });
}

export function findRandomHazardSpawnPos(
  state: SimState,
  minDistance: number,
  maxDistance: number,
  attempts = 20,
): Vec2 | null {
  const playerPos = state.player.pos;
  const minDistSq = minDistance * minDistance;
  const maxDistSq = maxDistance * maxDistance;
  let best: Vec2 | null = null;
  let bestDistSq = 0;

  for (let i = 0; i < attempts; i += 1) {
    const angle = state.rng.nextFloat01() * Math.PI * 2;
    const distance = minDistance + state.rng.nextFloat01() * (maxDistance - minDistance);
    const pos = {
      x: playerPos.x + Math.cos(angle) * distance,
      y: playerPos.y + Math.sin(angle) * distance,
    };

    if (
      pos.x < WORLD_BOUNDS.minX ||
      pos.x > WORLD_BOUNDS.maxX ||
      pos.y < WORLD_BOUNDS.minY ||
      pos.y > WORLD_BOUNDS.maxY
    ) {
      continue;
    }

    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistSq || distSq > maxDistSq) {
      continue;
    }

    if (!best || distSq > bestDistSq) {
      best = pos;
      bestDistSq = distSq;
    }
  }

  return best;
}
