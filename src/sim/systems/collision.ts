import type { CreatureState, SimState } from '../state';
import type { SimEvent } from '../types';
import { despawnProjectile } from './projectiles';
import { despawnSecondaryProjectile } from './secondaryProjectiles';
import { despawnParticle } from './particles';
import { trySpawnBonusOnKill } from './bonuses';
import { getCreatureDef } from '../../content/creatures';
import { grantXp } from './progression';
import { registerQuestKill, setQuestStatus } from './mode_quest';
import { registerSurvivalKill } from './mode_survival';
import { WORLD_BOUNDS } from '../world';
import { isTerrainBlocked } from '../terrain';
import { refRadius } from '../modes/survival_ref';

const CELL_SIZE = 6;
const GRID_WIDTH = Math.ceil((WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / CELL_SIZE);
const GRID_HEIGHT = Math.ceil((WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY) / CELL_SIZE);
const collisionGrid = new Map<number, CreatureState[]>();
const cellPool: CreatureState[][] = [];
const WORLD_TO_REF = 1 / refRadius(1);
const PROJECTILE_DAMAGE_MIN_DIST_REF = 50;
const PROJECTILE_DAMAGE_SCALE = 30;
const PROJECTILE_DAMAGE_BASE = 10;
const PROJECTILE_DAMAGE_POST_SCALE = 0.95;

export function resolveCollisions(state: SimState, events: SimEvent[]): void {
  const player = state.player;
  const energizerTicks = player.activeEffects.energizer ?? 0;
  const isEnergized = energizerTicks > 0;

  for (const creature of state.creatures) {
    if (creature.touchCooldownTicks > 0) {
      creature.touchCooldownTicks = Math.max(0, creature.touchCooldownTicks - 1);
    }
  }

  rebuildCollisionGrid(state.creatures);

  const toRemove: number[] = [];
  const secondaryToRemove: number[] = [];
  const particlesToRemove: number[] = [];

  state.projectilePool.forEachActive((projId, projectile) => {
    if (!projectile.alive || projectile.owner !== 'player') {
      return;
    }

    if (isTerrainBlocked(state.terrain, projectile.pos.x, projectile.pos.y, projectile.radius)) {
      const impactPos = { x: projectile.pos.x, y: projectile.pos.y };
      const explosionRadius = projectile.explosionRadius;
      if (explosionRadius > 0) {
        const explosionDamage = projectile.explosionDamage || projectile.damage;
        applyExplosionDamage(state, impactPos, explosionRadius, explosionDamage, events);
        events.push({
          type: 'projectileImpact',
          id: projId,
          pos: impactPos,
          kind: projectile.kind,
          explosionRadius,
        });
      }
      projectile.alive = false;
      toRemove.push(projId);
      return;
    }

    const { cellX, cellY } = getCellCoords(projectile.pos.x, projectile.pos.y);
    for (let dy = -1; dy <= 1; dy += 1) {
      const ny = cellY + dy;
      if (ny < 0 || ny >= GRID_HEIGHT) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = cellX + dx;
        if (nx < 0 || nx >= GRID_WIDTH) continue;
        const cell = collisionGrid.get(getCellKey(nx, ny));
        if (!cell) continue;
        for (const creature of cell) {
          if (!creature.alive) {
            continue;
          }

          const dxp = projectile.pos.x - creature.pos.x;
          const dyp = projectile.pos.y - creature.pos.y;
          const radius = projectile.radius + creature.radius;
          if (dxp * dxp + dyp * dyp <= radius * radius) {
            const impactPos = { x: projectile.pos.x, y: projectile.pos.y };
            const explosionRadius = projectile.explosionRadius;
            if (explosionRadius > 0) {
              const explosionDamage = projectile.explosionDamage || projectile.damage;
              applyExplosionDamage(state, impactPos, explosionRadius, explosionDamage, events);
              events.push({
                type: 'projectileImpact',
                id: projId,
                pos: impactPos,
                kind: projectile.kind,
                explosionRadius,
              });
              projectile.alive = false;
              toRemove.push(projId);
              return;
            }

            const impactDamage = computeProjectileImpactDamage(projectile);
            const hpBefore = creature.hp;
            applyDamageToCreature(state, creature, impactDamage, events, shouldAllowBonusDrop(projectile.kind));
            events.push({ type: 'projectileImpact', id: projId, pos: impactPos, kind: projectile.kind });

            if (hpBefore > 0 && !creature.alive && !shouldPersistAfterKill(projectile.kind)) {
              projectile.alive = false;
              toRemove.push(projId);
              return;
            }

            const pierceRemaining = projectile.pierceRemaining ?? 0;
            if (pierceRemaining <= 0) {
              projectile.alive = false;
              toRemove.push(projId);
              return;
            }
            projectile.pierceRemaining = pierceRemaining - 1;
          }
        }
      }
    }
  });

  for (const id of toRemove) {
    despawnProjectile(state, id);
  }

  state.secondaryProjectilePool.forEachActive((projId, projectile) => {
    if (!projectile.alive || projectile.owner !== 'player') {
      return;
    }

    if (isTerrainBlocked(state.terrain, projectile.pos.x, projectile.pos.y, projectile.radius)) {
      const impactPos = { x: projectile.pos.x, y: projectile.pos.y };
      const explosionRadius = projectile.explosionRadius;
      if (explosionRadius > 0) {
        const explosionDamage = projectile.explosionDamage || projectile.damage;
        applyExplosionDamage(state, impactPos, explosionRadius, explosionDamage, events);
        events.push({
          type: 'projectileImpact',
          id: projId,
          pos: impactPos,
          kind: `secondary_${projectile.typeId}`,
          explosionRadius,
        });
      }
      projectile.alive = false;
      secondaryToRemove.push(projId);
      return;
    }

    const { cellX, cellY } = getCellCoords(projectile.pos.x, projectile.pos.y);
    for (let dy = -1; dy <= 1; dy += 1) {
      const ny = cellY + dy;
      if (ny < 0 || ny >= GRID_HEIGHT) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = cellX + dx;
        if (nx < 0 || nx >= GRID_WIDTH) continue;
        const cell = collisionGrid.get(getCellKey(nx, ny));
        if (!cell) continue;
        for (const creature of cell) {
          if (!creature.alive) {
            continue;
          }

          const dxp = projectile.pos.x - creature.pos.x;
          const dyp = projectile.pos.y - creature.pos.y;
          const radius = projectile.radius + creature.radius;
          if (dxp * dxp + dyp * dyp <= radius * radius) {
            const impactPos = { x: projectile.pos.x, y: projectile.pos.y };
            const explosionRadius = projectile.explosionRadius;
            if (explosionRadius > 0) {
              const explosionDamage = projectile.explosionDamage || projectile.damage;
              applyExplosionDamage(state, impactPos, explosionRadius, explosionDamage, events);
              events.push({
                type: 'projectileImpact',
                id: projId,
                pos: impactPos,
                kind: `secondary_${projectile.typeId}`,
                explosionRadius,
              });
              projectile.alive = false;
              secondaryToRemove.push(projId);
              return;
            }

            applyDamageToCreature(state, creature, projectile.damage, events);
            events.push({
              type: 'projectileImpact',
              id: projId,
              pos: impactPos,
              kind: `secondary_${projectile.typeId}`,
            });

            projectile.alive = false;
            secondaryToRemove.push(projId);
            return;
          }
        }
      }
    }
  });

  for (const id of secondaryToRemove) {
    despawnSecondaryProjectile(state, id);
  }

  state.particlePool.forEachActive((particleId, particle) => {
    if (!particle.alive || particle.owner !== 'player') {
      return;
    }

    if (particle.damagePerTick <= 0) {
      return;
    }

    const { cellX, cellY } = getCellCoords(particle.pos.x, particle.pos.y);
    for (let dy = -1; dy <= 1; dy += 1) {
      const ny = cellY + dy;
      if (ny < 0 || ny >= GRID_HEIGHT) continue;
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = cellX + dx;
        if (nx < 0 || nx >= GRID_WIDTH) continue;
        const cell = collisionGrid.get(getCellKey(nx, ny));
        if (!cell) continue;
        for (const creature of cell) {
          if (!creature.alive) {
            continue;
          }

          const dxp = particle.pos.x - creature.pos.x;
          const dyp = particle.pos.y - creature.pos.y;
          const radius = particle.radius + creature.radius;
          if (dxp * dxp + dyp * dyp <= radius * radius) {
            applyDamageToCreature(state, creature, particle.damagePerTick, events);
          }
        }
      }
    }

    if (!particle.alive || particle.lifeTicksRemaining <= 0) {
      particlesToRemove.push(particleId);
    }
  });

  for (const id of particlesToRemove) {
    despawnParticle(state, id);
  }

  for (const creature of state.creatures) {
    if (!creature.alive || creature.touchCooldownTicks > 0) {
      continue;
    }

    const dx = creature.pos.x - player.pos.x;
    const dy = creature.pos.y - player.pos.y;
    const radius = creature.radius + player.radius;
    if (dx * dx + dy * dy <= radius * radius) {
      if (isEnergized) {
        applyDamageToCreature(state, creature, creature.hp, events, false);
      } else {
        applyDamageToPlayer(state, creature.touchDamage, events);
        creature.touchCooldownTicks = TOUCH_COOLDOWN_TICKS;
      }
    }
  }

  clearCollisionGrid();
}

