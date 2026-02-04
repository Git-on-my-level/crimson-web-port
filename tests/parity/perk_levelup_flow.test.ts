import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { grantXp } from '../../src/sim/systems/progression';
import type { InputFrame, SimEvent } from '../../src/sim/types';
import { createQuestModeState } from '../../src/sim/state';
import { getPerkDef } from '../../src/content/perks';

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
    expect(sim.state.perkChoices?.length).toBeGreaterThan(0);
    expect(events.some((event) => event.type === 'perkOffered')).toBe(true);

    const choiceIndex = 0;
    const chosen = sim.state.perkChoices?.[choiceIndex];
    expect(chosen).toBeTruthy();

    const before = { ...sim.state.player.perkStats };
    const result = sim.step({ ...NO_INPUT, perkChoice: choiceIndex + 1 });

    expect(sim.state.phase).toBe('Playing');
    if (chosen) {
      expect(sim.state.player.perks[chosen]).toBe(1);
      const after = sim.state.player.perkStats;
      const def = getPerkDef(chosen);
      const changed = Object.keys(def.modifiers).some((key) => {
        const k = key as keyof typeof before;
        return before[k] !== after[k];
      });
      expect(changed).toBe(true);
    }
    expect(result.events.some((event) => event.type === 'perkChosen')).toBe(true);
  });
});
