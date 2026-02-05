import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { grantXp } from '../src/sim/systems/progression';
import type { SimEvent } from '../src/sim/types';
import { createQuestModeState, createSimState } from '../src/sim/state';
import { PERK_BY_ID } from '../src/content/perks';
import { perkCanOffer } from '../src/sim/perks';

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

describe('Perk progression', () => {
  it('offers deterministic perk choices for a seed', () => {
    const simA = new Sim({ seed: 1337 });
    const simB = new Sim({ seed: 1337 });
    simA.state.mode = 'quest';
    simB.state.mode = 'quest';
    simA.state.modeState = createQuestModeState();
    simB.state.modeState = createQuestModeState();

    const eventsA: SimEvent[] = [];
    const eventsB: SimEvent[] = [];
    grantXp(simA.state, eventsA, simA.state.player.xpToNext);
    grantXp(simB.state, eventsB, simB.state.player.xpToNext);

    simA.step({ ...NO_INPUT, openPerkMenu: true });
    simB.step({ ...NO_INPUT, openPerkMenu: true });

    expect(simA.state.phase).toBe('PerkSelect');
    expect(simB.state.phase).toBe('PerkSelect');
    expect(simA.state.perkChoices).toEqual(simB.state.perkChoices);
  });

  it('resumes play after choosing a perk', () => {
    const sim = new Sim({ seed: 42 });
    sim.state.mode = 'quest';
    sim.state.modeState = createQuestModeState();

    const events: SimEvent[] = [];
    grantXp(sim.state, events, sim.state.player.xpToNext);
    sim.step({ ...NO_INPUT, openPerkMenu: true });
    const choice = sim.state.perkChoices?.[0];
    expect(choice).toBeTruthy();

    sim.step({ ...NO_INPUT, perkChoice: 1 });

    expect(sim.state.phase).toBe('Playing');
    expect(sim.state.pendingPerks).toBe(0);
    expect(choice ? sim.state.player.perks[choice] : 0).toBe(1);
  });

  it('requires prereqs before offering gated perks', () => {
    const state = createSimState(9);
    const toxicAvenger = PERK_BY_ID['toxic_avenger'];
    expect(perkCanOffer(toxicAvenger, state.player)).toBe(false);

    state.player.perks['veins_of_poison'] = 1;
    expect(perkCanOffer(toxicAvenger, state.player)).toBe(true);
  });

  it('respects max stacks', () => {
    const state = createSimState(9);
    const instantWinner = PERK_BY_ID['instant_winner'];

    state.player.perks['instant_winner'] = 99;
    expect(perkCanOffer(instantWinner, state.player)).toBe(false);
  });
});
