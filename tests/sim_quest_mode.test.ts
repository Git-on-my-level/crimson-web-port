import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame, SimEvent } from '../src/sim/types';

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

function boostPlayerHp(sim: Sim): void {
  sim.state.player.hp = 1_000_000;
  sim.state.player.hpMax = 1_000_000;
  sim.state.player.baseHpMax = 1_000_000;
  sim.state.player.xpToNext = Number.MAX_SAFE_INTEGER;
  sim.state.player.xp = 0;
}

function countEvents(events: SimEvent[], type: SimEvent['type']): number {
  return events.filter((event) => event.type === type).length;
}

describe('Quest mode', () => {
  it('runs timeline spawns and succeeds after objectives complete', () => {
    const sim = new Sim({ seed: 123, mode: 'quest', questId: 'quest_test_short' });
    boostPlayerHp(sim);

    let spawnEvents = 0;
    let statusEvents: SimEvent[] = [];

    const totalTicks = 150;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const result = sim.step(IDLE_INPUT);
      spawnEvents += countEvents(result.events, 'spawnCreature');
      statusEvents = statusEvents.concat(result.events.filter((event) => event.type === 'questStatusChanged'));
    }

    expect(spawnEvents).toBeGreaterThan(0);
    expect(sim.state.modeState.kind).toBe('quest');
    if (sim.state.modeState.kind === 'quest') {
      expect(sim.state.modeState.status).toBe('Success');
      expect(sim.state.modeState.elapsedTicks).toBeGreaterThanOrEqual(120);
    }
    expect(statusEvents.some((event) => event.type === 'questStatusChanged' && event.status === 'Success')).toBe(true);
  });
});
