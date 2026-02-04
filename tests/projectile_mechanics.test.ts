import { describe, expect, it } from 'vitest';
import type { CreatureState } from '../src/sim/state';
import { createSimState } from '../src/sim/state';
import { resolveCollisions } from '../src/sim/systems/collision';
import { spawnProjectile, updateProjectiles } from '../src/sim/systems/projectiles';
import type { SimEvent } from '../src/sim/types';

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
  };
}

describe('Projectile mechanics', () => {
  it('piercing projectile hits two targets in a line', () => {
    const state = createSimState(1);
    const events: SimEvent[] = [];

    state.creatures = [makeCreature(10, 5, 0), makeCreature(11, 7, 0)];

    spawnProjectile(
      state,
      events,
      { x: 6, y: 0 },
      { x: 0, y: 0 },
      'sniper',
      6,
      10,
      'player',
      0.4,
      { pierceRemaining: 1 },
    );

    resolveCollisions(state, events);

    expect(state.creatures[0].hp).toBe(14);
    expect(state.creatures[1].hp).toBe(14);
  });

  it('explosive projectile damages multiple targets in radius', () => {
    const state = createSimState(2);
    const events: SimEvent[] = [];

    state.creatures = [
      makeCreature(10, 0, 0),
      makeCreature(11, 2.5, 0),
      makeCreature(12, 3.2, 0),
    ];

    spawnProjectile(
      state,
      events,
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      'rocket',
      10,
      10,
      'player',
      0.6,
      { explosionRadius: 3, explosionDamage: 5 },
    );

    resolveCollisions(state, events);

    for (const creature of state.creatures) {
      expect(creature.hp).toBe(15);
    }
  });

  it('projectile lifetime expires deterministically', () => {
    const state = createSimState(3);
    const events: SimEvent[] = [];

    spawnProjectile(
      state,
      events,
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      'pistol',
      4,
      2,
      'player',
    );

    updateProjectiles(state, events, 1 / 60);
    expect(state.projectiles.length).toBe(1);

    updateProjectiles(state, events, 1 / 60);
    expect(state.projectiles.length).toBe(0);
  });
});
