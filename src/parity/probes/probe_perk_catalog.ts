import { Sim } from '../../sim/sim';
import { PERKS, perkIdFromRefId } from '../../content/perks';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'perk-catalog-58';
const DEFAULT_SEED = 404;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runPerkCatalogProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  runSimTicks(sim, ticks, () => idleInput());

  const expectedCount = 58;
  const countOk = PERKS.length === expectedCount;

  const seenRefIds = new Set<number>();
  const seenIds = new Set<string>();
  const refIdMismatches: Array<{ id: string; refId: number }> = [];
  const duplicateRefIds: number[] = [];
  const duplicateIds: string[] = [];

  for (const perk of PERKS) {
    if (seenIds.has(perk.id)) {
      duplicateIds.push(perk.id);
    } else {
      seenIds.add(perk.id);
    }

    if (seenRefIds.has(perk.refId)) {
      duplicateRefIds.push(perk.refId);
    } else {
      seenRefIds.add(perk.refId);
    }

    const mapped = perkIdFromRefId(perk.refId);
    if (mapped !== perk.id) {
      refIdMismatches.push({ id: perk.id, refId: perk.refId });
    }
  }

  const ok = countOk && refIdMismatches.length === 0 && duplicateIds.length === 0 && duplicateRefIds.length === 0;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok ? 'Perk catalog matches 58 entries and ref-id mapping.' : 'Perk catalog mismatch detected.',
    details: `count=${PERKS.length}, refIdMismatches=${refIdMismatches.length}, duplicateIds=${duplicateIds.length}, duplicateRefIds=${duplicateRefIds.length}`,
    expected: {
      count: expectedCount,
      refIdMismatches: 0,
      duplicateIds: 0,
      duplicateRefIds: 0,
    },
    actual: {
      count: PERKS.length,
      refIdMismatches: refIdMismatches.slice(0, 5),
      duplicateIds: duplicateIds.slice(0, 5),
      duplicateRefIds: duplicateRefIds.slice(0, 5),
    },
    tags: BASE_TAGS,
  });
}

export const probePerkCatalog: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Perk catalog should include 58 entries with consistent ref-id mapping.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runPerkCatalogProbe(override)],
};
