import { describe, expect, it } from 'vitest';
import { xpToNextForLevel, xpThresholdForLevel } from '../src/sim/xp';

describe('XP curve', () => {
  it('matches expected thresholds for early levels', () => {
    expect(xpThresholdForLevel(1)).toBe(2000);
    expect(xpThresholdForLevel(2)).toBe(4482);
    expect(xpThresholdForLevel(3)).toBe(8224);
    expect(xpThresholdForLevel(4)).toBe(13125);
    expect(xpThresholdForLevel(5)).toBe(19119);
  });

  it('matches expected per-level XP deltas for early levels', () => {
    expect(xpToNextForLevel(1)).toBe(2000);
    expect(xpToNextForLevel(2)).toBe(2482);
    expect(xpToNextForLevel(3)).toBe(3742);
    expect(xpToNextForLevel(4)).toBe(4901);
    expect(xpToNextForLevel(5)).toBe(5994);
  });
});
