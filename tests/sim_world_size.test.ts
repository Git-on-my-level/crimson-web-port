import { describe, it, expect } from 'vitest';
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_BOUNDS } from '../src/sim/world';

describe('world size', () => {
  it('should have width of 1024', () => {
    expect(WORLD_WIDTH).toBe(1024);
  });

  it('should have height of 1024', () => {
    expect(WORLD_HEIGHT).toBe(1024);
  });

  it('should have bounds centered at origin with correct half-size', () => {
    expect(WORLD_BOUNDS.minX).toBe(-512);
    expect(WORLD_BOUNDS.maxX).toBe(512);
    expect(WORLD_BOUNDS.minY).toBe(-512);
    expect(WORLD_BOUNDS.maxY).toBe(512);
  });
});
