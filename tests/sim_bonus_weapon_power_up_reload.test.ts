import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { WEAPON_BY_ID } from '../src/content/weapons';
import type { InputFrame } from '../src/sim/types';

const IDLE_INPUT: InputFrame = {
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

function ticksToReload(sim: Sim): number {
  let ticks = 0;
  while (sim.state.player.reloadTicksRemaining > 0 && ticks < 5000) {
    sim.step(IDLE_INPUT);
    ticks += 1;
  }
  return ticks;
}

describe('Weapon power up reload boost', () => {
  it('completes reload sooner while weapon power up is active', () => {
    const weapon = WEAPON_BY_ID.smg;
    const baseSim = new Sim({ seed: 201 });
    baseSim.state.player.weaponId = 'smg';
    baseSim.state.player.ammo = 0;
    baseSim.state.player.reloadTicksRemaining = weapon.reloadTicks ?? 0;

    const bonusSim = new Sim({ seed: 202 });
    bonusSim.state.player.weaponId = 'smg';
    bonusSim.state.player.ammo = 0;
    bonusSim.state.player.reloadTicksRemaining = weapon.reloadTicks ?? 0;
    bonusSim.state.player.activeEffects.weapon_power_up = 999;

    const baseTicks = ticksToReload(baseSim);
    const bonusTicks = ticksToReload(bonusSim);

    expect(bonusTicks).toBeLessThan(baseTicks);
    expect(baseSim.state.player.ammo).toBe(weapon.ammoMax);
    expect(bonusSim.state.player.ammo).toBe(weapon.ammoMax);
  });
});
