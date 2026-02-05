import { describe, expect, it } from 'vitest';
import { BONUS_FADE_TICKS, BONUS_PULSE_AMPLITUDE, computeFadeAlpha, computePulseScale } from '../src/render/bonusAnim';

describe('bonus render animation helpers', () => {
  it('computeFadeAlpha stays within [0, 1]', () => {
    const lifeMax = 900;
    for (let remaining = 0; remaining <= lifeMax; remaining += 15) {
      const alpha = computeFadeAlpha(remaining, lifeMax);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThanOrEqual(1);
    }
  });

  it('computeFadeAlpha hits 0 at spawn and despawn edges', () => {
    const lifeMax = 900;
    expect(computeFadeAlpha(lifeMax, lifeMax)).toBeCloseTo(0, 6);
    expect(computeFadeAlpha(0, lifeMax)).toBeCloseTo(0, 6);
    const mid = computeFadeAlpha(lifeMax - BONUS_FADE_TICKS, lifeMax);
    expect(mid).toBeGreaterThan(0.9);
  });

  it('computePulseScale stays within expected bounds', () => {
    const min = 1 - BONUS_PULSE_AMPLITUDE - 1e-6;
    const max = 1 + BONUS_PULSE_AMPLITUDE + 1e-6;
    for (let t = 0; t <= 10; t += 0.05) {
      const scale = computePulseScale(t);
      expect(scale).toBeGreaterThanOrEqual(min);
      expect(scale).toBeLessThanOrEqual(max);
    }
  });
});
