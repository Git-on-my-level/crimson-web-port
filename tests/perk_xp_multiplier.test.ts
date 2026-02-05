import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { grantXp } from '../src/sim/systems/progression';
import { recomputePerkStats } from '../src/sim/perks';
import type { SimEvent } from '../src/sim/types';

const NO_INPUT = {
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

describe('Perk XP multiplier', () => {
  it('grants base XP without Bloody Mess', () => {
    const sim = new Sim({ seed: 42 });

    const events: SimEvent[] = [];
    grantXp(sim.state, events, 100);

    const xpEvent = events.find((e) => e.type === 'xp');
    expect(xpEvent).toBeDefined();
    expect(xpEvent?.amount).toBe(100);
    expect(sim.state.player.xp).toBe(100);
  });

  it('grants 30% more XP with Bloody Mess / Quick Learner', () => {
    const sim = new Sim({ seed: 42 });

    sim.state.player.perks['bloody_mess_quick_learner'] = 1;
    recomputePerkStats(sim.state.player);

    const events: SimEvent[] = [];
    grantXp(sim.state, events, 100);

    const xpEvent = events.find((e) => e.type === 'xp');
    expect(xpEvent).toBeDefined();
    expect(xpEvent?.amount).toBe(130);
    expect(sim.state.player.xp).toBe(130);
  });

  it('XP multiplier stacks with Lean Mean Exp Machine', () => {
    const sim = new Sim({ seed: 42 });

    sim.state.player.perks['bloody_mess_quick_learner'] = 1;
    sim.state.player.perks['lean_mean_exp_machine'] = 1;
    recomputePerkStats(sim.state.player);

    const events: SimEvent[] = [];
    grantXp(sim.state, events, 100);

    const xpEvent = events.find((e) => e.type === 'xp');
    expect(xpEvent).toBeDefined();
    expect(xpEvent?.amount).toBe(180);
    expect(sim.state.player.xp).toBe(180);
  });


});
