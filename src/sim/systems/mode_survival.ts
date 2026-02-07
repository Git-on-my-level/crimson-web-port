import { SURVIVAL_WAVE_MILESTONES } from '../../content/creatures';
import type { SimState, SurvivalModeState } from '../state';
import type { SimEvent } from '../types';
import { spawnCreatureAtEdge, spawnCreatureAtPosition } from './creatures';
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
  const elapsedSeconds = modeState.elapsedMs / MS_PER_SECOND;

  const stageAdvance = advanceSurvivalSpawnStage(modeState.stage, state.player.level);
  modeState.stage = stageAdvance.stage;
  for (const spawn of stageAdvance.spawns) {
    const worldPos = refPos(spawn.pos.x, spawn.pos.y);
    const resolved = resolveSurvivalSpawnTemplate(spawn.templateId, worldPos, state.rng);
    for (const entry of resolved) {
      spawnCreatureAtPosition(state, events, entry.kind, entry.pos);
    }
  }

  checkWaveMilestones(state, events, modeState, elapsedSeconds);
  processWaveSpawnQueue(state, events, modeState);

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

function checkWaveMilestones(
  state: SimState,
  events: SimEvent[],
  modeState: SurvivalModeState,
  elapsedSeconds: number,
): void {
  const nextIndex = modeState.lastWaveMilestoneIndex + 1;
  if (nextIndex >= SURVIVAL_WAVE_MILESTONES.length) {
    return;
  }

  const milestone = SURVIVAL_WAVE_MILESTONES[nextIndex];
  if (elapsedSeconds >= milestone.atSeconds) {
    modeState.lastWaveMilestoneIndex = nextIndex;

    const delayBase = 15;
    const delaySpread = 20;
    for (let i = 0; i < milestone.creatureKinds.length; i += 1) {
      const kind = milestone.creatureKinds[i];
      const count = milestone.counts[i];
      for (let j = 0; j < count; j += 1) {
        const delay = delayBase + Math.floor(state.rng.nextFloat01() * delaySpread);
        modeState.waveSpawnQueue.push({ kind, delayTicks: delay });
      }
    }

    events.push({
      type: 'waveMilestone',
      waveIndex: nextIndex,
      waveType: milestone.type,
      description: `${milestone.type === 'boss' ? 'BOSS' : 'ELITE'} WAVE at ${milestone.atSeconds}s`,
    });
  }
}

function processWaveSpawnQueue(state: SimState, events: SimEvent[], modeState: SurvivalModeState): void {
  for (let i = modeState.waveSpawnQueue.length - 1; i >= 0; i -= 1) {
    const entry = modeState.waveSpawnQueue[i];
    entry.delayTicks -= 1;
    if (entry.delayTicks <= 0) {
      spawnCreatureAtEdge(state, events, entry.kind);
      modeState.waveSpawnQueue.splice(i, 1);
    }
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
    lastWaveMilestoneIndex: -1,
    waveSpawnQueue: [],
  };
  state.modeState = next;
  return next;
}

export function registerSurvivalKill(modeState: SurvivalModeState): void {
  modeState.killsTotal += 1;
}
