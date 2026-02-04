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
    let maxAlive = 0;
    let spawnCountA = 0;
    let spawnCountB = 0;

    for (let tick = 0; tick < totalTicks; tick += 1) {
      const resultA = simA.step(IDLE_INPUT);
      const resultB = simB.step(IDLE_INPUT);

      spawnCountA += resultA.events.filter((event) => event.type === 'spawnCreature').length;
      spawnCountB += resultB.events.filter((event) => event.type === 'spawnCreature').length;

      const aliveA = countAlive(simA);
      const aliveB = countAlive(simB);
      const capA =
        simA.state.modeState.kind === 'survival' ? simA.state.modeState.maxCreaturesSoftCap : 0;

      expect(aliveA).toBeLessThanOrEqual(capA);
      expect(aliveA).toBe(aliveB);

      if (aliveA > maxAlive) {
        maxAlive = aliveA;
      }
    }

    expect(spawnCountA).toBeGreaterThan(0);
    expect(spawnCountA).toBe(spawnCountB);

    if (simA.state.modeState.kind === 'survival') {
      expect(simA.state.modeState.difficultyLevel).toBeGreaterThanOrEqual(4);
      expect(maxAlive).toBeLessThanOrEqual(simA.state.modeState.maxCreaturesSoftCap);
    }
  });
});
