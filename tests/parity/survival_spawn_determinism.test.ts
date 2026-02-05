import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import type { InputFrame } from '../../src/sim/types';

const IDLE_INPUT: InputFrame = {
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

function boostPlayer(sim: Sim): void {
  sim.state.player.hp = 1_000_000;
  sim.state.player.hpMax = 1_000_000;
  sim.state.player.baseHpMax = 1_000_000;
  sim.state.player.xpToNext = Number.MAX_SAFE_INTEGER;
  sim.state.player.xp = 0;
}

describe('Parity: survival spawn determinism', () => {
  it('spawns stable counts/types for a fixed seed', () => {
    const simA = new Sim({ seed: 4242 });
    const simB = new Sim({ seed: 4242 });
    boostPlayer(simA);
    boostPlayer(simB);

    const spawnCountsA: Record<string, number> = {};
    const spawnOrderA: string[] = [];
    const spawnCountsB: Record<string, number> = {};
    const spawnOrderB: string[] = [];

    const totalTicks = 3600;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const resultA = simA.step(IDLE_INPUT);
      const resultB = simB.step(IDLE_INPUT);
      for (const event of resultA.events) {
        if (event.type === 'spawnCreature') {
          spawnCountsA[event.kind] = (spawnCountsA[event.kind] ?? 0) + 1;
          spawnOrderA.push(event.kind);
        }
      }
      for (const event of resultB.events) {
        if (event.type === 'spawnCreature') {
          spawnCountsB[event.kind] = (spawnCountsB[event.kind] ?? 0) + 1;
          spawnOrderB.push(event.kind);
        }
      }
    }

    expect(spawnCountsA).toEqual(spawnCountsB);
    expect(spawnOrderA).toEqual(spawnOrderB);
    expect(Object.keys(spawnCountsA).length).toBeGreaterThan(2);
    expect(spawnOrderA.slice(0, 8)).toEqual(spawnOrderB.slice(0, 8));
  });
});
