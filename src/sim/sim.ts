import { FixedStepClock } from './clock';
import { createSimState, type SimState } from './state';
import type { QuestId } from '../content/quests';
import type { InputFrame, SimEvent } from './types';
import { applyInput } from './systems/input';
import { updatePlayer } from './systems/player';
import { updateWeapons } from './systems/weapons';
import { updateProjectiles } from './systems/projectiles';
import { updateCreatures } from './systems/creatures';
import { resolveCollisions } from './systems/collision';
import { updateBonuses } from './systems/bonuses';
import { updateSurvivalMode } from './systems/mode_survival';
import { updateQuestMode } from './systems/mode_quest';
import { updatePerkSelection, updateProgression } from './systems/progression';
import { assertSimInvariants } from './diagnostics';

export class Sim {
  readonly state: SimState;
  readonly fixedDeltaSeconds = 1 / 60;
  readonly clock = new FixedStepClock(this.fixedDeltaSeconds);
  private readonly debugEnabled: boolean;

  constructor({
    seed = 1,
    mode,
    questId,
    debug = false,
  }: {
    seed?: number;
    mode?: SimState['mode'];
    questId?: QuestId;
    debug?: boolean;
  } = {}) {
    this.state = createSimState(seed, { mode, questId });
    this.debugEnabled = debug;
  }

  reset(options: { seed?: number; mode?: SimState['mode']; questId?: QuestId } = {}): void {
    const nextSeed = options.seed ?? this.state.rng.nextUint32();
    const fresh = createSimState(nextSeed, { mode: options.mode, questId: options.questId });
    this.state.tick = fresh.tick;
    this.state.rng = fresh.rng;
    this.state.terrain = fresh.terrain;
    this.state.player = fresh.player;
    this.state.creatures = fresh.creatures;
    this.state.projectiles = fresh.projectiles;
    this.state.bonuses = fresh.bonuses;
    this.state.score = fresh.score;
    this.state.timeAlive = fresh.timeAlive;
    this.state.mode = fresh.mode;
    this.state.modeState = fresh.modeState;
    this.state.phase = fresh.phase;
    this.state.nextEntityId = fresh.nextEntityId;
    this.state.projectilePool = fresh.projectilePool;
    this.state.lastStepTimeMs = 0;
    this.state.profile = fresh.profile;
    this.state.perkChoices = fresh.perkChoices;
    this.state.selectedQuestId = fresh.selectedQuestId;
  }

  step(input: InputFrame): { events: SimEvent[] } {
    const startTime = performance.now();
    const events: SimEvent[] = [];
    const profile = this.state.profile;
    profile.inputMs = 0;
    profile.playerMs = 0;
    profile.weaponsMs = 0;
    profile.projectilesMs = 0;
    profile.modeMs = 0;
    profile.creaturesMs = 0;
    profile.collisionMs = 0;
    profile.bonusesMs = 0;
    profile.progressionMs = 0;
    profile.totalMs = 0;

    let phaseStart = performance.now();
    applyInput(this.state, input);
    profile.inputMs = performance.now() - phaseStart;
    if (this.state.phase === 'PerkSelect') {
      updatePerkSelection(this.state, events);
      profile.totalMs = performance.now() - startTime;
      this.state.lastStepTimeMs = profile.totalMs;
      return { events };
    }
    if (this.state.phase !== 'Playing') {
      profile.totalMs = performance.now() - startTime;
      this.state.lastStepTimeMs = profile.totalMs;
      return { events };
    }
    const realDt = this.fixedDeltaSeconds;
    const reflexTicks = this.state.player.activeEffects.reflex_boost ?? 0;
    const timeScale = reflexTicks > 0 ? 0.6 : 1.0;
    const scaledDt = realDt * timeScale;

    phaseStart = performance.now();
    updatePlayer(this.state, scaledDt);
    profile.playerMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    updateWeapons(this.state, events, scaledDt);
    profile.weaponsMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    updateProjectiles(this.state, events, scaledDt);
    profile.projectilesMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    if (this.state.mode === 'survival') {
      updateSurvivalMode(this.state, events, scaledDt);
    } else {
      updateQuestMode(this.state, events);
    }
    profile.modeMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    updateCreatures(this.state, events, scaledDt);
    profile.creaturesMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    resolveCollisions(this.state, events);
    profile.collisionMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    updateBonuses(this.state, events);
    profile.bonusesMs = performance.now() - phaseStart;

    phaseStart = performance.now();
    updateProgression(this.state, events, realDt);
    profile.progressionMs = performance.now() - phaseStart;

    if (this.debugEnabled) {
      assertSimInvariants(this.state);
    }

    this.state.tick += 1;
    this.state.timeAlive += realDt;
    profile.totalMs = performance.now() - startTime;
    this.state.lastStepTimeMs = profile.totalMs;

    return { events };
  }
}
