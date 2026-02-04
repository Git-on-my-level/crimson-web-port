const XP_BASE = 1000;
const XP_SCALE = 1000;
const XP_EXPONENT = 1.8;

export function xpThresholdForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(XP_BASE + Math.pow(safeLevel, XP_EXPONENT) * XP_SCALE);
}

export function xpToNextForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel <= 1) {
    return Math.max(1, xpThresholdForLevel(1));
  }
  const prev = xpThresholdForLevel(safeLevel - 1);
  const next = xpThresholdForLevel(safeLevel);
  return Math.max(1, next - prev);
}
