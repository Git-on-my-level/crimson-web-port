import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { spawnBonus, updateBonuses } from '../../src/sim/systems/bonuses';

describe('ref parity: bonus pickup fx', () => {
  it('spawns burst effect on points bonus pickup', () => {
    const sim = new Sim({ seed: 50 });
    const events: any[] = [];

    spawnBonus(sim.state, events, { x: sim.state.player.pos.x, y: sim.state.player.pos.y }, 'points');
    const bonus = sim.state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected points bonus to spawn');
    }

    updateBonuses(sim.state, events);

    expect(bonus.active).toBe(false);
    expect(events.some((e) => e.type === 'pickup' && e.bonusType === 'points')).toBe(true);
    expect(events.some((e) => e.type === 'playSfx' && e.name === 'pickup')).toBe(true);
  });

  it('spawns screen effects on nuke bonus pickup', () => {
    const sim = new Sim({ seed: 51 });
    const events: any[] = [];

    spawnBonus(sim.state, events, { x: sim.state.player.pos.x, y: sim.state.player.pos.y }, 'nuke');
    const bonus = sim.state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected nuke bonus to spawn');
    }

    updateBonuses(sim.state, events);

    expect(bonus.active).toBe(false);
    expect(events.some((e) => e.type === 'screenShake')).toBe(true);
    expect(events.some((e) => e.type === 'screenFlash' && e.kind === 'nuke')).toBe(true);
  });

  it('plays pickup sfx on medkit bonus pickup', () => {
    const sim = new Sim({ seed: 52 });
    const events: any[] = [];

    spawnBonus(sim.state, events, { x: sim.state.player.pos.x, y: sim.state.player.pos.y }, 'medkit');
    const bonus = sim.state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected medkit bonus to spawn');
    }

    updateBonuses(sim.state, events);

    expect(bonus.active).toBe(false);
    expect(events.some((e) => e.type === 'pickup' && e.bonusType === 'medkit')).toBe(true);
    expect(events.some((e) => e.type === 'playSfx' && e.name === 'pickup')).toBe(true);
  });
});
