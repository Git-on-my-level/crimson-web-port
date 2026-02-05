import type { SimState } from '../state';
import type { SimEvent, Vec2 } from '../types';
import { WORLD_BOUNDS } from '../world';

const OUT_OF_BOUNDS_MARGIN = 6;
const DEFAULT_SECONDARY_RADIUS = 0.6;

export function spawnSecondaryProjectile(
  state: SimState,
  events: SimEvent[],
  pos: Vec2,
  angle: number,
  typeId: number,
  owner: 'player' | 'creature' = 'player',
  options: {
    speed?: number;
    damage?: number;
    lifeTicks?: number;
    radius?: number;
    explosionRadius?: number;
    explosionDamage?: number;
  } = {},
): number | null {
  const speed = options.speed ?? 20;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const velX = dirX * speed;
  const velY = dirY * speed;
  const lifeTicks = options.lifeTicks ?? 60;

  const id = state.secondaryProjectilePool.alloc((proj) => {
    proj.pos.x = pos.x;
    proj.pos.y = pos.y;
    proj.vel.x = velX;
    proj.vel.y = velY;
    proj.alive = true;
    proj.owner = owner;
    proj.typeId = typeId;
    proj.damage = options.damage ?? 0;
    proj.lifeTicksRemaining = lifeTicks;
    proj.radius = options.radius ?? DEFAULT_SECONDARY_RADIUS;
    proj.explosionRadius = options.explosionRadius ?? 0;
    proj.explosionDamage = options.explosionDamage ?? 0;
  }, state.nextEntityId++);

  if (id !== null) {
    events.push({ type: 'spawnProjectile', id, pos, vel: { x: velX, y: velY }, kind: `secondary_${typeId}` });
  }

  return id;
}

export function despawnSecondaryProjectile(state: SimState, id: number): void {
  state.secondaryProjectilePool.release(id);
}

export function updateSecondaryProjectiles(state: SimState, events: SimEvent[], dt: number): void {
  void events;
  const tickDelta = dt * 60;

  const minX = WORLD_BOUNDS.minX - OUT_OF_BOUNDS_MARGIN;
  const maxX = WORLD_BOUNDS.maxX + OUT_OF_BOUNDS_MARGIN;
  const minY = WORLD_BOUNDS.minY - OUT_OF_BOUNDS_MARGIN;
  const maxY = WORLD_BOUNDS.maxY + OUT_OF_BOUNDS_MARGIN;

  const toRelease: number[] = [];

  state.secondaryProjectilePool.forEachActive((id, proj) => {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.lifeTicksRemaining -= tickDelta;

    if (
      proj.lifeTicksRemaining <= 0 ||
      proj.pos.x < minX ||
      proj.pos.x > maxX ||
      proj.pos.y < minY ||
      proj.pos.y > maxY
    ) {
      toRelease.push(id);
    }
  });

  for (const id of toRelease) {
    state.secondaryProjectilePool.release(id);
  }

  syncSecondaryProjectilesArray(state);
}

function syncSecondaryProjectilesArray(state: SimState): void {
  state.secondaryProjectiles = [];
  state.secondaryProjectilePool.forEachActive((id, proj) => {
    if (proj.alive) {
      state.secondaryProjectiles.push({ ...proj, id });
    }
  });
}
