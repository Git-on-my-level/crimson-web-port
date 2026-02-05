import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { spawnCreatureAtPosition } from './creatures';
import { advanceSurvivalSpawnStage } from '../modes/survival_spawn_stage';
import { resolveSurvivalSpawnTemplate } from '../modes/survival_spawn_templates';
import { tickSurvivalWaveSpawns } from '../modes/survival_wave_spawns';
import { refPos, REF_WORLD_SIZE } from '../modes/survival_ref';

const MS_PER_SECOND = 1000;

export function updateSurvivalMode(state: SimState, events: SimEvent[], dt: number): void {
  if (state.mode !== 'survival') {
    return;
  }

  const modeState = ensureSurvivalState(state);
  const dtMs = dt * MS_PER_SECOND;
  modeState.elapsedMs += dtMs;

  const stageAdvance = advanceSurvivalSpawnStage(modeState.stage, state.player.level);
  modeState.stage = stageAdvance.stage;
  for (const spawn of stageAdvance.spawns) {
    const worldPos = refPos(spawn.pos.x, spawn.pos.y);
    const resolved = resolveSurvivalSpawnTemplate(spawn.templateId, worldPos, state.rng);
    for (const entry of resolved) {
      spawnCreatureAtPosition(state, events, entry.kind, entry.pos);
    }
  }

  const waveResult = tickSurvivalWaveSpawns(modeState.spawnCooldownMs, dtMs, state.rng, {
    playerCount: 1,
    survivalElapsedMs: modeState.elapsedMs,
    playerExperience: state.player.xp,
    terrainWidth: REF_WORLD_SIZE,
    terrainHeight: REF_WORLD_SIZE,
  });
  modeState.spawnCooldownMs = waveResult.spawnCooldownMs;
  for (const waveSpawn of waveResult.spawns) {
    spawnCreatureAtPosition(state, events, waveSpawn.kind, waveSpawn.pos);
  }
}

function ensureSurvivalState(state: SimState): SurvivalModeState {
  if (state.modeState.kind === 'survival') {
    return state.modeState;
  }
  const next: SurvivalModeState = {
    kind: 'survival',
    elapsedMs: 0,
    stage: 0,
    spawnCooldownMs: 0,
    spawnMinDistance: 10,
    spawnMaxDistance: 24,
    killsTotal: 0,
  };
  state.modeState = next;
  return next;
}

export function registerSurvivalKill(modeState: SurvivalModeState): void {
  modeState.killsTotal += 1;
}
