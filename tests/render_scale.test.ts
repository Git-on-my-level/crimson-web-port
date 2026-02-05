import { describe, expect, it } from 'vitest';
import { computeDisplaySize } from '../src/render/scale';

describe('computeDisplaySize', () => {
  it('grows with radius, pixelsPerUnit, and scale', () => {
    const base = computeDisplaySize(1, 10, 1, 0);
    const biggerRadius = computeDisplaySize(2, 10, 1, 0);
    const biggerPpu = computeDisplaySize(1, 20, 1, 0);
    const biggerScale = computeDisplaySize(1, 10, 1.5, 0);

    expect(biggerRadius).toBeGreaterThan(base);
    expect(biggerPpu).toBeGreaterThan(base);
    expect(biggerScale).toBeGreaterThan(base);
  });

  it('enforces minimum pixel size', () => {
    const size = computeDisplaySize(0.2, 10, 1, 24);
    expect(size).toBe(24);
  });
});
