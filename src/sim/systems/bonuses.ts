import { getBonusDef, pickRandomBonusType, type BonusId } from '../../content/bonuses';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { WEAPON_BY_ID } from '../../content/weapons';
import { clampToWorld, findSpawnPosAwayFromPlayer } from '../world';
import { assignWeapon, pickRandomWeapon, refreshAvailableWeapons, unlockWeapon } from '../weapons/weaponTable';

const BONUS_DROP_CHANCE = 0.25;
const BONUS_DESPAWN_TICKS = 900;
const BONUS_RADIUS = 0.8;
const BONUS_PICKUP_RADIUS = 1.5;
const MEDKIT_HEAL_AMOUNT = 30;
const SCORE_BONUS_AMOUNT = 50;
const BONUS_SPAWN_MIN_DISTANCE = 3.0;
const BONUS_SPAWN_JITTER = 3.5;

export function updateBonuses(state: SimState, events: SimEvent[]): void {
  updateBonusEffects(state);
  updateBonusLifetime(state);
  checkBonusPickup(state, events);
}

export function trySpawnBonusOnKill(state: SimState, events: SimEvent[], pos: { x: number; y: number }): void {
  const dropMultiplier = state.player.perkStats.bonusDropMultiplier;
  const dropChance = Math.min(0.9, BONUS_DROP_CHANCE * dropMultiplier);
  if (state.rng.nextFloat01() >= dropChance) {
    return;
  }
  const bonusType = pickRandomBonusType(state.rng);
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
    case 'medkit':
      const healAmount = Math.min(MEDKIT_HEAL_AMOUNT, state.player.hpMax - state.player.hp);
      if (healAmount > 0) {
        state.player.hp += healAmount;
      }
      break;
    case 'ammo':
      const weapon = WEAPON_BY_ID[state.player.weaponId];
      if (weapon && weapon.ammoMax !== undefined) {
        state.player.ammo = weapon.ammoMax;
      }
      break;
    case 'score':
      state.score += SCORE_BONUS_AMOUNT;
      events.push({ type: 'score', amount: SCORE_BONUS_AMOUNT, total: state.score });
      break;
    case 'weapon':
      {
        const available = refreshAvailableWeapons(state.player);
        const nextWeapon = pickRandomWeapon(state.rng, available);
        unlockWeapon(state.player, nextWeapon);
        assignWeapon(state.player, nextWeapon);
        events.push({ type: 'playSfx', name: 'weapon_pickup' });
      }
      break;
    case 'damage_boost':
    case 'fire_rate_boost':
    case 'speed_boost':
      state.player.activeEffects[bonus.kind] = def.durationTicks ?? 600;
      break;
  }

  events.push({ type: 'pickup', id: bonus.id, bonusType: bonus.kind });
  events.push({ type: 'playSfx', name: 'pickup' });
}

export function getDamageMultiplier(player: SimState['player']): number {
  const damageBoostTicks = player.activeEffects['damage_boost'] ?? 0;
  const bonusMultiplier = damageBoostTicks > 0 ? 1.5 : 1.0;
  return player.perkStats.damageMultiplier * bonusMultiplier;
}

export function getFireRateMultiplier(player: SimState['player']): number {
  const fireRateBoostTicks = player.activeEffects['fire_rate_boost'] ?? 0;
  const bonusMultiplier = fireRateBoostTicks > 0 ? 1.5 : 1.0;
  return player.perkStats.fireRateMultiplier * bonusMultiplier;
}
