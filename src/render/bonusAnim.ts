const BONUS_TICKS_PER_SECOND = 60;
const BONUS_FADE_SECONDS = 0.5;
export const BONUS_FADE_TICKS = Math.round(BONUS_TICKS_PER_SECOND * BONUS_FADE_SECONDS);
export const BONUS_PULSE_AMPLITUDE = 0.06;
const BONUS_PULSE_FREQUENCY_HZ = 1.25;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const computeFadeAlpha = (lifeRemainingTicks: number, lifeMaxTicks: number): number => {
  if (!Number.isFinite(lifeRemainingTicks) || !Number.isFinite(lifeMaxTicks) || lifeMaxTicks <= 0) {
    return 1;
  }
  const safeRemaining = Math.max(0, lifeRemainingTicks);
  const safeMax = Math.max(1, lifeMaxTicks);
  const fadeTicks = Math.min(BONUS_FADE_TICKS, Math.floor(safeMax / 2));
  if (fadeTicks <= 0) {
    return 1;
  }
  const elapsed = safeMax - safeRemaining;
  const fadeIn = clamp01(elapsed / fadeTicks);
  const fadeOut = clamp01(safeRemaining / fadeTicks);
  return Math.min(fadeIn, fadeOut);
};

export const computePulseScale = (tSeconds: number): number => {
  if (!Number.isFinite(tSeconds)) {
    return 1;
  }
  return 1 + Math.sin(tSeconds * Math.PI * 2 * BONUS_PULSE_FREQUENCY_HZ) * BONUS_PULSE_AMPLITUDE;
};
