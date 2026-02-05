import { describe, expect, it } from 'vitest';
import { createSimState } from '../src/sim/state';
import { updateWeapons } from '../src/sim/systems/weapons';
import { EMPTY_INPUT } from '../src/sim/types';

describe('Projectile damage scale', () => {
  it('spawns projectile with correct damage from meta and damageScale', () => {
    const state = createSimState(1);
    state.player.weaponId = 'pistol';
    state.player.ammo = 12;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = {
      ...EMPTY_INPUT,
      aimX: 10,
      aimY: 0,
      fire: true,
    };

    const events: any[] = [];
    updateWeapons(state, events, 1 / 60);

    let projectile: any = null;
    state.projectilePool.forEachActive((_id, proj) => {
      projectile = proj;
    });

    expect(projectile).not.toBeNull();
    expect(projectile?.damage).toBeCloseTo(4.1, 2);
  });

  it('applies damage multiplier from bonuses', () => {
    const state = createSimState(1);
    state.player.weaponId = 'assault_rifle';
    state.player.ammo = 25;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.activeEffects['fire_bullets'] = 100;
    state.player.input = {
      ...EMPTY_INPUT,
      aimX: 10,
      aimY: 0,
      fire: true,
    };

    const events: any[] = [];
    updateWeapons(state, events, 1 / 60);

    let projectile: any = null;
    state.projectilePool.forEachActive((_id, proj) => {
      projectile = proj;
    });

    expect(projectile).not.toBeNull();
    expect(projectile?.damage).toBeCloseTo(1.25, 2);
  });

  it('respects speedScale option when spawning', () => {
    const state = createSimState(1);
    state.player.weaponId = 'plasma_shotgun';
    state.player.ammo = 8;
    state.player.shotCooldown = 0;
    state.player.reloadTimer = 0;
    state.player.spreadHeat = 0;
    state.player.input = {
      ...EMPTY_INPUT,
      aimX: 10,
      aimY: 0,
      fire: true,
    };

    const events: any[] = [];
    updateWeapons(state, events, 1 / 60);

    const speedScales: number[] = [];
    state.projectilePool.forEachActive((_id, proj) => {
      speedScales.push(proj.speedScale);
    });

    expect(speedScales).toHaveLength(14);
    expect(speedScales.some(s => s > 1.0)).toBe(true);
    expect(speedScales.every(s => s >= 1.0 && s <= 2.0)).toBe(true);
  });
});
