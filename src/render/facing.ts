export function rotationFromVelocity(vx: number, vy: number, fallbackRadians = 0): number {
  const speedSq = vx * vx + vy * vy;
  if (speedSq <= 0) {
    return fallbackRadians;
  }
  return Math.atan2(vy, vx);
}
