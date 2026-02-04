import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';

const constantInput: InputFrame = {
  moveX: 1,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  fire: false,
  reload: false,
  pause: false,
};

describe('Sim determinism', () => {
  it('advances ticks and player position deterministically', () => {
    const sim = new Sim({ seed: 123 });

    for (let i = 0; i < 300; i += 1) {
      sim.step(constantInput);
    }

    expect(sim.state.tick).toBe(300);
    expect(sim.state.player.pos.x).toBe(sim.state.player.speed * 300);
    expect(sim.state.player.pos.y).toBe(0);
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
});
