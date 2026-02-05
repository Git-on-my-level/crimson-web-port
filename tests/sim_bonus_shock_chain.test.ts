import { describe, expect, it } from 'vitest';
import type { CreatureState } from '../src/sim/state';
import { createSimState } from '../src/sim/state';
import { spawnBonus, updateBonuses } from '../src/sim/systems/bonuses';
import type { SimEvent } from '../src/sim/types';

function makeCreature(id: number, x: number, y: number, hp = 100): CreatureState {
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

describe('Shock chain bonus', () => {
  it('chains across nearby creatures deterministically', () => {
    const state = createSimState(202);
    const events: SimEvent[] = [];

    state.creatures = [
      makeCreature(10, 4, 0),
      makeCreature(11, 7, 0),
      makeCreature(12, 10, 0),
      makeCreature(13, 13, 0),
    ];

    spawnBonus(state, events, { x: state.player.pos.x, y: state.player.pos.y }, 'shock_chain');
    const bonus = state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected shock chain bonus to spawn');
    }
    bonus.pos = { x: state.player.pos.x, y: state.player.pos.y };

    updateBonuses(state, events);

    const damageEvents = events.filter((event) => event.type === 'damage' && event.target === 'creature');
    const damagedIds = new Set(damageEvents.map((event) => event.id));
    expect(damagedIds.size).toBeGreaterThanOrEqual(3);
    for (const creature of state.creatures) {
      if (damagedIds.has(creature.id)) {
        expect(creature.hp).toBeLessThan(creature.hpMax);
      }
    }
  });
});
