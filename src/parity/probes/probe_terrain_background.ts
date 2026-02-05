import { Sim } from '../../sim/sim';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'terrain-background-only';
const DEFAULT_SEED = 202;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runTerrainBackgroundProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  runSimTicks(sim, ticks, () => idleInput());

  const blocked = sim.state.terrain.blocked;
  let blockedCount = 0;
  for (let i = 0; i < blocked.length; i += 1) {
    if (blocked[i]) blockedCount += 1;
  }

  const ok = blockedCount === 0;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok ? 'Terrain has no blocked cells.' : 'Terrain contains blocked cells; expected background-only.',
    details: `blockedCount=${blockedCount}`,
    expected: { blockedCount: 0 },
    actual: { blockedCount },
    tags: BASE_TAGS,
  });
}

export const probeTerrainBackground: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Terrain should be background-only (no blocked collisions).',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runTerrainBackgroundProbe(override)],
};
