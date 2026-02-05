import { Sim } from '../../sim/sim';
import { WEAPONS, weaponIdFromRefId } from '../../content/weapons';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, idleInput, runSimTicks } from './utils';

const PROBE_ID = 'weapon-catalog-53';
const DEFAULT_SEED = 303;
const DEFAULT_TICKS = 1;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runWeaponCatalogProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  runSimTicks(sim, ticks, () => idleInput());

  const expectedCount = 53;
  const countOk = WEAPONS.length === expectedCount;

  const seenRefIds = new Set<number>();
  const seenIds = new Set<string>();
  const refIdMismatches: Array<{ id: string; refId: number }> = [];
  const duplicateRefIds: number[] = [];
  const duplicateIds: string[] = [];

  for (const weapon of WEAPONS) {
    if (seenIds.has(weapon.id)) {
      duplicateIds.push(weapon.id);
    } else {
      seenIds.add(weapon.id);
    }

    if (seenRefIds.has(weapon.refId)) {
      duplicateRefIds.push(weapon.refId);
    } else {
      seenRefIds.add(weapon.refId);
    }

    const mapped = weaponIdFromRefId(weapon.refId);
    if (mapped !== weapon.id) {
      refIdMismatches.push({ id: weapon.id, refId: weapon.refId });
    }
  }

  const ok = countOk && refIdMismatches.length === 0 && duplicateIds.length === 0 && duplicateRefIds.length === 0;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok ? 'Weapon catalog matches 53 entries and ref-id mapping.' : 'Weapon catalog mismatch detected.',
    details: `count=${WEAPONS.length}, refIdMismatches=${refIdMismatches.length}, duplicateIds=${duplicateIds.length}, duplicateRefIds=${duplicateRefIds.length}`,
    expected: {
      count: expectedCount,
      refIdMismatches: 0,
      duplicateIds: 0,
      duplicateRefIds: 0,
    },
    actual: {
      count: WEAPONS.length,
      refIdMismatches: refIdMismatches.slice(0, 5),
      duplicateIds: duplicateIds.slice(0, 5),
      duplicateRefIds: duplicateRefIds.slice(0, 5),
    },
    tags: BASE_TAGS,
  });
}

export const probeWeaponCatalog: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Weapon catalog should include 53 entries with consistent ref-id mapping.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  inputPatterns: ['idle'],
  run: (override?: ProbeRunOverride) => [runWeaponCatalogProbe(override)],
};
