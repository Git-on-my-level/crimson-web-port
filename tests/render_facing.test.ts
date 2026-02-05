import { describe, expect, it } from 'vitest';
import { rotationFromVelocity } from '../src/render/facing';

describe('rotationFromVelocity', () => {
  it('returns 0 for (1, 0)', () => {
    expect(rotationFromVelocity(1, 0)).toBe(0);
  });

  it('returns +PI/2 for (0, 1)', () => {
    expect(rotationFromVelocity(0, 1)).toBeCloseTo(Math.PI / 2);
  });

  it('returns PI for (-1, 0)', () => {
    expect(rotationFromVelocity(-1, 0)).toBeCloseTo(Math.PI);
  });

  it('returns fallback when velocity is zero', () => {
    expect(rotationFromVelocity(0, 0, 1.23)).toBeCloseTo(1.23);
  });
});
