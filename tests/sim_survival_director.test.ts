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

function countAlive(sim: Sim): number {
  let alive = 0;
  for (const creature of sim.state.creatures) {
    if (creature.alive) {
      alive += 1;
    }
  }
  return alive;
}

describe('Survival director', () => {
  it('caps spawns and stays deterministic over long runs', () => {
    const simA = new Sim({ seed: 9001 });
    const simB = new Sim({ seed: 9001 });
    boostPlayerHp(simA);
    boostPlayerHp(simB);

    const totalTicks = 10_000;
    let spawnCountA = 0;
    let spawnCountB = 0;

    for (let tick = 0; tick < totalTicks; tick += 1) {
      const resultA = simA.step(IDLE_INPUT);
      const resultB = simB.step(IDLE_INPUT);

      const spawnsA = resultA.events.filter((event) => event.type === 'spawnCreature').length;
      const spawnsB = resultB.events.filter((event) => event.type === 'spawnCreature').length;
      spawnCountA += spawnsA;
      spawnCountB += spawnsB;

      const aliveA = countAlive(simA);
      const aliveB = countAlive(simB);
      expect(aliveA).toBe(aliveB);
    }

    expect(spawnCountA).toBeGreaterThan(0);
    expect(spawnCountA).toBe(spawnCountB);
  });
});
