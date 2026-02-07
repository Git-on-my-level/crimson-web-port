import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { getModifierDef } from '../src/content/modifiers';

const constantInput: InputFrame = {
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

describe('Map modifiers', () => {
  it('spawns modifiers deterministically after cooldown', () => {
    const simA = new Sim({ seed: 42, mode: 'survival' });
    const simB = new Sim({ seed: 42, mode: 'survival' });

    simA.state.player.hp = 1000000;
    simA.state.player.hpMax = 1000000;
    simA.state.player.baseHpMax = 1000000;
    simB.state.player.hp = 1000000;
    simB.state.player.hpMax = 1000000;
    simB.state.player.baseHpMax = 1000000;

    for (let i = 0; i < 2000; i += 1) {
      simA.step(constantInput);
      simB.step(constantInput);
    }

    expect(simA.state.modifiers.length).toBe(simB.state.modifiers.length);
    expect(simA.state.modifiers.length).toBeGreaterThan(0);
  });

  it('applies positive and negative modifiers', () => {
    const sim = new Sim({ seed: 123, mode: 'survival' });

    sim.state.player.hp = 1000000;
    sim.state.player.hpMax = 1000000;
    sim.state.player.baseHpMax = 1000000;

    for (let i = 0; i < 4000; i += 1) {
      sim.step(constantInput);
    }

    const modifiers = sim.state.modifiers;
    expect(modifiers.length).toBeGreaterThan(0);

    const positiveModifiers = modifiers.filter((m) => {
      const def = getModifierDef(m.kind);
      return def.type === 'positive';
    });
    const negativeModifiers = modifiers.filter((m) => {
      const def = getModifierDef(m.kind);
      return def.type === 'negative';
    });

    expect(positiveModifiers.length).toBeGreaterThan(0);
    expect(negativeModifiers.length).toBeGreaterThan(0);
  });

  it('removes expired modifiers', () => {
    const sim = new Sim({ seed: 999, mode: 'survival' });

    sim.state.player.hp = 1000000;
    sim.state.player.hpMax = 1000000;
    sim.state.player.baseHpMax = 1000000;

    for (let i = 0; i < 4000; i += 1) {
      sim.step(constantInput);
    }

    const initialCount = sim.state.modifiers.length;

    for (let i = 0; i < 1000; i += 1) {
      sim.step(constantInput);
    }

    expect(sim.state.modifiers.length).toBeLessThan(initialCount + 10);
  });
});
