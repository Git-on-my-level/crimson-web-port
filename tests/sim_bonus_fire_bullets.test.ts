import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { getFireBulletsPelletCount } from '../src/sim/systems/weapons';

const firingInput: InputFrame = {
  moveX: 0,
  moveY: 0,
  aimX: 100,
  aimY: 0,
  fire: true,
  reload: false,
  weaponSwitch: null,
  pause: false,
  openPerkMenu: false,
  perkChoice: null,
};

describe('Fire bullets bonus', () => {
  it('overrides projectile kind and pellet count while active', () => {
    const sim = new Sim({ seed: 12 });
    sim.state.player.weaponId = 'shotgun';
    sim.state.player.ammo = 8;
    sim.state.player.activeEffects.fire_bullets = 60;

    sim.step(firingInput);

    const expectedPellets = getFireBulletsPelletCount('shotgun');
    expect(sim.state.projectiles.length).toBe(expectedPellets);
    for (const projectile of sim.state.projectiles) {
      expect(projectile.kind).toBe('fire_bullets');
    }
  });
});
