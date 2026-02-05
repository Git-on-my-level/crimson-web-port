import { Sim } from '../../sim/sim';
import { assignWeapon, unlockWeapon } from '../../sim/weapons/weaponTable';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, clearTerrain, constantFireInput, runSimTicks } from './utils';
import { WEAPON_BY_ID } from '../../content/weapons';

const PROBE_ID = 'reload-happens';
const DEFAULT_SEED = 121;
const DEFAULT_TICKS = 420;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runReloadProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  clearTerrain(sim.state);

  unlockWeapon(sim.state.player, 'smg');
  assignWeapon(sim.state.player, 'smg');
  const weapon = WEAPON_BY_ID.smg;
  const ammoMax = weapon.ammoMax ?? 0;
  sim.state.player.ammo = ammoMax;
  sim.state.player.reloadTicksRemaining = 0;

  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  const ammoStart = sim.state.player.ammo;
  let minAmmo = ammoStart;
  let reloadStarted = false;
  let reloadCompleted = false;
  let lastReload = sim.state.player.reloadTicksRemaining;

  const inputForTick = override?.input ?? (() => constantFireInput());

  runSimTicks(sim, ticks, inputForTick, () => {
    minAmmo = Math.min(minAmmo, sim.state.player.ammo);
    const reloadNow = sim.state.player.reloadTicksRemaining;
    if (!reloadStarted && reloadNow > 0) {
      reloadStarted = true;
    }
    if (lastReload > 0 && reloadNow <= 0) {
      reloadCompleted = true;
    }
    lastReload = reloadNow;
  });

  const ammoDropped = minAmmo < ammoStart;
  const ok = ammoDropped && reloadStarted && reloadCompleted;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok
      ? 'Reloads trigger during sustained fire.'
      : 'Expected ammo to drop and reload to complete during sustained fire.',
    details: `ammoStart=${ammoStart}, minAmmo=${minAmmo}, reloadStarted=${reloadStarted}, reloadCompleted=${reloadCompleted}`,
    expected: {
      ammoDropped: true,
      reloadStarted: true,
      reloadCompleted: true,
    },
    actual: {
      ammoDropped,
      reloadStarted,
      reloadCompleted,
    },
    tags: BASE_TAGS,
  });
}

export const probeReloadHappens: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Constant fire must drop ammo and trigger a reload transition.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  run: (override?: ProbeRunOverride) => [runReloadProbe(override)],
};
