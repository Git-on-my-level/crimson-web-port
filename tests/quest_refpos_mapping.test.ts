import { describe, it, expect } from 'vitest';
import { refPos } from '../src/content/quests/catalog';

describe('quest refPos mapping', () => {
  it('should map (512, 512) to origin (0, 0)', () => {
    const result = refPos(512, 512);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should map (0, 0) to (-512, -512)', () => {
    const result = refPos(0, 0);
    expect(result.x).toBe(-512);
    expect(result.y).toBe(-512);
  });

  it('should map (1024, 1024) to (512, 512)', () => {
    const result = refPos(1024, 1024);
    expect(result.x).toBe(512);
    expect(result.y).toBe(512);
  });
});
