import type { CreatureState } from '../state';
import type { Vec2 } from '../types';

export const AI7_LINK_TIMER = 0x80;

export function creatureAi7TickLinkTimer(
  creature: CreatureState,
  dtMs: number,
  randInt: () => number,
): void {
  if ((creature.flags & AI7_LINK_TIMER) === 0) {
    return;
  }

  if (creature.linkIndex < 0) {
    creature.linkIndex += dtMs;
    if (creature.linkIndex >= 0) {
      creature.aiMode = 7;
      creature.linkIndex = (randInt() & 0x1ff) + 500;
    }
    return;
  }

  creature.linkIndex -= dtMs;
  if (creature.linkIndex < 1) {
    creature.linkIndex = -700 - (randInt() & 0x3ff);
  }
}

function resolveLiveLink(creatures: CreatureState[], linkIndex: number): CreatureState | null {
  const index = Math.trunc(linkIndex);
  if (index >= 0 && index < creatures.length) {
    const linked = creatures[index];
    if (linked && linked.hp > 0) {
      return linked;
    }
  }
  return null;
}

export function creatureAiUpdateTarget(
  creature: CreatureState,
  playerPos: Vec2,
  creatures: CreatureState[],
  dt: number,
): { moveScale: number; selfDamage?: number } {
  const dx = playerPos.x - creature.pos.x;
  const dy = playerPos.y - creature.pos.y;
  const distToPlayer = Math.hypot(dx, dy);

  const orbitPhase = Math.trunc(creature.phaseSeed) * 3.7 * Math.PI;
  let moveScale = 1.0;
  let selfDamage: number | undefined;

  creature.forceTarget = 0;

  let aiMode = creature.aiMode;
  const targetPos = creature.targetPos;

  if (aiMode === 0) {
    if (distToPlayer > 800.0) {
      targetPos.x = playerPos.x;
      targetPos.y = playerPos.y;
    } else {
      targetPos.x = playerPos.x + Math.cos(orbitPhase) * distToPlayer * 0.85;
      targetPos.y = playerPos.y + Math.sin(orbitPhase) * distToPlayer * 0.85;
    }
  } else if (aiMode === 8) {
    targetPos.x = playerPos.x + Math.cos(orbitPhase) * distToPlayer * 0.9;
    targetPos.y = playerPos.y + Math.sin(orbitPhase) * distToPlayer * 0.9;
  } else if (aiMode === 1) {
    if (distToPlayer > 800.0) {
      targetPos.x = playerPos.x;
      targetPos.y = playerPos.y;
    } else {
      targetPos.x = playerPos.x + Math.cos(orbitPhase) * distToPlayer * 0.55;
      targetPos.y = playerPos.y + Math.sin(orbitPhase) * distToPlayer * 0.55;
    }
  } else if (aiMode === 3) {
    const link = resolveLiveLink(creatures, creature.linkIndex);
    if (link) {
      targetPos.x = link.pos.x + creature.targetOffsetX;
      targetPos.y = link.pos.y + creature.targetOffsetY;
    } else {
      creature.aiMode = 0;
    }
  } else if (aiMode === 5) {
    const link = resolveLiveLink(creatures, creature.linkIndex);
    if (link) {
      targetPos.x = link.pos.x + creature.targetOffsetX;
      targetPos.y = link.pos.y + creature.targetOffsetY;
      const distToTarget = Math.hypot(targetPos.x - creature.pos.x, targetPos.y - creature.pos.y);
      if (distToTarget <= 64.0) {
        moveScale = distToTarget * 0.015625;
      }
    } else {
      creature.aiMode = 0;
      selfDamage = 1000.0;
    }
  }

  aiMode = creature.aiMode;
  if (aiMode === 4) {
    const link = resolveLiveLink(creatures, creature.linkIndex);
    if (!link) {
      creature.aiMode = 0;
      selfDamage = 1000.0;
    } else if (distToPlayer > 800.0) {
      targetPos.x = playerPos.x;
      targetPos.y = playerPos.y;
    } else {
      targetPos.x = playerPos.x + Math.cos(orbitPhase) * distToPlayer * 0.85;
      targetPos.y = playerPos.y + Math.sin(orbitPhase) * distToPlayer * 0.85;
    }
  } else if (aiMode === 7) {
    if ((creature.flags & AI7_LINK_TIMER) !== 0 && creature.linkIndex > 0) {
      targetPos.x = creature.pos.x;
      targetPos.y = creature.pos.y;
    } else if ((creature.flags & AI7_LINK_TIMER) === 0 && creature.orbitRadius > 0.0) {
      targetPos.x = creature.pos.x;
      targetPos.y = creature.pos.y;
      creature.orbitRadius -= dt;
    } else {
      creature.aiMode = 0;
    }
  } else if (aiMode === 6) {
    const link = resolveLiveLink(creatures, creature.linkIndex);
    if (!link) {
      creature.aiMode = 0;
    } else {
      const angle = creature.orbitAngle + creature.heading;
      targetPos.x = link.pos.x + Math.cos(angle) * creature.orbitRadius;
      targetPos.y = link.pos.y + Math.sin(angle) * creature.orbitRadius;
    }
  }

  const distToTarget = Math.hypot(targetPos.x - creature.pos.x, targetPos.y - creature.pos.y);
  if (distToTarget < 40.0 || distToTarget > 400.0) {
    creature.forceTarget = 1;
  }

  if (creature.forceTarget || creature.aiMode === 2) {
    targetPos.x = playerPos.x;
    targetPos.y = playerPos.y;
  }

  creature.targetHeading = Math.atan2(targetPos.y - creature.pos.y, targetPos.x - creature.pos.x) + Math.PI / 2.0;
  return selfDamage === undefined ? { moveScale } : { moveScale, selfDamage };
}
