import { describe, expect, it } from 'vitest';
import type { CreatureState } from '../src/sim/state';
import { createSimState } from '../src/sim/state';
import { spawnBonus, updateBonuses } from '../src/sim/systems/bonuses';
import type { SimEvent } from '../src/sim/types';

function makeCreature(id: number, x: number, y: number, hp = 200): CreatureState {
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

describe('Nuke bonus', () => {
  it('deals stronger damage to nearby creatures and emits FX events', () => {
    const state = createSimState(404);
    const events: SimEvent[] = [];

    state.creatures = [makeCreature(1, 2, 0), makeCreature(2, 12, 0)];

    spawnBonus(state, events, { x: state.player.pos.x, y: state.player.pos.y }, 'nuke');
    const bonus = state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected nuke bonus to spawn');
    }
    bonus.pos = { x: state.player.pos.x, y: state.player.pos.y };

    updateBonuses(state, events);

    const near = state.creatures[0];
    const far = state.creatures[1];
    expect(near.hp).toBeLessThan(near.hpMax);
    expect(far.hp).toBeLessThan(far.hpMax);
    expect(near.hp).toBeLessThan(far.hp);

    const fxEvents = events.filter((event) => event.type === 'screenShake' || event.type === 'screenFlash');
    expect(fxEvents.length).toBeGreaterThan(0);
  });
});
