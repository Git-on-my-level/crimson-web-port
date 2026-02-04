import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import type { InputFrame } from '../../src/sim/types';
import { WEAPON_BY_ID } from '../../src/content/weapons';
import { createQuestModeState } from '../../src/sim/state';

const FIRE_INPUT: InputFrame = {
  moveX: 0,
  moveY: 0,
  aimX: 1,
  aimY: 0,
  fire: true,
  reload: false,
  weaponSwitch: null,
  pause: false,
  perkChoice: null,
};

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

function setupSimWithWeapon(weaponId: keyof typeof WEAPON_BY_ID): Sim {
  const sim = new Sim({ seed: 101 });
  sim.state.mode = 'quest';
  sim.state.modeState = createQuestModeState();
  sim.state.player.weaponId = weaponId;
  sim.state.player.fireCooldownTicks = 0;
  sim.state.player.reloadTicksRemaining = 0;
  return sim;
}

describe('Parity: weapon fire rate + reload', () => {
  it('fires on a stable cooldown for the SMG', () => {
    const sim = setupSimWithWeapon('smg');
    const weapon = WEAPON_BY_ID.smg;
    sim.state.player.ammo = 999;

    const cooldownTicks = Math.max(
      1,
      Math.round((1 / weapon.fireRate) / sim.fixedDeltaSeconds),
    );

    const shotTicks: number[] = [];
    const totalTicks = cooldownTicks * 6;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const result = sim.step(FIRE_INPUT);
      if (result.events.some((event) => event.type === 'spawnProjectile')) {
        shotTicks.push(tick);
      }
    }

    expect(shotTicks.length).toBeGreaterThan(2);
    for (let i = 1; i < shotTicks.length; i += 1) {
      expect(shotTicks[i] - shotTicks[i - 1]).toBe(cooldownTicks);
    }
  });

  it('consumes ammo and reloads when empty', () => {
    const sim = setupSimWithWeapon('smg');
    const weapon = WEAPON_BY_ID.smg;
    const ammoStart = 3;
    sim.state.player.ammo = ammoStart;

    let shots = 0;
    let reloadStarted = false;

    for (let tick = 0; tick < 500; tick += 1) {
      const result = sim.step(FIRE_INPUT);
      shots += result.events.filter((event) => event.type === 'spawnProjectile').length;

      if (!reloadStarted && sim.state.player.reloadTicksRemaining > 0) {
        reloadStarted = true;
        break;
      }
    }

    expect(reloadStarted).toBe(true);
    expect(shots).toBe(ammoStart);
    expect(sim.state.player.ammo).toBe(0);

    const reloadTicks = weapon.reloadTicks ?? 0;
    for (let i = 0; i < reloadTicks; i += 1) {
      sim.step(IDLE_INPUT);
    }

    expect(sim.state.player.reloadTicksRemaining).toBe(0);
    expect(sim.state.player.ammo).toBe(weapon.ammoMax);
  });
});
