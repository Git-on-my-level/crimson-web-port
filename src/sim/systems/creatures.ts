import { getCreatureDef } from '../../content/creatures';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { clampToWorld, findSpawnPosAwayFromPlayer, pickRandomWorldEdge } from '../world';
import { clampOrSlide, findOpenTerrainPosition, isTerrainBlocked } from '../terrain';
import { angleApproach } from '../math/angles';

export const CREATURE_SPAWN_MIN_DISTANCE = 10;
const CREATURE_SPAWN_MAX_DISTANCE = 24;

export function spawnCreatureAtEdge(state: SimState, events: SimEvent[], kind: string): void {
  const def = getCreatureDef(kind);
  const spawn = findSpawnPosAwayFromPlayer(
    state.rng,
    state.player.pos,
    CREATURE_SPAWN_MIN_DISTANCE,
    20,
    (rng) => pickRandomWorldEdge(rng, def.radius),
    (candidate) => !isTerrainBlocked(state.terrain, candidate.x, candidate.y, def.radius),
  );
  spawnCreatureAtPosition(state, events, kind, spawn);
}

export function spawnCreatureNearPlayer(
  state: SimState,
  events: SimEvent[],
  kind: string,
  minDistance = CREATURE_SPAWN_MIN_DISTANCE,
  maxDistance = CREATURE_SPAWN_MAX_DISTANCE,
): void {
  const def = getCreatureDef(kind);
  const spawn = findSpawnPosAwayFromPlayer(
    state.rng,
    state.player.pos,
    minDistance,
    20,
    (rng) => {
      const angle = rng.nextFloat01() * Math.PI * 2;
      const dist = minDistance + rng.nextFloat01() * Math.max(0, maxDistance - minDistance);
      return clampToWorld(
        {
          x: state.player.pos.x + Math.cos(angle) * dist,
          y: state.player.pos.y + Math.sin(angle) * dist,
        },
        def.radius,
      );
    },
    (candidate) => !isTerrainBlocked(state.terrain, candidate.x, candidate.y, def.radius),
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
  const open = findOpenTerrainPosition(state.terrain, state.rng, pos, def.radius);
  const x = open.x;
  const y = open.y;
  const id = state.nextEntityId++;
  const heading = Math.atan2(state.player.pos.y - y, state.player.pos.x - x) + Math.PI / 2;
  const targetHeading = heading;
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
    heading,
    targetHeading,
    moveScale: 1.0,
  });

  events.push({ type: 'spawnCreature', id, pos: { x, y }, kind });
}

export function spawnCreatureInRing(
  state: SimState,
  events: SimEvent[],
  kind: string,
  radius: number,
): void {
  const def = getCreatureDef(kind);
  const angle = state.rng.nextFloat01() * Math.PI * 2;
  const pos = clampToWorld(
    {
      x: state.player.pos.x + Math.cos(angle) * radius,
      y: state.player.pos.y + Math.sin(angle) * radius,
    },
    def.radius,
  );
  spawnCreatureAtPosition(state, events, kind, pos);
}

export function updateCreatures(state: SimState, events: SimEvent[], dt: number): void {
  void events;

  const player = state.player;
  const freezeTicks = player.activeEffects.freeze ?? 0;
  const isFrozen = freezeTicks > 0;
  const energizerTicks = player.activeEffects.energizer ?? 0;
  const isEnergized = energizerTicks > 0;
  let writeIndex = 0;
  for (let i = 0; i < state.creatures.length; i += 1) {
    const creature = state.creatures[i];
    if (!creature.alive) {
      continue;
    }

    if (isFrozen) {
      creature.moveScale = 0.0;
      creature.vel.x = 0;
      creature.vel.y = 0;
      state.creatures[writeIndex] = creature;
      writeIndex += 1;
      continue;
    }

    creature.moveScale = 1.0;

    const dx = player.pos.x - creature.pos.x;
    const dy = player.pos.y - creature.pos.y;
    const dist = Math.hypot(dx, dy);
    const prevX = creature.pos.x;
    const prevY = creature.pos.y;

    if (dist > 0.0001) {
      const targetX = player.pos.x;
      const targetY = player.pos.y;
      const rawTargetHeading = Math.atan2(targetY - creature.pos.y, targetX - creature.pos.x) + Math.PI / 2;
      let targetHeading = rawTargetHeading;
      if (isEnergized) {
        targetHeading = rawTargetHeading + Math.PI;
      }
      creature.targetHeading = targetHeading;

      const moveSpeed = creature.speed;
      const turnRate = moveSpeed * (4.0 / 3.0);
      const speed = moveSpeed * 30 * creature.moveScale;

      creature.heading = angleApproach(creature.heading, targetHeading, turnRate, dt);
      const dirX = Math.cos(creature.heading - Math.PI / 2.0);
      const dirY = Math.sin(creature.heading - Math.PI / 2.0);

      creature.vel.x = dirX * speed;
      creature.vel.y = dirY * speed;
      creature.pos.x += creature.vel.x * dt;
      creature.pos.y += creature.vel.y * dt;
    } else {
      creature.vel.x = 0;
      creature.vel.y = 0;
    }

    const desiredX = creature.pos.x;
    const desiredY = creature.pos.y;
    clampToWorld(creature.pos, creature.radius);
    clampOrSlide(state.terrain, creature.pos, creature.radius, { x: prevX, y: prevY });
    if (creature.pos.x !== desiredX) {
      creature.vel.x = 0;
    }
    if (creature.pos.y !== desiredY) {
      creature.vel.y = 0;
    }

    state.creatures[writeIndex] = creature;
    writeIndex += 1;
  }

  state.creatures.length = writeIndex;
}
