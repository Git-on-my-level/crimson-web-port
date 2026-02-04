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

export class Sim {
  readonly state: SimState;
  readonly fixedDeltaSeconds = 1 / 60;
  readonly clock = new FixedStepClock(this.fixedDeltaSeconds);

  constructor({ seed = 1, mode, questId }: { seed?: number; mode?: SimState['mode']; questId?: QuestId } = {}) {
    this.state = createSimState(seed, { mode, questId });
  }

  reset(options: { seed?: number; mode?: SimState['mode']; questId?: QuestId } = {}): void {
    const nextSeed = options.seed ?? this.state.rng.nextUint32();
    const fresh = createSimState(nextSeed, { mode: options.mode, questId: options.questId });
    this.state.tick = fresh.tick;
    this.state.rng = fresh.rng;
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
    this.state.perkChoices = fresh.perkChoices;
    this.state.selectedQuestId = fresh.selectedQuestId;
  }

  step(input: InputFrame): { events: SimEvent[] } {
    const startTime = performance.now();
    const events: SimEvent[] = [];

    applyInput(this.state, input);
    if (this.state.phase === 'PerkSelect') {
      updatePerkSelection(this.state, events);
      this.state.lastStepTimeMs = performance.now() - startTime;
      return { events };
    }
    if (this.state.phase !== 'Playing') {
      this.state.lastStepTimeMs = performance.now() - startTime;
      return { events };
    }
    updatePlayer(this.state, this.fixedDeltaSeconds);
    updateWeapons(this.state, events, this.fixedDeltaSeconds);
    updateProjectiles(this.state, events, this.fixedDeltaSeconds);

    if (this.state.mode === 'survival') {
      updateSurvivalMode(this.state, events);
    } else {
      updateQuestMode(this.state, events);
    }

    updateCreatures(this.state, events, this.fixedDeltaSeconds);
    resolveCollisions(this.state, events);
    updateBonuses(this.state, events);
    updateProgression(this.state, events, this.fixedDeltaSeconds);

    this.state.tick += 1;
    this.state.timeAlive += this.fixedDeltaSeconds;
    this.state.lastStepTimeMs = performance.now() - startTime;

    return { events };
  }
}
