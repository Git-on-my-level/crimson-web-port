import type { SimState } from '../state';
import type { SimEvent, Vec2 } from '../types';
import { WORLD_BOUNDS } from '../world';
const OUT_OF_BOUNDS_MARGIN = 6;

export function spawnProjectile(
  state: SimState,
  events: SimEvent[],
  pos: Vec2,
  vel: Vec2,
  kind: string,
  damage: number,
  lifeTicks: number,
  owner: 'player' | 'creature' = 'player',
  radius: number = 0.4,
  options: {
    pierceRemaining?: number;
    explosionRadius?: number;
    explosionDamage?: number;
    speedScale?: number;
    ignoreLifetime?: boolean;
  } = {},
): number | null {
  const id = state.projectilePool.alloc((proj) => {
    proj.origin.x = pos.x;
    proj.origin.y = pos.y;
    proj.pos.x = pos.x;
    proj.pos.y = pos.y;
    proj.vel.x = vel.x;
    proj.vel.y = vel.y;
    proj.kind = kind;
    proj.damage = damage;
    proj.lifeTicksRemaining = options.ignoreLifetime ? -1 : lifeTicks;
    proj.owner = owner;
    proj.radius = radius;
    proj.alive = true;
    proj.pierceRemaining = options.pierceRemaining ?? 0;
    proj.explosionRadius = options.explosionRadius ?? 0;
    proj.explosionDamage = options.explosionDamage ?? 0;
    proj.speedScale = options.speedScale ?? 1;
  }, state.nextEntityId++);

  if (id !== null) {
    events.push({ type: 'spawnProjectile', id, pos, vel, kind });
  }

  return id;
}

export function despawnProjectile(state: SimState, id: number): void {
  state.projectilePool.release(id);
}

export function updateProjectiles(state: SimState, events: SimEvent[], dt: number): void {
  void events;
  const tickDelta = dt * 60;

  const minX = WORLD_BOUNDS.minX - OUT_OF_BOUNDS_MARGIN;
  const maxX = WORLD_BOUNDS.maxX + OUT_OF_BOUNDS_MARGIN;
  const minY = WORLD_BOUNDS.minY - OUT_OF_BOUNDS_MARGIN;
  const maxY = WORLD_BOUNDS.maxY + OUT_OF_BOUNDS_MARGIN;

  const toRelease: number[] = [];

  state.projectilePool.forEachActive((id, proj) => {
    proj.pos.x += proj.vel.x * dt * proj.speedScale;
    proj.pos.y += proj.vel.y * dt * proj.speedScale;
    const hasTimedLife = proj.lifeTicksRemaining > 0;
    if (hasTimedLife) {
      proj.lifeTicksRemaining -= tickDelta;
    }

    const outOfBounds =
      proj.pos.x < minX ||
      proj.pos.x > maxX ||
      proj.pos.y < minY ||
      proj.pos.y > maxY;
    if (
      (hasTimedLife && proj.lifeTicksRemaining <= 0) ||
      outOfBounds
    ) {
      toRelease.push(id);
    }
  });

  for (const id of toRelease) {
    state.projectilePool.release(id);
  }

  syncProjectilesArray(state);
}

function syncProjectilesArray(state: SimState): void {
  state.projectiles = [];
  state.projectilePool.forEachActive((id, proj) => {
    if (proj.alive) {
      state.projectiles.push({ ...proj, id });
    }
  });
}
