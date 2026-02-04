import type { SimState } from '../state';
import type { SimEvent } from '../types';

const WORLD_BOUNDS = {
  minX: -50,
  maxX: 50,
  minY: -50,
  maxY: 50,
};

const OUT_OF_BOUNDS_MARGIN = 6;

export function updateProjectiles(state: SimState, events: SimEvent[], dt: number): void {
  void events;

  const minX = WORLD_BOUNDS.minX - OUT_OF_BOUNDS_MARGIN;
  const maxX = WORLD_BOUNDS.maxX + OUT_OF_BOUNDS_MARGIN;
  const minY = WORLD_BOUNDS.minY - OUT_OF_BOUNDS_MARGIN;
  const maxY = WORLD_BOUNDS.maxY + OUT_OF_BOUNDS_MARGIN;

  let writeIndex = 0;
  for (let i = 0; i < state.projectiles.length; i += 1) {
    const projectile = state.projectiles[i];
    if (!projectile.alive) {
      continue;
    }

    projectile.pos.x += projectile.vel.x * dt;
    projectile.pos.y += projectile.vel.y * dt;
    projectile.lifeTicksRemaining -= 1;

    if (
      projectile.lifeTicksRemaining <= 0 ||
      projectile.pos.x < minX ||
      projectile.pos.x > maxX ||
      projectile.pos.y < minY ||
      projectile.pos.y > maxY
    ) {
      projectile.alive = false;
    }

    if (projectile.alive) {
      state.projectiles[writeIndex] = projectile;
      writeIndex += 1;
    }
  }

  state.projectiles.length = writeIndex;
}