function computeProjectileImpactDamage(projectile: { origin: { x: number; y: number }; pos: { x: number; y: number }; damage: number }): number {
  const dx = projectile.pos.x - projectile.origin.x;
  const dy = projectile.pos.y - projectile.origin.y;
  const distRef = Math.max(PROJECTILE_DAMAGE_MIN_DIST_REF, Math.hypot(dx, dy) * WORLD_TO_REF);
  const scaled = (100 / distRef) * projectile.damage * PROJECTILE_DAMAGE_SCALE + PROJECTILE_DAMAGE_BASE;
  return scaled * PROJECTILE_DAMAGE_POST_SCALE;
}

function rebuildCollisionGrid(creatures: CreatureState[]): void {
  clearCollisionGrid();
  for (const creature of creatures) {
    if (!creature.alive) {
      continue;
    }

    const { cellX, cellY } = getCellCoords(creature.pos.x, creature.pos.y);
    if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT) {
      continue;
    }
    const key = getCellKey(cellX, cellY);
    let cell = collisionGrid.get(key);
    if (!cell) {
      cell = cellPool.pop() ?? [];
      collisionGrid.set(key, cell);
    }
    cell.push(creature);
  }
}

function clearCollisionGrid(): void {
  for (const cell of collisionGrid.values()) {
    cell.length = 0;
    cellPool.push(cell);
  }
  collisionGrid.clear();
}

