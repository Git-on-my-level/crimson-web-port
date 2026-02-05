// @parity-tags: parity-system/bonuses, ref-test/bonus-pistol-rules
import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { trySpawnBonusOnKill } from '../../src/sim/systems/bonuses';

class SequenceRng {
  private uints: number[];
  private floats: number[];

  constructor(values: { uints?: number[]; floats?: number[] } = {}) {
    this.uints = [...(values.uints ?? [])];
    this.floats = [...(values.floats ?? [])];
  }

  seed(_seed: number): void {
    // No-op for deterministic sequences.
  }

  nextUint32(): number {
    return this.uints.length > 0 ? (this.uints.shift() ?? 0) : 0;
  }

  nextFloat01(): number {
    if (this.floats.length > 0) {
      return this.floats.shift() ?? 0;
    }
    return this.nextUint32() / 0x1_0000_0000;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      return 0;
    }
    return this.nextUint32() % maxExclusive;
  }
}

describe('ref parity: bonus pistol rules', () => {
  it('pistol safety net forces a weapon drop', () => {
    const sim = new Sim({ seed: 1, mode: 'survival' });
    sim.state.rng = new SequenceRng({ uints: [0], floats: [0.3, 0, 0] }) as any;

    trySpawnBonusOnKill(sim.state, [], { x: 0, y: 0 });

    expect(sim.state.bonuses.length).toBe(1);
    const bonus = sim.state.bonuses[0];
    if (!bonus) {
      throw new Error('Expected a bonus to spawn');
    }
    expect(bonus.kind).toBe('weapon');
    expect(bonus.weaponId).toBe('assault_rifle');
  });

  it('pistol extra gate allows spawn without bonus magnet', () => {
    const sim = new Sim({ seed: 1, mode: 'survival' });
    sim.state.rng = new SequenceRng({ uints: [3, 0, 1], floats: [0, 0, 0] }) as any;

    trySpawnBonusOnKill(sim.state, [], { x: 0, y: 0 });

    expect(sim.state.bonuses.length).toBe(1);
  });
});
