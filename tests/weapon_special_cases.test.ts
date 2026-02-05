import { describe, expect, it } from 'vitest';
import { createSimState } from '../src/sim/state';
import { updateWeapons } from '../src/sim/systems/weapons';
import { EMPTY_INPUT, type SimEvent } from '../src/sim/types';

const AIM_INPUT = { ...EMPTY_INPUT, aimX: 10, aimY: 0, fire: true };

describe('Weapon special cases', () => {
  it('multi-plasma fires 5 projectiles with fixed offsets and types', () => {
    const state = createSimState(1);
    state.player.weaponId = 'multi_plasma';
    state.player.ammo = 8;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = AIM_INPUT;

    const events: SimEvent[] = [];
    updateWeapons(state, events, 1 / 60);

    const projectiles: Array<{ kind: string; angle: number }> = [];
    state.projectilePool.forEachActive((_id, proj) => {
      projectiles.push({ kind: proj.kind, angle: Math.atan2(proj.vel.y, proj.vel.x) });
    });

    expect(projectiles).toHaveLength(5);

    const expected = [
      { angle: -Math.PI / 6, kind: 'plasma_minigun' },
      { angle: -Math.PI / 10, kind: 'plasma_rifle' },
      { angle: 0, kind: 'plasma_rifle' },
      { angle: Math.PI / 10, kind: 'plasma_rifle' },
      { angle: Math.PI / 6, kind: 'plasma_minigun' },
    ].sort((a, b) => a.angle - b.angle);

    const actual = projectiles.sort((a, b) => a.angle - b.angle);

    for (let i = 0; i < expected.length; i += 1) {
      expect(actual[i].kind).toBe(expected[i].kind);
      expect(actual[i].angle).toBeCloseTo(expected[i].angle, 6);
    }
  });

  it('plasma shotgun spawns 14 pellets with randomized speed scale', () => {
    const state = createSimState(2);
    state.player.weaponId = 'plasma_shotgun';
    state.player.ammo = 8;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = AIM_INPUT;

    const events: SimEvent[] = [];
    updateWeapons(state, events, 1 / 60);

    const speedScales: number[] = [];
    state.projectilePool.forEachActive((_id, proj) => {
      expect(proj.kind).toBe('plasma_minigun');
      speedScales.push(proj.speedScale);
    });

    expect(speedScales).toHaveLength(14);
    const min = Math.min(...speedScales);
    const max = Math.max(...speedScales);
    expect(min).toBeGreaterThanOrEqual(1.0);
    expect(max).toBeLessThanOrEqual(1.99);
  });

  it('mini-rocket swarmers consume full clip and spawn a rocket per ammo', () => {
    const state = createSimState(3);
    state.player.weaponId = 'mini_rocket_swarmers';
    state.player.ammo = 5;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = AIM_INPUT;

    const events: SimEvent[] = [];
    updateWeapons(state, events, 1 / 60);

    const spawned: number[] = [];
    state.secondaryProjectilePool.forEachActive((id) => {
      spawned.push(id);
    });

    expect(spawned).toHaveLength(5);
    expect(state.player.ammo).toBe(0);
  });
});
