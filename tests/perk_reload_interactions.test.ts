import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';

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

describe('Perk reload interactions', () => {
  it('Stationary Reloader decays reload timer 3x faster when not moving', () => {
    const sim = new Sim({ seed: 1 });
    const dt = sim.fixedDeltaSeconds;

    sim.state.player.perks['stationary_reloader'] = 1;
    sim.state.player.weaponId = 'shotgun';
    sim.state.player.ammo = 0;
    sim.state.player.reloadTimer = 1;
    sim.state.player.reloadTimerMax = 1;

    sim.step({ ...NO_INPUT, moveX: 0, moveY: 0 });

    expect(sim.state.player.reloadTimer).toBeCloseTo(1 - dt * 3, 4);
  });

  it('Anxious Loader reduces reload timer on fire press while reloading', () => {
    const sim = new Sim({ seed: 2 });
    const dt = sim.fixedDeltaSeconds;

    sim.state.player.perks['anxious_loader'] = 1;
    sim.state.player.weaponId = 'shotgun';
    sim.state.player.ammo = 0;
    sim.state.player.reloadTimer = 1;
    sim.state.player.reloadTimerMax = 1;

    sim.step({ ...NO_INPUT, fire: true });
    expect(sim.state.player.reloadTimer).toBeCloseTo(1 - 0.05 - dt, 4);

    const afterFirst = sim.state.player.reloadTimer;
    sim.step({ ...NO_INPUT, fire: false });
    const afterRelease = sim.state.player.reloadTimer;

    sim.step({ ...NO_INPUT, fire: true });
    expect(sim.state.player.reloadTimer).toBeCloseTo(afterRelease - 0.05 - dt, 4);
    expect(afterRelease).toBeCloseTo(afterFirst - dt, 4);
  });
});
