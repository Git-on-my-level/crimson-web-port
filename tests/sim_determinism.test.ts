import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { createQuestModeState } from '../src/sim/state';

const constantInput: InputFrame = {
  moveX: 1,
  moveY: 0,
  aimX: 100,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  perkChoice: null,
};

describe('Sim determinism', () => {
  it('advances ticks and player position deterministically', () => {
    const simA = new Sim({ seed: 123, mode: 'survival' });
    const simB = new Sim({ seed: 123, mode: 'survival' });

    for (let i = 0; i < 300; i += 1) {
      simA.step(constantInput);
      simB.step(constantInput);
    }

    expect(simA.state.tick).toBe(300);
    expect(simB.state.tick).toBe(300);
    expect(simA.state.player.pos.x).toBeCloseTo(simB.state.player.pos.x, 6);
    expect(simA.state.player.pos.y).toBeCloseTo(simB.state.player.pos.y, 6);
    expect(simA.state.player.vel.x).toBeCloseTo(simB.state.player.vel.x, 6);
    expect(simA.state.player.vel.y).toBeCloseTo(simB.state.player.vel.y, 6);
  });

  it('produces identical RNG sequences from the same seed', () => {
    const simA = new Sim({ seed: 42 });
    const simB = new Sim({ seed: 42 });

    const sequenceA = [
      simA.state.rng.nextInt(1000),
      simA.state.rng.nextFloat01(),
      simA.state.rng.nextInt(1000),
    ];
    const sequenceB = [
      simB.state.rng.nextInt(1000),
      simB.state.rng.nextFloat01(),
      simB.state.rng.nextInt(1000),
    ];

    expect(sequenceA).toEqual(sequenceB);
  });

  it('spawns deterministic projectiles when firing', () => {
    const sim = new Sim({ seed: 7, mode: 'survival' });
    const firingInput: InputFrame = {
      moveX: 0,
      moveY: 0,
      aimX: 100,
      aimY: 0,
      fire: true,
      reload: false,
      weaponSwitch: null,
      pause: false,
      perkChoice: null,
    };

    for (let i = 0; i < 30; i += 1) {
      sim.step(firingInput);
    }

    expect(sim.state.projectiles.length).toBe(3);
    for (const projectile of sim.state.projectiles) {
      expect(projectile.owner).toBe('player');
      expect(projectile.alive).toBe(true);
    }
  });
});
