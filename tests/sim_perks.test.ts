import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { grantXp } from '../src/sim/systems/progression';
import type { SimEvent } from '../src/sim/types';
import { createQuestModeState, createSimState } from '../src/sim/state';
import { getPerkDef } from '../src/content/perks';
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
    const choice = sim.state.perkChoices?.[0];
    expect(choice).toBeTruthy();

    sim.step({ ...NO_INPUT, perkChoice: 1 });

    expect(sim.state.phase).toBe('Playing');
    expect(choice ? sim.state.player.perks[choice] : 0).toBe(1);
  });

  it('requires prereqs before offering gated perks', () => {
    const state = createSimState(9);
    const powerCell = getPerkDef('power_cell');
    expect(perkCanOffer(powerCell, state.player)).toBe(false);

    state.player.perks.damage_up = 1;
    expect(perkCanOffer(powerCell, state.player)).toBe(true);
  });

  it('honors exclusive perk groups', () => {
    const state = createSimState(11);
    state.player.perks.sharpshooter = 1;

    const spray = getPerkDef('spray_and_pray');
    expect(perkCanOffer(spray, state.player)).toBe(false);
  });
});
