import type { SimState } from './state';
import { WORLD_BOUNDS } from './world';

const HP_CAP_MULTIPLIER = 2;

export function assertSimInvariants(state: SimState): void {
  assertFiniteVec(state.player.pos, 'player.pos');
  assertFiniteVec(state.player.vel, 'player.vel');
  assertFinite(state.player.aimAngle, 'player.aimAngle');
  assertInRange(state.player.hp, 0, state.player.hpMax * HP_CAP_MULTIPLIER, 'player.hp');
  assertInRange(state.player.hpMax, 1, 10000, 'player.hpMax');
  assertInWorld(state.player.pos, state.player.radius, 'player.pos');

  const ids = new Set<number>();
  ids.add(state.player.id);

  for (const creature of state.creatures) {
    assertUnique(ids, creature.id, `creature(${creature.id}).id`);
    assertFiniteVec(creature.pos, `creature(${creature.id}).pos`);
    assertFiniteVec(creature.vel, `creature(${creature.id}).vel`);
    assertInRange(creature.hp, 0, creature.hpMax * HP_CAP_MULTIPLIER, `creature(${creature.id}).hp`);
    assertInRange(creature.hpMax, 1, 10000, `creature(${creature.id}).hpMax`);
    assertInWorld(creature.pos, creature.radius, `creature(${creature.id}).pos`);
  }

  for (const bonus of state.bonuses) {
    assertUnique(ids, bonus.id, `bonus(${bonus.id}).id`);
    assertFiniteVec(bonus.pos, `bonus(${bonus.id}).pos`);
  }

  state.projectilePool.forEachActive((id, proj) => {
    assertUnique(ids, id, `projectile(${id}).id`);
    assertFiniteVec(proj.pos, `projectile(${id}).pos`);
    assertFiniteVec(proj.vel, `projectile(${id}).vel`);
    assertInRange(proj.lifeTicksRemaining, -1, 10000, `projectile(${id}).lifeTicksRemaining`);
  });

  state.secondaryProjectilePool.forEachActive((id, proj) => {
    assertUnique(ids, id, `secondaryProjectile(${id}).id`);
    assertFiniteVec(proj.pos, `secondaryProjectile(${id}).pos`);
    assertFiniteVec(proj.vel, `secondaryProjectile(${id}).vel`);
    assertInRange(proj.lifeTicksRemaining, 0, 10000, `secondaryProjectile(${id}).lifeTicksRemaining`);
  });

  state.particlePool.forEachActive((id, particle) => {
    assertUnique(ids, id, `particle(${id}).id`);
    assertFiniteVec(particle.pos, `particle(${id}).pos`);
    assertFiniteVec(particle.vel, `particle(${id}).vel`);
    assertInRange(particle.lifeTicksRemaining, 0, 10000, `particle(${id}).lifeTicksRemaining`);
  });
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invariant failed: ${label} not finite`);
  }
}

function assertFiniteVec(vec: { x: number; y: number }, label: string): void {
  assertFinite(vec.x, `${label}.x`);
  assertFinite(vec.y, `${label}.y`);
}

function assertInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invariant failed: ${label} out of range (${value})`);
  }
}

function assertUnique(set: Set<number>, id: number, label: string): void {
  if (set.has(id)) {
    throw new Error(`Invariant failed: duplicate id for ${label}`);
  }
  set.add(id);
}

function assertInWorld(pos: { x: number; y: number }, radius: number, label: string): void {
  const minX = WORLD_BOUNDS.minX - radius - 0.5;
  const maxX = WORLD_BOUNDS.maxX + radius + 0.5;
  const minY = WORLD_BOUNDS.minY - radius - 0.5;
  const maxY = WORLD_BOUNDS.maxY + radius + 0.5;
  if (pos.x < minX || pos.x > maxX || pos.y < minY || pos.y > maxY) {
    throw new Error(`Invariant failed: ${label} outside world bounds`);
  }
}
