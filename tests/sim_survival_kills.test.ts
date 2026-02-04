import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame, SimEvent } from '../src/sim/types';
import { spawnCreatureAtPosition } from '../src/sim/systems/creatures';
import { spawnProjectile } from '../src/sim/systems/projectiles';

const IDLE_INPUT: InputFrame = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  perkChoice: null,
};

describe('Survival kill tracking', () => {
  it('increments killsTotal when a creature dies', () => {
    const sim = new Sim({ seed: 123, mode: 'survival' });
    const events: SimEvent[] = [];
    const spawnPos = { x: 6, y: 0 };

    spawnCreatureAtPosition(sim.state, events, 'grunt', spawnPos);
    spawnProjectile(sim.state, events, spawnPos, { x: 0, y: 0 }, 'test', 999, 10, 'player', 0.5);

    sim.step(IDLE_INPUT);

    if (sim.state.modeState.kind !== 'survival') {
      throw new Error('Expected survival mode state');
    }
    expect(sim.state.modeState.killsTotal).toBe(1);
  });
});
