import { getCreatureDef } from '../../content/creatures';
import type { SimState } from '../state';
import type { SimEvent } from '../types';

const WORLD_BOUNDS = {
  minX: -50,
  maxX: 50,
  minY: -50,
  maxY: 50,
};

const SPAWN_INTERVAL_TICKS = {
  min: 60,
  max: 120,
};

const DEFAULT_CREATURE_KIND = 'grunt';

function resetSpawnCooldown(state: SimState): void {
  const spread = SPAWN_INTERVAL_TICKS.max - SPAWN_INTERVAL_TICKS.min;
  const offset = state.rng.nextInt(spread + 1);
  state.creatureSpawnCooldownTicks = SPAWN_INTERVAL_TICKS.min + offset;
}

function spawnCreature(state: SimState, events: SimEvent[], kind: string): void {
  const def = getCreatureDef(kind);
  const side = state.rng.nextInt(4);
  const minX = WORLD_BOUNDS.minX + def.radius;
  const maxX = WORLD_BOUNDS.maxX - def.radius;
  const minY = WORLD_BOUNDS.minY + def.radius;
  const maxY = WORLD_BOUNDS.maxY - def.radius;
  const t = state.rng.nextFloat01();

  let x = 0;
  let y = 0;
  if (side === 0) {
    x = minX;
    y = minY + t * (maxY - minY);
  } else if (side === 1) {
    x = maxX;
    y = minY + t * (maxY - minY);
  } else if (side === 2) {
    x = minX + t * (maxX - minX);
    y = minY;
  } else {
    x = minX + t * (maxX - minX);
    y = maxY;
  }

  const id = state.nextEntityId++;
  state.creatures.push({
    id,
    kind,
    alive: true,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    hp: def.hp,
    hpMax: def.hp,
    radius: def.radius,
    speed: def.speed,
    touchDamage: def.touchDamage,
    touchCooldownTicks: 0,
  });

  events.push({ type: 'spawnCreature', id, pos: { x, y }, kind });
}

export function updateCreatures(state: SimState, events: SimEvent[], dt: number): void {
  if (state.creatureSpawnCooldownTicks <= 0) {
    spawnCreature(state, events, DEFAULT_CREATURE_KIND);
    resetSpawnCooldown(state);
  } else {
    state.creatureSpawnCooldownTicks -= 1;
  }

  const player = state.player;
  const minX = WORLD_BOUNDS.minX;
  const maxX = WORLD_BOUNDS.maxX;
  const minY = WORLD_BOUNDS.minY;
  const maxY = WORLD_BOUNDS.maxY;
  let writeIndex = 0;
  for (let i = 0; i < state.creatures.length; i += 1) {
    const creature = state.creatures[i];
    if (!creature.alive) {
      continue;
    }

    const dx = player.pos.x - creature.pos.x;
    const dy = player.pos.y - creature.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.0001) {
      const inv = creature.speed / dist;
      creature.vel.x = dx * inv;
      creature.vel.y = dy * inv;
      creature.pos.x += creature.vel.x * dt;
      creature.pos.y += creature.vel.y * dt;
    } else {
      creature.vel.x = 0;
      creature.vel.y = 0;
    }

    const clampMinX = minX + creature.radius;
    const clampMaxX = maxX - creature.radius;
    const clampMinY = minY + creature.radius;
    const clampMaxY = maxY - creature.radius;

    if (creature.pos.x < clampMinX) {
      creature.pos.x = clampMinX;
    } else if (creature.pos.x > clampMaxX) {
      creature.pos.x = clampMaxX;
    }

    if (creature.pos.y < clampMinY) {
      creature.pos.y = clampMinY;
    } else if (creature.pos.y > clampMaxY) {
      creature.pos.y = clampMaxY;
    }

    state.creatures[writeIndex] = creature;
    writeIndex += 1;
  }

  state.creatures.length = writeIndex;
}
