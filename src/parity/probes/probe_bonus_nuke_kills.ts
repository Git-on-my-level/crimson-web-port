import { Sim } from '../../sim/sim';
import type { SimEvent } from '../../sim/types';
import { spawnBonus } from '../../sim/systems/bonuses';
import { spawnCreatureAtPosition } from '../../sim/systems/creatures';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, clearTerrain, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'bonus-nuke-kills';
const DEFAULT_SEED = 222;
const DEFAULT_TICKS = 12;
const MAX_KILL_TICKS = 5;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runNukeProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  clearTerrain(sim.state);
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;

  const setupEvents: SimEvent[] = [];
  spawnCreatureAtPosition(sim.state, setupEvents, 'grunt', { x: 4, y: 0 });
  spawnCreatureAtPosition(sim.state, setupEvents, 'grunt', { x: -3, y: 2 });
  spawnCreatureAtPosition(sim.state, setupEvents, 'grunt', { x: 0, y: 5 });
  spawnBonus(sim.state, setupEvents, { x: 0, y: 0 }, 'nuke');

  const bonus = sim.state.bonuses[0];
  if (bonus) {
    sim.state.player.pos.x = bonus.pos.x;
    sim.state.player.pos.y = bonus.pos.y;
  }

  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  const initialAlive = sim.state.creatures.filter((creature) => creature.alive).length;
  let pickupSeen = false;
  let killTick: number | null = null;

  const inputForTick = override?.input ?? (() => idleInput());

  runSimTicks(sim, ticks, inputForTick, (tick, _sim, events) => {
    if (events.some((event) => event.type === 'pickup' && event.bonusType === 'nuke')) {
      pickupSeen = true;
    }
    const aliveNow = sim.state.creatures.filter((creature) => creature.alive).length;
    if (killTick === null && aliveNow < initialAlive) {
      killTick = tick;
    }
  });

  const killedQuickly = killTick !== null && killTick <= MAX_KILL_TICKS;
  const ok = pickupSeen && initialAlive > 0 && killedQuickly;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok
      ? 'Nuke pickup reduces creature count quickly.'
      : 'Expected nuke pickup to reduce creature count within window.',
    details: `initialAlive=${initialAlive}, pickupSeen=${pickupSeen}, killTick=${killTick}`,
    expected: {
      pickup: true,
      killsWithinTicks: MAX_KILL_TICKS,
    },
    actual: {
      pickup: pickupSeen,
      killTick,
    },
    tags: BASE_TAGS,
  });
}

export const probeBonusNukeKills: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Picking up a nuke should reduce the creature count within a few ticks.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runNukeProbe(override)],
};
