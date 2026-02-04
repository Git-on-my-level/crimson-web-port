import { PERKS, type PerkDef, type PerkId, type PerkModifiers } from '../content/perks';
import type { Rng } from './rng';

export type PerkStats = {
  damageMultiplier: number;
  fireRateMultiplier: number;
  projectileSpeedMultiplier: number;
  moveSpeedMultiplier: number;
  hpMaxBonus: number;
  damageReduction: number;
  regenPerSecond: number;
  bonusDropMultiplier: number;
  pickupRangeBonus: number;
};

export type PerkCarrier = {
  perks: Partial<Record<PerkId, number>>;
  perkStats: PerkStats;
  baseHpMax: number;
  hpMax: number;
  hp: number;
};

const DAMAGE_REDUCTION_CAP = 0.6;

export function createPerkStats(): PerkStats {
  return {
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    projectileSpeedMultiplier: 1,
    moveSpeedMultiplier: 1,
    hpMaxBonus: 0,
    damageReduction: 0,
    regenPerSecond: 0,
    bonusDropMultiplier: 1,
    pickupRangeBonus: 0,
  };
}

export function recomputePerkStats(player: PerkCarrier): void {
  const stats = createPerkStats();

  for (const perk of PERKS) {
    const stacks = player.perks[perk.id] ?? 0;
    if (stacks <= 0) {
      continue;
    }
    applyModifiers(stats, perk.modifiers, stacks);
  }

  stats.damageReduction = Math.min(stats.damageReduction, DAMAGE_REDUCTION_CAP);
  stats.bonusDropMultiplier = Math.max(0.1, stats.bonusDropMultiplier);
  stats.fireRateMultiplier = Math.max(0.1, stats.fireRateMultiplier);
  stats.damageMultiplier = Math.max(0.1, stats.damageMultiplier);
  stats.moveSpeedMultiplier = Math.max(0.1, stats.moveSpeedMultiplier);
  stats.projectileSpeedMultiplier = Math.max(0.1, stats.projectileSpeedMultiplier);

  player.perkStats = stats;

  const nextHpMax = player.baseHpMax + stats.hpMaxBonus;
  if (nextHpMax !== player.hpMax) {
    player.hpMax = nextHpMax;
    if (player.hp > player.hpMax) {
      player.hp = player.hpMax;
    }
  }
}

export function perkCountGet(player: PerkCarrier, perkId: PerkId): number {
  return player.perks[perkId] ?? 0;
}

export function perkCanOffer(perk: PerkDef, player: PerkCarrier): boolean {
  const currentStacks = perkCountGet(player, perk.id);
  if (currentStacks >= perk.maxStacks) {
    return false;
  }

  if (perk.exclusiveTag) {
    for (const other of PERKS) {
      if (other.exclusiveTag !== perk.exclusiveTag) {
        continue;
      }
      if (other.id === perk.id) {
        continue;
      }
      if ((player.perks[other.id] ?? 0) > 0) {
        return false;
      }
    }
  }

  return true;
}

export function generatePerkChoices(rng: Rng, player: PerkCarrier, count = 3): PerkId[] {
  const available = PERKS.filter((perk) => perkCanOffer(perk, player));

  if (available.length <= count) {
    return available.map((perk) => perk.id);
  }

  const pool = [...available];
  const choices: PerkId[] = [];

  while (choices.length < count && pool.length > 0) {
    const index = rng.nextInt(pool.length);
    const [picked] = pool.splice(index, 1);
    if (picked) {
      choices.push(picked.id);
    }
  }

  return choices;
}

function applyModifiers(stats: PerkStats, modifiers: PerkModifiers, stacks: number): void {
  if (modifiers.damageMultiplier) {
    stats.damageMultiplier += modifiers.damageMultiplier * stacks;
  }
  if (modifiers.fireRateMultiplier) {
    stats.fireRateMultiplier += modifiers.fireRateMultiplier * stacks;
  }
  if (modifiers.projectileSpeedMultiplier) {
    stats.projectileSpeedMultiplier += modifiers.projectileSpeedMultiplier * stacks;
  }
  if (modifiers.moveSpeedMultiplier) {
    stats.moveSpeedMultiplier += modifiers.moveSpeedMultiplier * stacks;
  }
  if (modifiers.hpMaxBonus) {
    stats.hpMaxBonus += modifiers.hpMaxBonus * stacks;
  }
  if (modifiers.damageReduction) {
    stats.damageReduction += modifiers.damageReduction * stacks;
  }
  if (modifiers.regenPerSecond) {
    stats.regenPerSecond += modifiers.regenPerSecond * stacks;
  }
  if (modifiers.bonusDropMultiplier) {
    stats.bonusDropMultiplier += modifiers.bonusDropMultiplier * stacks;
  }
  if (modifiers.pickupRangeBonus) {
    stats.pickupRangeBonus += modifiers.pickupRangeBonus * stacks;
  }
}
