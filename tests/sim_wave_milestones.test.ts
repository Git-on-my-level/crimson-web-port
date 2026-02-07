import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
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

function boostPlayerHp(sim: Sim): void {
  sim.state.player.hp = 1_000_000;
  sim.state.player.hpMax = 1_000_000;
  sim.state.player.baseHpMax = 1_000_000;
  sim.state.player.xpToNext = Number.MAX_SAFE_INTEGER;
  sim.state.player.xp = 0;
}

describe('Wave milestones', () => {
  it('triggers elite waves at deterministic intervals', () => {
    const simA = new Sim({ seed: 12345 });
    const simB = new Sim({ seed: 12345 });
    boostPlayerHp(simA);
    boostPlayerHp(simB);

    const waveEventsA: any[] = [];
    const waveEventsB: any[] = [];

    const totalTicks = 60 * 65;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const resultA = simA.step(IDLE_INPUT);
      const resultB = simB.step(IDLE_INPUT);

      for (const event of resultA.events) {
        if (event.type === 'waveMilestone') {
          waveEventsA.push(event);
        }
      }
      for (const event of resultB.events) {
        if (event.type === 'waveMilestone') {
          waveEventsB.push(event);
        }
      }
    }

    expect(waveEventsA.length).toBeGreaterThan(0);
    expect(waveEventsA).toEqual(waveEventsB);
  });

  it('produces deterministic spawn sequences with wave milestones', () => {
    const simA = new Sim({ seed: 99999 });
    const simB = new Sim({ seed: 99999 });
    boostPlayerHp(simA);
    boostPlayerHp(simB);

    const spawnOrderA: string[] = [];
    const spawnOrderB: string[] = [];

    const totalTicks = 60 * 65;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const resultA = simA.step(IDLE_INPUT);
      const resultB = simB.step(IDLE_INPUT);

      for (const event of resultA.events) {
        if (event.type === 'spawnCreature') {
          spawnOrderA.push(event.kind);
        }
      }
      for (const event of resultB.events) {
        if (event.type === 'spawnCreature') {
          spawnOrderB.push(event.kind);
        }
      }
    }

    expect(spawnOrderA.length).toBeGreaterThan(0);
    expect(spawnOrderA).toEqual(spawnOrderB);
  });
});
