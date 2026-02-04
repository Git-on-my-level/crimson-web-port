import type { CreatureState, SimState } from '../state';
import type { SimEvent } from '../types';
import { despawnProjectile } from './projectiles';
import { trySpawnBonusOnKill } from './bonuses';
import { getCreatureDef } from '../../content/creatures';
import { grantXp } from './progression';
import { registerQuestKill, setQuestStatus } from './mode_quest';
import { WORLD_BOUNDS } from '../world';

const CELL_SIZE = 6;
const GRID_WIDTH = Math.ceil((WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX) / CELL_SIZE);
const GRID_HEIGHT = Math.ceil((WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY) / CELL_SIZE);
const collisionGrid = new Map<number, CreatureState[]>();
const cellPool: CreatureState[][] = [];

export function resolveCollisions(state: SimState, events: SimEvent[]): void {
  const player = state.player;

  for (const creature of state.creatures) {
    if (creature.touchCooldownTicks > 0) {
      creature.touchCooldownTicks = Math.max(0, creature.touchCooldownTicks - 1);
    }
  }

  rebuildCollisionGrid(state.creatures);

  const toRemove: number[] = [];

  state.projectilePool.forEachActive((projId, projectile) => {
    if (!projectile.alive || projectile.owner !== 'player') {
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
            applyDamageToCreature(state, creature, projectile.damage, events);
            projectile.alive = false;
            toRemove.push(projId);
            return;
          }
        }
      }
    }
  });

  for (const id of toRemove) {
    despawnProjectile(state, id);
  }

  for (const creature of state.creatures) {
    if (!creature.alive || creature.touchCooldownTicks > 0) {
      continue;
    }

    const dx = creature.pos.x - player.pos.x;
    const dy = creature.pos.y - player.pos.y;
    const radius = creature.radius + player.radius;
    if (dx * dx + dy * dy <= radius * radius) {
      applyDamageToPlayer(state, creature.touchDamage, events);
      creature.touchCooldownTicks = TOUCH_COOLDOWN_TICKS;
    }
  }

  clearCollisionGrid();
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

function applyDamageToCreature(
  state: SimState,
  creature: CreatureState,
  amount: number,
  events: SimEvent[],
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
  }
  const def = getCreatureDef(creature.kind);
  state.score += def.scoreValue;
  events.push({ type: 'score', amount: def.scoreValue, total: state.score });
  grantXp(state, events, def.xpValue);
  trySpawnBonusOnKill(state, events, creature.pos);
}

function applyDamageToPlayer(state: SimState, amount: number, events: SimEvent[]): void {
  if (state.player.hp <= 0 || amount <= 0) {
    return;
  }

  const reduction = state.player.perkStats.damageReduction;
  const finalAmount = amount * (1 - reduction);
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
