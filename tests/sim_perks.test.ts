import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { grantXp } from '../src/sim/systems/progression';
import type { SimEvent } from '../src/sim/types';
import { createQuestModeState } from '../src/sim/state';

const NO_INPUT = {
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

describe('Perk progression', () => {
  it('offers deterministic perk choices for a seed', () => {
    const sim = new Sim({ seed: 1337 });
    sim.state.mode = 'quest';
    sim.state.modeState = createQuestModeState();

    const events: SimEvent[] = [];
    grantXp(sim.state, events, sim.state.player.xpToNext);

    expect(sim.state.phase).toBe('PerkSelect');
    expect(sim.state.perkChoices).toEqual(['sharpshooter', 'spray_and_pray', 'rapid_fire']);
  });

  it('resumes play after choosing a perk', () => {
    const sim = new Sim({ seed: 42 });
    sim.state.mode = 'quest';
    sim.state.modeState = createQuestModeState();

    const events: SimEvent[] = [];
    grantXp(sim.state, events, sim.state.player.xpToNext);
    const choice = sim.state.perkChoices?.[0];
    expect(choice).toBeTruthy();

    sim.step({ ...NO_INPUT, perkChoice: 1 });

    expect(sim.state.phase).toBe('Playing');
    expect(choice ? sim.state.player.perks[choice] : 0).toBe(1);
  });
});
