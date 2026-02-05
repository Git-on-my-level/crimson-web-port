import { Sim } from '../../sim/sim';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../sim/world';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'world-size-1024';
const DEFAULT_SEED = 101;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runWorldSizeProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  runSimTicks(sim, ticks, () => idleInput());

  const ok = WORLD_WIDTH === 1024 && WORLD_HEIGHT === 1024;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok ? 'World bounds are 1024x1024.' : 'World bounds diverged from 1024x1024 target.',
    details: `WORLD_WIDTH=${WORLD_WIDTH}, WORLD_HEIGHT=${WORLD_HEIGHT}`,
    expected: { width: 1024, height: 1024 },
    actual: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
    tags: BASE_TAGS,
  });
}

export const probeWorldSize: ProbeDefinition = {
  id: PROBE_ID,
  description: 'World size should remain 1024x1024.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runWorldSizeProbe(override)],
};
