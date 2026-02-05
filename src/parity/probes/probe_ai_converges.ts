import { Sim } from '../../sim/sim';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, clearTerrain, idleInput, runSimTicks } from './utils';
import { spawnCreatureAtPosition } from '../../sim/systems/creatures';

const PROBE_ID = 'ai-converges';
const DEFAULT_SEED = 333;
const DEFAULT_TICKS = 120;
const DIST_TOLERANCE = 0.001;
const STOP_DISTANCE = 0.2;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runAiConvergesProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  clearTerrain(sim.state);
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;

  const spawnPos = { x: 10, y: 0 };
  spawnCreatureAtPosition(sim.state, [], 'grunt', spawnPos);

  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  const creatureId = sim.state.creatures[0]?.id ?? -1;
  const initialDistance = Math.hypot(spawnPos.x, spawnPos.y);

  let previousDistance = initialDistance;
  type Violation = { tick: number; prev: number; next: number };
  let violation: Violation | null = null;
  let checkedCount = 0;
  let settled = false;

  const inputForTick = override?.input ?? (() => idleInput());

  runSimTicks(sim, ticks, inputForTick, (tick) => {
    const creature = sim.state.creatures.find((c) => c.id === creatureId);
    if (!creature) {
      if (!violation) {
        violation = { tick, prev: previousDistance, next: Number.NaN };
      }
      return;
    }

    const freezeTicks = sim.state.player.activeEffects.freeze ?? 0;
    const energizerTicks = sim.state.player.activeEffects.energizer ?? 0;
    if (freezeTicks > 0 || energizerTicks > 0) {
      previousDistance = Math.hypot(
        creature.pos.x - sim.state.player.pos.x,
        creature.pos.y - sim.state.player.pos.y,
      );
      return;
    }

    const distance = Math.hypot(
      creature.pos.x - sim.state.player.pos.x,
      creature.pos.y - sim.state.player.pos.y,
    );

    if (!settled) {
      if (distance > previousDistance + DIST_TOLERANCE) {
        violation = { tick, prev: previousDistance, next: distance };
      }
      checkedCount += 1;
      previousDistance = distance;
      if (distance <= STOP_DISTANCE) {
        settled = true;
      }
    }
  });

  const finalDistance = sim.state.creatures[0]
    ? Math.hypot(
        sim.state.creatures[0].pos.x - sim.state.player.pos.x,
        sim.state.creatures[0].pos.y - sim.state.player.pos.y,
      )
    : Number.POSITIVE_INFINITY;

  const ok = !violation && checkedCount > 0 && finalDistance < initialDistance;

  const formatViolation = (value: Violation) =>
    `violationTick=${value.tick}, prevDistance=${value.prev}, nextDistance=${value.next}`;

  const violationDetails = violation
    ? formatViolation(violation as Violation)
    : `checkedTicks=${checkedCount}, initialDistance=${initialDistance}, finalDistance=${finalDistance}`;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok ? 'Creature converges toward the player.' : 'Creature failed to converge toward the player.',
    details: violationDetails,
    expected: {
      monotonic: true,
      finalDistanceLessThanInitial: true,
    },
    actual: {
      violation,
      checkedCount,
      finalDistance,
    },
    tags: BASE_TAGS,
  });
}

export const probeAiConverges: ProbeDefinition = {
  id: PROBE_ID,
  description: 'A single creature should reduce distance to the player over time.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runAiConvergesProbe(override)],
};
