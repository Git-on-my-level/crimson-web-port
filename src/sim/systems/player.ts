import type { SimState } from '../state';
import { vec2AddInplace, vec2Length, vec2Scale } from '../types';
import { clampOrSlide } from '../terrain';
import { clampToWorld } from '../world';
import { getPlayerSpeedModifier, getPlayerRegenRate } from './modifiers';

const PLAYER_ACCEL = 18;
const PLAYER_DAMPING = 10;
function getPlayerMaxSpeed(player: SimState['player'], state: SimState): number {
  const speedBoostTicks = player.activeEffects['speed'] ?? 0;
  const bonusMultiplier = speedBoostTicks > 0 ? 1.5 : 1.0;
  const modifierMultiplier = getPlayerSpeedModifier(player, state);
  return player.baseSpeed * player.perkStats.moveSpeedMultiplier * bonusMultiplier * modifierMultiplier;
}

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
  const maxSpeed = getPlayerMaxSpeed(state.player, state);
  if (speed > maxSpeed) {
    const clamped = maxSpeed / speed;
    state.player.vel.x *= clamped;
    state.player.vel.y *= clamped;
  }

  const prevX = state.player.pos.x;
  const prevY = state.player.pos.y;

  vec2AddInplace(state.player.pos, vec2Scale(state.player.vel, dt));
  const desiredX = state.player.pos.x;
  const desiredY = state.player.pos.y;

  clampToWorld(state.player.pos, state.player.radius);
  clampOrSlide(state.terrain, state.player.pos, state.player.radius, { x: prevX, y: prevY });

  if (state.player.pos.x !== desiredX) {
    state.player.vel.x = 0;
  }
  if (state.player.pos.y !== desiredY) {
    state.player.vel.y = 0;
  }

  const weaponPowerUpActive = (state.player.activeEffects['weapon_power_up'] ?? 0) > 0;
  const cooldownScale = weaponPowerUpActive ? 1.5 : 1.0;
  state.player.shotCooldown = Math.max(0, state.player.shotCooldown - dt * cooldownScale);

  const hasSharpshooter = (state.player.perks['sharpshooter'] ?? 0) > 0;
  if (hasSharpshooter) {
    state.player.spreadHeat = 0.02;
  } else {
    state.player.spreadHeat = Math.max(0.01, state.player.spreadHeat - dt * 0.4);
  }

  const aimDx = input.aimX - state.player.pos.x;
  const aimDy = input.aimY - state.player.pos.y;
  const aimLength = Math.hypot(aimDx, aimDy);
  if (aimLength > 0.0001) {
    state.player.aimDir = { x: aimDx / aimLength, y: aimDy / aimLength };
    state.player.aimAngle = Math.atan2(aimDy, aimDx);
  }

  const regenRate = getPlayerRegenRate(state.player, state);
  if (regenRate > 0 && state.player.hp < state.player.hpMax) {
    state.player.hp = Math.min(state.player.hpMax, state.player.hp + regenRate);
  }
}
