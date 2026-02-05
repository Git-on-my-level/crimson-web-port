import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { updatePlayer } from '../src/sim/systems/player';
import { updateWeapons } from '../src/sim/systems/weapons';
import { EMPTY_INPUT, type SimEvent } from '../src/sim/types';
import { WEAPON_BY_ID } from '../src/content/weapons';

const AIM_INPUT = { ...EMPTY_INPUT, aimX: 1, aimY: 0 };

describe('Player spread heat', () => {
  it('decays spread heat at 0.4 * dt down to 0.01', () => {
    const sim = new Sim({ seed: 1 });
    sim.state.player.spreadHeat = 0.2;
    sim.state.player.input = AIM_INPUT;

    const dt = sim.fixedDeltaSeconds;
    updatePlayer(sim.state, dt);

    expect(sim.state.player.spreadHeat).toBeCloseTo(0.2 - 0.4 * dt, 6);

    sim.state.player.spreadHeat = 0.02;
    updatePlayer(sim.state, 1);
    expect(sim.state.player.spreadHeat).toBe(0.01);
  });

  it('increases spread heat by spreadHeatInc * 1.3 and clamps at 0.48', () => {
    const sim = new Sim({ seed: 2 });
    const weapon = WEAPON_BY_ID.pistol;

    sim.state.player.weaponId = 'pistol';
    sim.state.player.ammo = weapon.ammoMax ?? 0;
    sim.state.player.shotCooldown = 0;
    sim.state.player.reloadTimer = 0;
    sim.state.player.spreadHeat = 0.01;
    sim.state.player.input = { ...EMPTY_INPUT, aimX: 10, aimY: 0, fire: true };

    const events: SimEvent[] = [];
    updateWeapons(sim.state, events, sim.fixedDeltaSeconds);

    const expected = 0.01 + (weapon.spreadHeatInc ?? 0) * 1.3;
    expect(sim.state.player.spreadHeat).toBeCloseTo(expected, 6);

    sim.state.player.shotCooldown = 0;
    sim.state.player.reloadTimer = 0;
    sim.state.player.spreadHeat = 0.47;
    updateWeapons(sim.state, [], sim.fixedDeltaSeconds);
    expect(sim.state.player.spreadHeat).toBe(0.48);
  });
});
