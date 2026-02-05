import { PERKS, type PerkDef, type PerkId } from '../content/perks';
import type { Rng } from './rng';

export type PerkStats = {
  experienceMultiplier: number;
  fireRateMultiplier: number;
  projectileSpeedMultiplier: number;
  moveSpeedMultiplier: number;
  damageMultiplier: number;
  damageReduction: number;
  regenPerSecond: number;
  bonusDropMultiplier: number;
  reloadSpeedMultiplier: number;
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
    experienceMultiplier: 1,
    fireRateMultiplier: 1,
    projectileSpeedMultiplier: 1,
    moveSpeedMultiplier: 1,
    damageMultiplier: 1,
    damageReduction: 0,
    regenPerSecond: 0,
    bonusDropMultiplier: 1,
    reloadSpeedMultiplier: 1,
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
    applyPerkModifiers(stats, perk, stacks);
  }

  stats.damageReduction = Math.min(stats.damageReduction, DAMAGE_REDUCTION_CAP);
  stats.bonusDropMultiplier = Math.max(0.1, stats.bonusDropMultiplier);
  stats.fireRateMultiplier = Math.max(0.1, stats.fireRateMultiplier);
  stats.damageMultiplier = Math.max(0.1, stats.damageMultiplier);
  stats.moveSpeedMultiplier = Math.max(0.1, stats.moveSpeedMultiplier);
  stats.projectileSpeedMultiplier = Math.max(0.1, stats.projectileSpeedMultiplier);
  stats.reloadSpeedMultiplier = Math.max(0.1, stats.reloadSpeedMultiplier);

  player.perkStats = stats;

  const nextHpMax = player.baseHpMax;
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
  const isStackable = perk.tags?.includes('stackable') ?? false;
  
  if (!isStackable && currentStacks > 0) {
    return false;
  }
  
  if (currentStacks >= perk.maxStacks) {
    return false;
  }

  if (perk.prereq) {
    if (perkCountGet(player, perk.prereq) <= 0) {
      return false;
    }
  }

  return true;
}

export function generatePerkChoices(rng: Rng, player: PerkCarrier, count = 5): PerkId[] {
  const available = PERKS.filter((perk) => perkCanOffer(perk, player));

  if (available.length <= count) {
    return available.map((perk) => perk.id);
  }

  const pool = [...available];
  const choices: PerkId[] = [];

  while (choices.length < count && pool.length > 0) {
    const pickedIndex = Math.floor(rng.nextFloat01() * pool.length);
    const [picked] = pool.splice(pickedIndex, 1);
    if (picked) {
      choices.push(picked.id);
    }
  }

  return choices;
}

function applyPerkModifiers(stats: PerkStats, perk: PerkDef, stacks: number): void {
  const id = perk.id;

  switch (id) {
    case 'bloody_mess_quick_learner':
      stats.experienceMultiplier += 0.3 * stacks;
      break;
    case 'sharpshooter':
      stats.fireRateMultiplier *= 0.95;
      stats.projectileSpeedMultiplier *= 1.1;
      break;
    case 'fastloader':
      stats.reloadSpeedMultiplier *= 1.43;
      break;
    case 'lean_mean_exp_machine':
      stats.experienceMultiplier += 0.5 * stacks;
      break;
    case 'long_distance_runner':
      stats.moveSpeedMultiplier += 0.2 * stacks;
      break;
    case 'fastshot':
      stats.fireRateMultiplier *= 1.14;
      break;
    case 'ammo_maniac':
      stats.damageMultiplier += 0.2 * stacks;
      break;
    case 'dodger':
      stats.damageReduction += 0.2 * stacks;
      break;
    case 'bonus_magnet':
      stats.bonusDropMultiplier += 0.2 * stacks;
      break;
    case 'uranium_filled_bullets':
      stats.damageMultiplier += 0.5 * stacks;
      break;
    case 'doctor':
      stats.damageMultiplier += 0.2 * stacks;
      break;
    case 'bonus_economist':
      stats.bonusDropMultiplier *= 1.5;
      break;
    case 'thick_skinned':
      stats.damageReduction += 0.33 * stacks;
      break;
    case 'barrel_greaser':
      stats.damageMultiplier += 0.4 * stacks;
      stats.projectileSpeedMultiplier += 0.3 * stacks;
      break;
    case 'regeneration':
      stats.regenPerSecond += 0.5 * stacks;
      break;
    case 'pyromaniac':
      stats.damageMultiplier += 0.5 * stacks;
      break;
    case 'ninja':
      stats.damageReduction += 0.33 * stacks;
      break;
    case 'reflex_boosted':
      stats.fireRateMultiplier *= 1.11;
      stats.moveSpeedMultiplier *= 1.11;
      break;
    case 'stationary_reloader':
      break;
    case 'tough_reloader':
      break;
    default:
      break;
  }
}
