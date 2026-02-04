import type { SimState } from '../state';
import { vec2AddInplace, vec2Length, vec2Scale } from '../types';

export function updatePlayer(state: SimState): void {
  const input = state.player.input;
  const move = { x: input.moveX, y: input.moveY };
  const length = vec2Length(move);
  const normalized = length > 1 ? vec2Scale(move, 1 / length) : move;

  state.player.vel = vec2Scale(normalized, state.player.speed);
  vec2AddInplace(state.player.pos, state.player.vel);
}
