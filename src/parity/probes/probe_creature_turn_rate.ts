import { Sim } from '../../sim/sim';
import { wrapAngle } from '../../sim/math/angles';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';
import { spawnCreatureAtPosition } from '../../sim/systems/creatures';

const PROBE_ID = 'creature-turn-rate';
const DEFAULT_SEED = 505;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runCreatureTurnRateProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;
  spawnCreatureAtPosition(sim.state, [], 'grunt', { x: 120, y: 0 });
  const creature = sim.state.creatures[0];
  if (!creature) {
    return buildProbeFinding({
      id: `probe:${PROBE_ID}`,
      ok: false,
      message: 'Creature spawn failed; unable to validate turn-rate.',
      tags: BASE_TAGS,
    });
  }

  creature.aiMode = 2;
  creature.forceTarget = 1;
  creature.targetPos.x = sim.state.player.pos.x;
  creature.targetPos.y = sim.state.player.pos.y;
  const targetHeading = Math.atan2(
    creature.targetPos.y - creature.pos.y,
    creature.targetPos.x - creature.pos.x,
  ) + Math.PI / 2.0;
  creature.targetHeading = targetHeading;
  creature.heading = wrapAngle(targetHeading + Math.PI);
  const beforeDelta = Math.abs(wrapAngle(creature.targetHeading - creature.heading));

  override?.setup?.(sim);

  let afterDelta = beforeDelta;
  runSimTicks(sim, override?.ticks ?? DEFAULT_TICKS, () => idleInput(), () => {
    const current = sim.state.creatures[0];
    if (!current) return;
    afterDelta = Math.abs(wrapAngle(current.targetHeading - current.heading));
  });

  const turned = afterDelta < beforeDelta;
  const noSnap = afterDelta > beforeDelta * 0.5;
  const ok = turned && noSnap;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok
      ? 'Creature heading turns toward target using turn-rate (no snap).'
      : 'Creature heading snap or no turn-rate observed.',
    details: `beforeDelta=${beforeDelta.toFixed(3)}, afterDelta=${afterDelta.toFixed(3)}`,
    expected: { turnedTowardTarget: true, noInstantSnap: true },
    actual: { turnedTowardTarget: turned, noInstantSnap: noSnap },
    tags: BASE_TAGS,
  });
}

export const probeCreatureTurnRate: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Creature heading should turn toward target at a rate (no instant snap).',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runCreatureTurnRateProbe(override)],
};