function getCellCoords(x: number, y: number): { cellX: number; cellY: number } {
  const cellX = Math.floor((x - WORLD_BOUNDS.minX) / CELL_SIZE);
  const cellY = Math.floor((y - WORLD_BOUNDS.minY) / CELL_SIZE);
  return { cellX, cellY };
}

function getCellKey(cellX: number, cellY: number): number {
  return cellX + cellY * GRID_WIDTH;
}

const TOUCH_COOLDOWN_TICKS = 30;

function applyExplosionDamage(
  state: SimState,
  center: { x: number; y: number },
  radius: number,
  damage: number,
  events: SimEvent[],
): void {
  if (radius <= 0 || damage <= 0) {
    return;
  }

  const minCellX = Math.max(0, Math.floor((center.x - radius - WORLD_BOUNDS.minX) / CELL_SIZE));
  const maxCellX = Math.min(
    GRID_WIDTH - 1,
    Math.floor((center.x + radius - WORLD_BOUNDS.minX) / CELL_SIZE),
  );
  const minCellY = Math.max(0, Math.floor((center.y - radius - WORLD_BOUNDS.minY) / CELL_SIZE));
  const maxCellY = Math.min(
    GRID_HEIGHT - 1,
    Math.floor((center.y + radius - WORLD_BOUNDS.minY) / CELL_SIZE),
  );

  for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      const cell = collisionGrid.get(getCellKey(cellX, cellY));
      if (!cell) {
        continue;
      }
      for (const creature of cell) {
        if (!creature.alive) {
          continue;
        }
        const dx = center.x - creature.pos.x;
        const dy = center.y - creature.pos.y;
        const combinedRadius = radius + creature.radius;
        if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
          applyDamageToCreature(state, creature, damage, events);
        }
      }
    }
  }
}

