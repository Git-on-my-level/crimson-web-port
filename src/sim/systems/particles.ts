import type { SimState } from '../state';
import type { SimEvent, Vec2 } from '../types';
import { WORLD_BOUNDS } from '../world';

const OUT_OF_BOUNDS_MARGIN = 6;
const FAST_PARTICLE_SPEED = 12;
const SLOW_PARTICLE_SPEED = 6;
const FAST_PARTICLE_LIFE_TICKS = 30;
const SLOW_PARTICLE_LIFE_TICKS = 60;
const DEFAULT_PARTICLE_RADIUS = 1.2;

export function spawnParticleFast(
  state: SimState,
  events: SimEvent[],
  pos: Vec2,
  angle: number,
  styleId: number,
  owner: 'player' | 'creature' = 'player',
  options: {
    damagePerTick?: number;
    lifeTicks?: number;
    radius?: number;
  } = {},
): number | null {
  return spawnParticle(state, events, pos, angle, FAST_PARTICLE_SPEED, styleId, owner, {
    damagePerTick: options.damagePerTick,
    lifeTicks: options.lifeTicks ?? FAST_PARTICLE_LIFE_TICKS,
    radius: options.radius,
  });
}

export function spawnParticleSlow(
  state: SimState,
  events: SimEvent[],
  pos: Vec2,
  angle: number,
  styleId: number,
  owner: 'player' | 'creature' = 'player',
  options: {
    damagePerTick?: number;
    lifeTicks?: number;
    radius?: number;
  } = {},
): number | null {
  return spawnParticle(state, events, pos, angle, SLOW_PARTICLE_SPEED, styleId, owner, {
    damagePerTick: options.damagePerTick,
    lifeTicks: options.lifeTicks ?? SLOW_PARTICLE_LIFE_TICKS,
    radius: options.radius,
  });
}

function spawnParticle(
  state: SimState,
  events: SimEvent[],
  pos: Vec2,
  angle: number,
  speed: number,
  styleId: number,
  owner: 'player' | 'creature',
  options: {
    damagePerTick?: number;
    lifeTicks?: number;
    radius?: number;
  },
): number | null {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const velX = dirX * speed;
  const velY = dirY * speed;
  const lifeTicks = options.lifeTicks ?? FAST_PARTICLE_LIFE_TICKS;

  const id = state.particlePool.alloc((particle) => {
    particle.pos.x = pos.x;
    particle.pos.y = pos.y;
    particle.vel.x = velX;
    particle.vel.y = velY;
    particle.alive = true;
    particle.owner = owner;
    particle.styleId = styleId;
    particle.damagePerTick = options.damagePerTick ?? 0;
    particle.lifeTicksRemaining = lifeTicks;
    particle.radius = options.radius ?? DEFAULT_PARTICLE_RADIUS;
  }, state.nextEntityId++);

  if (id !== null) {
    events.push({ type: 'spawnProjectile', id, pos, vel: { x: velX, y: velY }, kind: `particle_${styleId}` });
  }

  return id;
}

export function despawnParticle(state: SimState, id: number): void {
  state.particlePool.release(id);
}

export function updateParticles(state: SimState, events: SimEvent[], dt: number): void {
  void events;
  const tickDelta = dt * 60;

  const minX = WORLD_BOUNDS.minX - OUT_OF_BOUNDS_MARGIN;
  const maxX = WORLD_BOUNDS.maxX + OUT_OF_BOUNDS_MARGIN;
  const minY = WORLD_BOUNDS.minY - OUT_OF_BOUNDS_MARGIN;
  const maxY = WORLD_BOUNDS.maxY + OUT_OF_BOUNDS_MARGIN;

  const toRelease: number[] = [];

  state.particlePool.forEachActive((id, particle) => {
    particle.pos.x += particle.vel.x * dt;
    particle.pos.y += particle.vel.y * dt;
    particle.lifeTicksRemaining -= tickDelta;

    if (
      particle.lifeTicksRemaining <= 0 ||
      particle.pos.x < minX ||
      particle.pos.x > maxX ||
      particle.pos.y < minY ||
      particle.pos.y > maxY
    ) {
      toRelease.push(id);
    }
  });

  for (const id of toRelease) {
    state.particlePool.release(id);
  }

  syncParticlesArray(state);
}

function syncParticlesArray(state: SimState): void {
  state.particles = [];
  state.particlePool.forEachActive((id, particle) => {
    if (particle.alive) {
      state.particles.push({ ...particle, id });
    }
  });
}
