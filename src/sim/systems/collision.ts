import type { CreatureState, SimState } from '../state';
import type { SimEvent } from '../types';
import { despawnProjectile } from './projectiles';
import { trySpawnBonusOnKill } from './bonuses';
import { getCreatureDef } from '../../content/creatures';
import { grantXp } from './progression';
import { registerQuestKill, setQuestStatus } from './mode_quest';

export function resolveCollisions(state: SimState, events: SimEvent[]): void {
  const player = state.player;

  for (const creature of state.creatures) {
    if (creature.touchCooldownTicks > 0) {
      creature.touchCooldownTicks = Math.max(0, creature.touchCooldownTicks - 1);
    }
  }

  const toRemove: number[] = [];

  state.projectilePool.forEachActive((projId, projectile) => {
    if (!projectile.alive || projectile.owner !== 'player') {
      return;
    }

    for (const creature of state.creatures) {
      if (!creature.alive) {
        continue;
      }

      const dx = projectile.pos.x - creature.pos.x;
      const dy = projectile.pos.y - creature.pos.y;
      const radius = projectile.radius + creature.radius;
      if (dx * dx + dy * dy <= radius * radius) {
        applyDamageToCreature(state, creature, projectile.damage, events);
        projectile.alive = false;
        toRemove.push(projId);
        break;
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
