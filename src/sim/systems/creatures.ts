import { getCreatureDef } from '../../content/creatures';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { clampToWorld, findSpawnPosAwayFromPlayer, pickRandomWorldEdge } from '../world';

export const CREATURE_SPAWN_MIN_DISTANCE = 10;

export function spawnCreatureAtEdge(state: SimState, events: SimEvent[], kind: string): void {
  const def = getCreatureDef(kind);
  const spawn = findSpawnPosAwayFromPlayer(
    state.rng,
    state.player.pos,
    CREATURE_SPAWN_MIN_DISTANCE,
    20,
    (rng) => pickRandomWorldEdge(rng, def.radius),
  );
  spawnCreatureAtPosition(state, events, kind, spawn);
}

export function spawnCreatureAtPosition(
  state: SimState,
  events: SimEvent[],
  kind: string,
  pos: { x: number; y: number },
): void {
  const def = getCreatureDef(kind);
  const x = pos.x;
  const y = pos.y;
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
  void events;

  const player = state.player;
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

    clampToWorld(creature.pos, creature.radius);

    state.creatures[writeIndex] = creature;
    writeIndex += 1;
  }

  state.creatures.length = writeIndex;
}
