import { Sim } from '../../sim/sim';
import { assignWeapon, unlockWeapon } from '../../sim/weapons/weaponTable';
import type { ProbeDefinition, ProbeRunOverride } from './types';
import { buildProbeFinding, clearTerrain, constantFireInput, runSimTicks } from './utils';
import { spawnCreatureAtPosition } from '../../sim/systems/creatures';

const PROBE_ID = 'projectiles-spawn';
const DEFAULT_SEED = 444;
const DEFAULT_TICKS = 120;
const BASE_TAGS = ['dynamic', `probe:${PROBE_ID}`];

function runProjectilesProbe(override?: ProbeRunOverride) {
  const sim = new Sim({ seed: override?.seed ?? DEFAULT_SEED, mode: 'survival' });
  clearTerrain(sim.state);
  sim.state.player.pos.x = 0;
  sim.state.player.pos.y = 0;

  unlockWeapon(sim.state.player, 'smg');
  assignWeapon(sim.state.player, 'smg');

  spawnCreatureAtPosition(sim.state, [], 'grunt', { x: 8, y: 0 });
  if (sim.state.creatures[0]) {
    sim.state.creatures[0].speed = 0;
  }

  override?.setup?.(sim);

  const ticks = override?.ticks ?? DEFAULT_TICKS;
  let projectileSpawned = false;
  let creatureDamaged = false;

  const inputForTick = override?.input ?? (() => constantFireInput());

  runSimTicks(sim, ticks, inputForTick, (_tick, _sim, events) => {
    for (const event of events) {
      if (event.type === 'spawnProjectile') {
        projectileSpawned = true;
      }
      if (event.type === 'damage' && event.target === 'creature') {
        creatureDamaged = true;
      }
    }
  });

  const ok = projectileSpawned && creatureDamaged;

  return buildProbeFinding({
    id: `probe:${PROBE_ID}`,
    ok,
    message: ok
      ? 'Projectile spawns and damage events fire during constant fire.'
      : 'Expected projectiles to spawn and damage creatures during constant fire.',
    details: `projectileSpawned=${projectileSpawned}, creatureDamaged=${creatureDamaged}`,
    expected: {
      spawnProjectile: true,
      damageEvent: true,
    },
    actual: {
      spawnProjectile: projectileSpawned,
      damageEvent: creatureDamaged,
    },
    tags: BASE_TAGS,
  });
}

export const probeProjectilesSpawn: ProbeDefinition = {
  id: PROBE_ID,
  description: 'Constant fire should spawn projectiles and cause damage events.',
  tags: BASE_TAGS,
  defaultSeed: DEFAULT_SEED,
  defaultTicks: DEFAULT_TICKS,
  run: (override?: ProbeRunOverride) => [runProjectilesProbe(override)],
};
