import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { grantXp } from '../../src/sim/systems/progression';
import type { InputFrame, SimEvent } from '../../src/sim/types';
import { createQuestModeState } from '../../src/sim/state';

const NO_INPUT: InputFrame = {
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

describe('Parity: perk level-up flow', () => {
  it('offers perks on level up and applies selection', () => {
    const sim = new Sim({ seed: 1337 });
    sim.state.mode = 'quest';
    sim.state.modeState = createQuestModeState();

    const events: SimEvent[] = [];
    grantXp(sim.state, events, sim.state.player.xpToNext);

    expect(sim.state.phase).toBe('PerkSelect');
    expect(sim.state.perkChoices).toEqual(['sharpshooter', 'spray_and_pray', 'rapid_fire']);
    expect(events.some((event) => event.type === 'perkOffered')).toBe(true);

    const choiceIndex = sim.state.perkChoices?.indexOf('rapid_fire') ?? -1;
    expect(choiceIndex).toBeGreaterThanOrEqual(0);

    const result = sim.step({ ...NO_INPUT, perkChoice: choiceIndex + 1 });

    expect(sim.state.phase).toBe('Playing');
    expect(sim.state.player.perks.rapid_fire).toBe(1);
    expect(sim.state.player.perkStats.fireRateMultiplier).toBeCloseTo(1.1, 5);
    expect(result.events.some((event) => event.type === 'perkChosen')).toBe(true);
  });
});
