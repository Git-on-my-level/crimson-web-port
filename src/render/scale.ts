export function computeDisplaySize(radius: number, pixelsPerUnit: number, scale: number, minPx: number): number {
  const baseSize = radius * 2 * pixelsPerUnit * scale;
  return Math.max(baseSize, minPx);
}
