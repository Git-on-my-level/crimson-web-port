import { getBonusDef, pickRandomBonusType, type BonusId } from '../../content/bonuses';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { clampToWorld, findSpawnPosAwayFromPlayer } from '../world';
import { assignWeapon, pickRandomWeapon, refreshAvailableWeapons, unlockWeapon } from '../weapons/weaponTable';
import { getCreatureDef } from '../../content/creatures';
import { grantXp } from './progression';
import { registerQuestBonusCollected, registerQuestKill } from './mode_quest';
import { registerSurvivalKill } from './mode_survival';

const BONUS_BASE_DROP_DENOM = 9;
const BONUS_DESPAWN_TICKS = 900;
const BONUS_RADIUS = 0.8;
const BONUS_PICKUP_RADIUS = 1.5;
const MEDKIT_HEAL_AMOUNT = 10;
const SCORE_BONUS_AMOUNT = 500;
const BONUS_SPAWN_MIN_DISTANCE = 3.0;
const BONUS_SPAWN_JITTER = 3.5;
const BONUS_REROLL_MAX = 100;
const NUKE_DAMAGE = 9999;
const FIREBLAST_DAMAGE = 60;
const FIREBLAST_RADIUS = 10;
const SHOCK_CHAIN_DAMAGE = 45;
const SHOCK_CHAIN_RADIUS = 12;
const SHOCK_CHAIN_MAX_TARGETS = 6;

export function updateBonuses(state: SimState, events: SimEvent[]): void {
  updateBonusEffects(state);
  updateBonusLifetime(state);
  checkBonusPickup(state, events);
}

export function trySpawnBonusOnKill(state: SimState, events: SimEvent[], pos: { x: number; y: number }): void {
  const dropMultiplier = state.player.perkStats.bonusDropMultiplier;
  const baseChance = 1 / BONUS_BASE_DROP_DENOM;
  const boostedChance = Math.min(0.9, baseChance * dropMultiplier);
  const baseRoll = state.rng.nextInt(BONUS_BASE_DROP_DENOM) === 1;
  if (!baseRoll) {
    const extraChance = Math.max(0, boostedChance - baseChance);
    if (state.rng.nextFloat01() >= extraChance) {
      return;
    }
  }

  const bonusType = pickBonusWithReroll(state);
  const spawnPos = findSpawnPosAwayFromPlayer(
    state.rng,
    state.player.pos,
    BONUS_SPAWN_MIN_DISTANCE,
    12,
    (rng) => {
      const angle = rng.nextFloat01() * Math.PI * 2;
      const distance = rng.nextFloat01() * BONUS_SPAWN_JITTER;
      const candidate = {
        x: pos.x + Math.cos(angle) * distance,
        y: pos.y + Math.sin(angle) * distance,
      };
      return clampToWorld(candidate, BONUS_RADIUS);
    },
  );
  spawnBonus(state, events, spawnPos, bonusType);
}

export function spawnBonus(
  state: SimState,
  events: SimEvent[],
  pos: { x: number; y: number },
  kind: BonusId,
): void {
  const spawnPos = clampToWorld({ x: pos.x, y: pos.y }, BONUS_RADIUS);
  const id = state.nextEntityId++;
  state.bonuses.push({
    id,
    pos: { x: spawnPos.x, y: spawnPos.y },
    active: true,
    kind,
    radius: BONUS_RADIUS,
    lifeTicksRemaining: BONUS_DESPAWN_TICKS,
  });
  events.push({ type: 'spawnBonus', id, pos: spawnPos, kind });
}

export function checkBonusPickup(state: SimState, events: SimEvent[]): void {
  const player = state.player;

  for (const bonus of state.bonuses) {
    if (!bonus.active) {
      continue;
    }

    const dx = player.pos.x - bonus.pos.x;
    const dy = player.pos.y - bonus.pos.y;
    const radius = player.radius + BONUS_PICKUP_RADIUS + player.perkStats.pickupRangeBonus;
    if (dx * dx + dy * dy <= radius * radius) {
      applyBonus(state, bonus, events);
      bonus.active = false;
    }
  }
}

function updateBonusLifetime(state: SimState): void {
  let writeIndex = 0;
  for (const bonus of state.bonuses) {
    if (!bonus.active) {
      continue;
    }
    bonus.lifeTicksRemaining -= 1;
    if (bonus.lifeTicksRemaining <= 0) {
      bonus.active = false;
      continue;
    }
    state.bonuses[writeIndex] = bonus;
    writeIndex += 1;
  }
  state.bonuses.length = writeIndex;
}

function updateBonusEffects(state: SimState): void {
  const toRemove: BonusId[] = [];
  for (const [bonusId, ticksRemaining] of Object.entries(state.player.activeEffects)) {
    if (ticksRemaining <= 0) {
      toRemove.push(bonusId as BonusId);
      continue;
    }
    state.player.activeEffects[bonusId as BonusId] = ticksRemaining - 1;
  }
  for (const id of toRemove) {
    delete state.player.activeEffects[id];
  }
}

