import type { Vec2 } from '../types';
import { WORLD_WIDTH } from '../world';

export const REF_WORLD_SIZE = 1024;
const REF_HALF = REF_WORLD_SIZE / 2;
const WORLD_HALF = WORLD_WIDTH / 2;
const REF_TO_WORLD = WORLD_HALF / REF_HALF;

export function refCoord(value: number): number {
  return (value - REF_HALF) * REF_TO_WORLD;
}

export function refPos(x: number, y: number): Vec2 {
  return { x: refCoord(x), y: refCoord(y) };
}

export function refRadius(value: number): number {
  return value * REF_TO_WORLD;
}
