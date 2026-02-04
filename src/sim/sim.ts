import { FixedStepClock } from './clock';
import { createSimState, type SimState } from './state';
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

export class Sim {
  readonly state: SimState;
  readonly fixedDeltaSeconds = 1 / 60;
  readonly clock = new FixedStepClock(this.fixedDeltaSeconds);

  constructor({ seed = 1 }: { seed?: number } = {}) {
    this.state = createSimState(seed);
  }

  reset(seed?: number): void {
    const nextSeed = seed ?? this.state.rng.nextUint32();
    const fresh = createSimState(nextSeed);
    this.state.tick = fresh.tick;
    this.state.rng = fresh.rng;
    this.state.player = fresh.player;
    this.state.creatures = fresh.creatures;
    this.state.projectiles = fresh.projectiles;
    this.state.bonuses = fresh.bonuses;
    this.state.score = fresh.score;
    this.state.timeAlive = fresh.timeAlive;
    this.state.mode = fresh.mode;
    this.state.phase = fresh.phase;
    this.state.creatureSpawnCooldownTicks = fresh.creatureSpawnCooldownTicks;
    this.state.nextEntityId = fresh.nextEntityId;
    this.state.projectilePool = fresh.projectilePool;
    this.state.lastStepTimeMs = 0;
  }

  step(input: InputFrame): { events: SimEvent[] } {
    const startTime = performance.now();
    const events: SimEvent[] = [];

    applyInput(this.state, input);
    if (this.state.phase !== 'Playing') {
      this.state.lastStepTimeMs = performance.now() - startTime;
      return { events };
    }
    updatePlayer(this.state, this.fixedDeltaSeconds);
    updateWeapons(this.state, events, this.fixedDeltaSeconds);
    updateProjectiles(this.state, events, this.fixedDeltaSeconds);
    updateCreatures(this.state, events, this.fixedDeltaSeconds);
    resolveCollisions(this.state, events);
    updateBonuses(this.state, events);

    if (this.state.mode === 'survival') {
      updateSurvivalMode(this.state, events);
    } else {
      updateQuestMode(this.state, events);
    }

    this.state.tick += 1;
    this.state.timeAlive += this.fixedDeltaSeconds;
    this.state.lastStepTimeMs = performance.now() - startTime;

    return { events };
  }
}
