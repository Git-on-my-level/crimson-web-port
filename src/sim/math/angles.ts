export function wrapAngle(theta: number): number {
  const tau = Math.PI * 2;
  return ((theta + Math.PI) % tau + tau) % tau - Math.PI;
}

export function angleApproach(current: number, target: number, rate: number, dt: number): number {
  const delta = wrapAngle(target - current);
  const stepScale = Math.min(1.0, Math.abs(delta));
  const step = dt * stepScale * rate;
  if (delta >= 0.0) {
    current += step;
  } else {
    current -= step;
  }
  return wrapAngle(current);
}