function applyBonus(state: SimState, bonus: SimState['bonuses'][0], events: SimEvent[]): void {
  const def = getBonusDef(bonus.kind);

  switch (bonus.kind) {
    case 'medkit': {
      const healAmount = Math.min(MEDKIT_HEAL_AMOUNT, state.player.hpMax - state.player.hp);
      if (healAmount > 0) {
        state.player.hp += healAmount;
      }
      break;
    }
    case 'score': {
      state.score += SCORE_BONUS_AMOUNT;
      events.push({ type: 'score', amount: SCORE_BONUS_AMOUNT, total: state.score });
      break;
    }
    case 'weapon': {
      const available = refreshAvailableWeapons(state.player);
      const nextWeapon = pickRandomWeapon(state.rng, available);
      unlockWeapon(state.player, nextWeapon);
      assignWeapon(state.player, nextWeapon);
      events.push({ type: 'playSfx', name: 'weapon_pickup' });
      break;
    }
    case 'nuke': {
      applyBonusAreaDamage(state, events, state.player.pos, 999, NUKE_DAMAGE, false);
      break;
    }
    case 'fireblast': {
      applyBonusAreaDamage(state, events, state.player.pos, FIREBLAST_RADIUS, FIREBLAST_DAMAGE, false);
      break;
    }
    case 'shock_chain': {
      applyShockChain(state, events);
      break;
    }
    case 'energizer':
    case 'weapon_power_up':
    case 'double_xp':
    case 'reflex_boost':
    case 'shield':
    case 'freeze':
    case 'speed':
    case 'fire_bullets':
      applyTimedBonus(state, bonus.kind, def);
      break;
  }

  events.push({ type: 'pickup', id: bonus.id, bonusType: bonus.kind });
  events.push({ type: 'playSfx', name: 'pickup' });
  if (state.mode === 'quest' && state.modeState.kind === 'quest') {
    registerQuestBonusCollected(state.modeState, bonus.kind);
  }
}

function applyTimedBonus(state: SimState, bonusId: BonusId, def: ReturnType<typeof getBonusDef>): void {
  const duration = def.durationTicks ?? 600;
  const existing = state.player.activeEffects[bonusId] ?? 0;
  const mode = def.stackMode ?? 'refresh';

  if (mode === 'stack') {
    state.player.activeEffects[bonusId] = existing + duration;
    return;
  }

  if (mode === 'replace') {
    state.player.activeEffects[bonusId] = duration;
    return;
  }

  state.player.activeEffects[bonusId] = Math.max(existing, duration);
}

function pickBonusWithReroll(state: SimState): BonusId {
  for (let attempt = 0; attempt < BONUS_REROLL_MAX; attempt += 1) {
    const pick = pickRandomBonusType(state.rng);
    if (isBonusAllowed(state, pick)) {
      return pick;
    }
  }
  return 'score';
}

function isBonusAllowed(state: SimState, bonusId: BonusId): boolean {
  const activeEffects = state.player.activeEffects;
  if (bonusId === 'freeze' && (activeEffects.freeze ?? 0) > 0) {
    return false;
  }
  if (bonusId === 'shield' && (activeEffects.shield ?? 0) > 0) {
    return false;
  }
  if (bonusId === 'shock_chain' && (activeEffects.shock_chain ?? 0) > 0) {
    return false;
  }
  return true;
}

function applyBonusAreaDamage(
  state: SimState,
  events: SimEvent[],
  center: { x: number; y: number },
  radius: number,
  damage: number,
  allowBonusDrop: boolean,
): void {
  const radiusSq = radius * radius;
  for (const creature of state.creatures) {
    if (!creature.alive) {
      continue;
    }
    const dx = creature.pos.x - center.x;
    const dy = creature.pos.y - center.y;
    if (dx * dx + dy * dy <= radiusSq) {
      applyBonusDamageToCreature(state, creature, damage, events, allowBonusDrop);
    }
  }
}

function applyShockChain(state: SimState, events: SimEvent[]): void {
  const player = state.player;
  const candidates = state.creatures
    .filter((creature) => creature.alive)
    .map((creature) => {
      const dx = creature.pos.x - player.pos.x;
      const dy = creature.pos.y - player.pos.y;
      return { creature, distSq: dx * dx + dy * dy };
    })
    .filter((entry) => entry.distSq <= SHOCK_CHAIN_RADIUS * SHOCK_CHAIN_RADIUS)
    .sort((a, b) => a.distSq - b.distSq)
    .slice(0, SHOCK_CHAIN_MAX_TARGETS);

  for (const entry of candidates) {
    applyBonusDamageToCreature(state, entry.creature, SHOCK_CHAIN_DAMAGE, events, false);
  }
}

function applyBonusDamageToCreature(
  state: SimState,
  creature: SimState['creatures'][0],
  amount: number,
  events: SimEvent[],
  allowBonusDrop: boolean,
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

export function getDamageMultiplier(player: SimState['player']): number {
  const fireBulletsTicks = player.activeEffects['fire_bullets'] ?? 0;
  const fireBulletsMultiplier = fireBulletsTicks > 0 ? 1.25 : 1.0;
  return player.perkStats.damageMultiplier * fireBulletsMultiplier;
}

export function getFireRateMultiplier(player: SimState['player']): number {
  const weaponPowerUpTicks = player.activeEffects['weapon_power_up'] ?? 0;
  const bonusMultiplier = weaponPowerUpTicks > 0 ? 1.5 : 1.0;
  return player.perkStats.fireRateMultiplier * bonusMultiplier;
}

export function getXpMultiplier(player: SimState['player']): number {
  const doubleXpTicks = player.activeEffects['double_xp'] ?? 0;
  return doubleXpTicks > 0 ? 2.0 : 1.0;
}