function shouldAllowBonusDrop(projectileKind: string): boolean {
  if (projectileKind === 'fireblast') {
    return false;
  }
  return true;
}

function shouldPersistAfterKill(projectileKind: string): boolean {
  return projectileKind === 'gauss_gun' || projectileKind === 'fire_bullets' || projectileKind === 'blade_gun';
}

function applyDamageToCreature(
  state: SimState,
  creature: CreatureState,
  amount: number,
  events: SimEvent[],
  allowBonusDrop = true,
): void {
  if (!creature.alive || amount <= 0) {
    return;
  }

  creature.hp = Math.max(0, creature.hp - amount);
  events.push({ type: 'damage', target: 'creature', id: creature.id, amount });

  if (creature.hp > 0) {
    return;
  }

  creature.alive = false;
  events.push({ type: 'death', target: 'creature', id: creature.id });
  if (state.mode === 'quest' && state.modeState.kind === 'quest') {
    registerQuestKill(state.modeState, creature.kind);
  } else if (state.mode === 'survival' && state.modeState.kind === 'survival') {
    registerSurvivalKill(state.modeState);
  }
  const def = getCreatureDef(creature.kind);
  state.score += def.scoreValue;
  events.push({ type: 'score', amount: def.scoreValue, total: state.score });
  grantXp(state, events, def.xpValue);
  if (allowBonusDrop) {
    trySpawnBonusOnKill(state, events, creature.pos);
  }
}

export function applyDamageToPlayer(state: SimState, amount: number, events: SimEvent[]): void {
  if (state.player.hp <= 0 || amount <= 0) {
    return;
  }
  if ((state.player.activeEffects.shield ?? 0) > 0) {
    return;
  }

  const reduction = state.player.perkStats.damageReduction;
  const hasToughReloader = (state.player.perks['tough_reloader'] ?? 0) > 0;
  const reloading = state.player.reloadTimer > 0;
  let finalAmount = amount * (1 - reduction);
  if (hasToughReloader && reloading) {
    finalAmount *= 0.5;
  }
  state.player.hp = Math.max(0, state.player.hp - finalAmount);
  events.push({ type: 'damage', target: 'player', id: state.player.id, amount: finalAmount });

  if (state.player.hp > 0) {
    return;
  }

  if (state.mode === 'quest' && state.modeState.kind === 'quest') {
    if (state.modeState.status === 'Playing' && state.phase !== 'QuestFailed') {
      events.push({ type: 'death', target: 'player', id: state.player.id });
      setQuestStatus(state, state.modeState, 'Failed', events);
    }
    return;
  }

  if (state.phase !== 'GameOver') {
    state.phase = 'GameOver';
    events.push({ type: 'death', target: 'player', id: state.player.id });
    events.push({ type: 'gameOver', id: state.player.id });
  }
}
