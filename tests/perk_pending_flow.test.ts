import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { grantXp } from '../src/sim/systems/progression';
import { xpThresholdForLevel } from '../src/sim/xp';
import type { InputFrame, SimEvent } from '../src/sim/types';

const NO_INPUT: InputFrame = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  fire: false,
  reload: false,
  weaponSwitch: null,
  pause: false,
  openPerkMenu: false,
  perkChoice: null,
};

describe('Pending perk flow', () => {
  it('queues multiple perks and opens the picker on request', () => {
    const sim = new Sim({ seed: 99 });
    const events: SimEvent[] = [];
    const xpForTwoLevels = xpThresholdForLevel(2);

    grantXp(sim.state, events, xpForTwoLevels);

    expect(sim.state.phase).toBe('Playing');
    expect(sim.state.pendingPerks).toBe(2);

    const openResult = sim.step({ ...NO_INPUT, openPerkMenu: true });
    expect(sim.state.phase).toBe('PerkSelect');
    expect(sim.state.perkChoices?.length).toBeGreaterThan(0);
    expect(openResult.events.some((event) => event.type === 'perkOffered')).toBe(true);

    sim.step({ ...NO_INPUT, perkChoice: 1 });
    expect(sim.state.phase).toBe('Playing');
    expect(sim.state.pendingPerks).toBe(1);
  });
});
