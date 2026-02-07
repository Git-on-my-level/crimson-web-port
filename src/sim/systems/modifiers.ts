import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { getModifierDef, getAvailableModifiers, pickRandomModifier, type ModifierId } from '../../content/modifiers';

const MODIFIER_SPAWN_INTERVAL_TICKS = 1800;

export function updateModifiers(state: SimState, events: SimEvent[], dt: number): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  processModifierLifecycle(state, events, modeState, dt);
  checkModifierSpawn(state, events, modeState, dt);
}

function processModifierLifecycle(
  state: SimState,
  events: SimEvent[],
  _modeState: SurvivalModeState,
  dt: number,
): void {
  const toRemove: number[] = [];

  for (const modifier of state.modifiers) {
    modifier.ticksRemaining -= dt;

    if (modifier.ticksRemaining <= 0) {
      toRemove.push(modifier.id);
      const def = getModifierDef(modifier.kind);
      events.push({
        type: 'modifierDeactivated',
        id: modifier.id,
        kind: modifier.kind,
        name: def.name,
      });
    }
  }

  for (const id of toRemove) {
    const index = state.modifiers.findIndex((m) => m.id === id);
    if (index !== -1) {
      state.modifiers.splice(index, 1);
    }
  }
}

function checkModifierSpawn(
  state: SimState,
  events: SimEvent[],
  modeState: SurvivalModeState,
  dt: number,
): void {
  if (modeState.modifierSpawnCooldownTicks > 0) {
    modeState.modifierSpawnCooldownTicks -= dt * 60;
    return;
  }

  const elapsedSeconds = modeState.elapsedMs / 1000;
  const available = getAvailableModifiers(elapsedSeconds);

  if (available.length === 0) {
    modeState.modifierSpawnCooldownTicks = MODIFIER_SPAWN_INTERVAL_TICKS;
    return;
  }

  const modifierDef = pickRandomModifier(state.rng, available);
  if (!modifierDef) {
    modeState.modifierSpawnCooldownTicks = MODIFIER_SPAWN_INTERVAL_TICKS;
    return;
  }

  spawnModifier(state, events, modifierDef);
  modeState.modifierSpawnCooldownTicks = MODIFIER_SPAWN_INTERVAL_TICKS;
}

function spawnModifier(state: SimState, events: SimEvent[], def: ReturnType<typeof getModifierDef>): void {
  const id = state.nextEntityId++;
  const modifier = {
    id,
    kind: def.id as ModifierId,
    ticksRemaining: def.durationTicks,
    effectStrength: def.effectStrength,
  };
  state.modifiers.push(modifier);
  events.push({
    type: 'modifierActivated',
    id,
    kind: def.id as ModifierId,
    name: def.name,
    modifierType: def.type,
    durationTicks: def.durationTicks,
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
    modifierSpawnCooldownTicks: MODIFIER_SPAWN_INTERVAL_TICKS,
  };
  state.modeState = next;
  return next;
}

export function getPlayerSpeedModifier(_player: SimState['player'], state: SimState): number {
  let multiplier = 1.0;

  if (!state || !state.modifiers) {
    return multiplier;
  }

  for (const modifier of state.modifiers) {
    const def = getModifierDef(modifier.kind);
    if (def.category === 'player' && modifier.ticksRemaining > 0) {
      if (def.id === 'player_speed_boost') {
        multiplier *= modifier.effectStrength;
      } else if (def.id === 'player_slow') {
        multiplier *= modifier.effectStrength;
      }
    }
  }

  return multiplier;
}

export function getPlayerDamageMultiplier(_player: SimState['player'], state: SimState): number {
  let multiplier = 1.0;

  if (!state || !state.modifiers) {
    return multiplier;
  }

  for (const modifier of state.modifiers) {
    const def = getModifierDef(modifier.kind);
    if (def.category === 'player' && modifier.ticksRemaining > 0) {
      if (def.id === 'player_damage_boost') {
        multiplier *= modifier.effectStrength;
      } else if (def.id === 'player_damage_vulnerability') {
        multiplier *= modifier.effectStrength;
      }
    }
  }

  return multiplier;
}

export function getCreatureSpeedMultiplier(_creature: SimState['creatures'][0], state: SimState): number {
  let multiplier = 1.0;

  if (!state || !state.modifiers) {
    return multiplier;
  }

  for (const modifier of state.modifiers) {
    const def = getModifierDef(modifier.kind);
    if (def.category === 'creatures' && modifier.ticksRemaining > 0) {
      if (def.id === 'creature_slow') {
        multiplier *= modifier.effectStrength;
      } else if (def.id === 'creature_enrage') {
        multiplier *= modifier.effectStrength;
      }
    }
  }

  return multiplier;
}

export function getCreatureDamageMultiplier(_creature: SimState['creatures'][0], state: SimState): number {
  let multiplier = 1.0;

  if (!state || !state.modifiers) {
    return multiplier;
  }

  for (const modifier of state.modifiers) {
    const def = getModifierDef(modifier.kind);
    if (def.category === 'creatures' && modifier.ticksRemaining > 0) {
      if (def.id === 'creature_enrage') {
        multiplier *= modifier.effectStrength;
      }
    }
  }

  return multiplier;
}

export function getPlayerRegenRate(_player: SimState['player'], state: SimState): number {
  let regenPerTick = 0;

  if (!state || !state.modifiers) {
    return regenPerTick;
  }

  for (const modifier of state.modifiers) {
    const def = getModifierDef(modifier.kind);
    if (def.category === 'player' && modifier.ticksRemaining > 0 && def.id === 'player_regen') {
      regenPerTick += modifier.effectStrength / 60;
    }
  }

  return regenPerTick;
}
