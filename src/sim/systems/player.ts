import type { SimState } from '../state';
import { vec2AddInplace, vec2Length, vec2Scale } from '../types';

const PLAYER_ACCEL = 18;
const PLAYER_MAX_SPEED = 6;
const PLAYER_DAMPING = 10;
const WORLD_BOUNDS = {
  minX: -50,
  maxX: 50,
  minY: -50,
  maxY: 50,
};

export function updatePlayer(state: SimState, dt: number): void {
  const input = state.player.input;
  const move = { x: input.moveX, y: input.moveY };
  const length = vec2Length(move);
  const normalized = length > 1 ? vec2Scale(move, 1 / length) : move;

  if (length > 0.0001) {
    state.player.vel.x += normalized.x * PLAYER_ACCEL * dt;
    state.player.vel.y += normalized.y * PLAYER_ACCEL * dt;
  } else {
    const damping = Math.max(0, 1 - PLAYER_DAMPING * dt);
    state.player.vel.x *= damping;
    state.player.vel.y *= damping;
  }

  const speed = vec2Length(state.player.vel);
  if (speed > PLAYER_MAX_SPEED) {
    const clamped = PLAYER_MAX_SPEED / speed;
    state.player.vel.x *= clamped;
    state.player.vel.y *= clamped;
  }

  vec2AddInplace(state.player.pos, vec2Scale(state.player.vel, dt));

  const minX = WORLD_BOUNDS.minX + state.player.radius;
  const maxX = WORLD_BOUNDS.maxX - state.player.radius;
  const minY = WORLD_BOUNDS.minY + state.player.radius;
  const maxY = WORLD_BOUNDS.maxY - state.player.radius;

  if (state.player.pos.x < minX) {
    state.player.pos.x = minX;
    if (state.player.vel.x < 0) state.player.vel.x = 0;
  } else if (state.player.pos.x > maxX) {
    state.player.pos.x = maxX;
    if (state.player.vel.x > 0) state.player.vel.x = 0;
  }

  if (state.player.pos.y < minY) {
    state.player.pos.y = minY;
    if (state.player.vel.y < 0) state.player.vel.y = 0;
  } else if (state.player.pos.y > maxY) {
    state.player.pos.y = maxY;
    if (state.player.vel.y > 0) state.player.vel.y = 0;
  }

  const aimDx = input.aimX - state.player.pos.x;
  const aimDy = input.aimY - state.player.pos.y;
  const aimLength = Math.hypot(aimDx, aimDy);
  if (aimLength > 0.0001) {
    state.player.aimDir = { x: aimDx / aimLength, y: aimDy / aimLength };
    state.player.aimAngle = Math.atan2(aimDy, aimDx);
  }
}
