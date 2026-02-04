import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { assertSimInvariants } from '../src/sim/diagnostics';

const TOTAL_TICKS = 180;
const FIRE_INTERVAL_TICKS = 6;

function scriptedInput(sim: Sim, tick: number): InputFrame {
  const fire = tick % FIRE_INTERVAL_TICKS === 0;
  return {
    moveX: 0,
    moveY: 0,
    aimX: sim.state.player.pos.x + 20,
    aimY: sim.state.player.pos.y,
    fire,
    reload: false,
    weaponSwitch: null,
    pause: false,
    perkChoice: null,
  };
}

describe('Sim invariants', () => {
  it('keeps entity ids unique while firing projectiles', () => {
    const sim = new Sim({ seed: 2026 });
    let sawProjectile = false;

    for (let tick = 0; tick < TOTAL_TICKS; tick += 1) {
      const input = scriptedInput(sim, tick);
      sim.step(input);
      if (sim.state.projectiles.length > 0) {
        sawProjectile = true;
      }
      assertSimInvariants(sim.state);
    }

    expect(sawProjectile).toBe(true);
  });
});
