import { describe, expect, it } from 'vitest';
import type { CreatureState } from '../src/sim/state';
import { createSimState } from '../src/sim/state';
import { updateWeapons } from '../src/sim/systems/weapons';
import { resolveCollisions } from '../src/sim/systems/collision';
import { spawnParticleFast } from '../src/sim/systems/particles';
import { EMPTY_INPUT, type SimEvent } from '../src/sim/types';

const AIM_INPUT = { ...EMPTY_INPUT, aimX: 10, aimY: 0, fire: true };

function makeCreature(id: number, x: number, y: number, hp = 20): CreatureState {
  return {
    id,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    hp,
    hpMax: hp,
    radius: 1,
    speed: 0,
    touchDamage: 0,
    touchCooldownTicks: 0,
    alive: true,
    kind: 'grunt',
    heading: 0,
    targetHeading: 0,
    moveScale: 1.0,
    aiMode: 0,
    flags: 0,
    linkIndex: -1,
    targetOffsetX: 0,
    targetOffsetY: 0,
    phaseSeed: 0,
    orbitAngle: 0,
    orbitRadius: 0,
    targetPos: { x, y },
    forceTarget: 0,
  };
}

describe('Particle weapons', () => {
  it('flamethrower drains ammo and spawns a particle', () => {
    const state = createSimState(5);
    state.player.weaponId = 'flamethrower';
    state.player.ammo = 1;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = AIM_INPUT;

    const events: SimEvent[] = [];
    updateWeapons(state, events, 1 / 60);

    expect(state.player.ammo).toBeCloseTo(0.9, 5);
    expect(state.particlePool.getActiveCount()).toBe(1);
  });

  it('particles damage creatures when overlapping', () => {
    const state = createSimState(6);
    const events: SimEvent[] = [];

    state.creatures = [makeCreature(10, 0, 0, 10)];

    spawnParticleFast(state, events, { x: 0, y: 0 }, 0, 0, 'player', { damagePerTick: 2, radius: 2 });

    resolveCollisions(state, events);

    expect(state.creatures[0].hp).toBeLessThan(10);
    const damageEvents = events.filter((event) => event.type === 'damage' && event.target === 'creature');
    expect(damageEvents.length).toBeGreaterThan(0);
  });
});
