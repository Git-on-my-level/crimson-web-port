import { Sim } from '../../sim/sim';
import { grantXp } from '../../sim/systems/progression';
import { xpThresholdForLevel } from '../../sim/xp';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'pending-perk-flow';
const DEFAULT_SEED = 606;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runPendingPerkFlowProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  const threshold = xpThresholdForLevel(sim.state.player.level);
  const grant = Math.max(1, threshold - sim.state.player.xp + 1);

  grantXp(sim.state, [], grant);

  override?.setup?.(sim);

  runSimTicks(sim, override?.ticks ?? DEFAULT_TICKS, () => idleInput());

  const pendingPerks = sim.state.pendingPerks;
  const inPerkSelect = sim.state.phase === 'PerkSelect';
  const hasChoices = Array.isArray(sim.state.perkChoices) && sim.state.perkChoices.length > 0;

  const ok = pendingPerks > 0 && !inPerkSelect && !hasChoices;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok
      ? 'Level-up queues pending perks without entering perk selection.'
      : 'Level-up immediately entered perk selection or failed to queue.',
    details: `pendingPerks=${pendingPerks}, phase=${sim.state.phase}, hasChoices=${hasChoices}`,
    expected: { pendingPerks: '>=1', phase: 'Playing', perkChoices: 'null/empty' },
    actual: { pendingPerks, phase: sim.state.phase, perkChoices: sim.state.perkChoices ?? null },
    tags: BASE_TAGS,
  });
}

export const probePendingPerkFlow: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Level-up should queue pending perks without auto-opening selection.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runPendingPerkFlowProbe(override)],
};
