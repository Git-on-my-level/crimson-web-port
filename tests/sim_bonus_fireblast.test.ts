import { describe, expect, it } from 'vitest';
import { createSimState } from '../src/sim/state';
import { spawnBonus, updateBonuses } from '../src/sim/systems/bonuses';
import type { SimEvent } from '../src/sim/types';

describe('Fireblast bonus', () => {
  it('spawns a radial burst of projectiles on pickup', () => {
    const state = createSimState(120);
    const events: SimEvent[] = [];

    spawnBonus(state, events, { x: state.player.pos.x, y: state.player.pos.y }, 'fireblast');
    const bonus = state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected fireblast bonus to spawn');
    }
    bonus.pos = { x: state.player.pos.x, y: state.player.pos.y };

    updateBonuses(state, events);

    const projectileSpawns = events.filter((event) => event.type === 'spawnProjectile');
    expect(projectileSpawns).toHaveLength(16);
  });
});
