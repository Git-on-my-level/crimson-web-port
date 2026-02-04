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
    const sim = new Sim({ seed: 4242 });
    boostPlayer(sim);

    const spawnCounts: Record<string, number> = {};
    const spawnOrder: string[] = [];

    const totalTicks = 3600;
    for (let tick = 0; tick < totalTicks; tick += 1) {
      const result = sim.step(IDLE_INPUT);
      for (const event of result.events) {
        if (event.type === 'spawnCreature') {
          spawnCounts[event.kind] = (spawnCounts[event.kind] ?? 0) + 1;
          spawnOrder.push(event.kind);
        }
      }
    }

    expect(spawnCounts).toEqual({ grunt: 8, runner: 2 });
    expect(spawnOrder.slice(0, 10)).toEqual([
      'grunt',
      'grunt',
      'grunt',
      'grunt',
      'grunt',
      'grunt',
      'runner',
      'grunt',
      'runner',
      'grunt',
    ]);
  });
});
