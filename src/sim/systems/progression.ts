import type { SimState } from '../state';
import type { SimEvent } from '../types';
import type { PerkId } from '../../content/perks';
import { generatePerkChoices, recomputePerkStats } from '../perks';

const BASE_XP_TO_NEXT = 75;
const XP_GROWTH = 1.25;
const XP_PER_SECOND = 1.5;

export function grantXp(state: SimState, events: SimEvent[], amount: number): void {
  if (state.phase !== 'Playing') {
    return;
  }
  if (amount <= 0) {
    return;
  }

  const player = state.player;
  player.xp += amount;
  events.push({ type: 'xp', amount, total: player.xp, level: player.level });

  if (player.xp < player.xpToNext) {
    return;
  }

  levelUp(state, events);
}

export function updateProgression(state: SimState, events: SimEvent[], dt: number): void {
  if (state.phase !== 'Playing') {
    return;
  }

  if (XP_PER_SECOND > 0) {
    grantXp(state, events, XP_PER_SECOND * dt);
  }

  const regen = state.player.perkStats.regenPerSecond;
  if (regen > 0 && state.player.hp > 0) {
    const nextHp = Math.min(state.player.hpMax, state.player.hp + regen * dt);
    state.player.hp = nextHp;
  }
}

export function updatePerkSelection(state: SimState, events: SimEvent[]): void {
  if (state.phase !== 'PerkSelect') {
    return;
  }

  const choice = state.player.input.perkChoice;
  if (!choice || !state.perkChoices || state.perkChoices.length === 0) {
    return;
  }

  const index = choice - 1;
  const perkId = state.perkChoices[index];
  if (!perkId) {
    return;
  }

  choosePerk(state, events, perkId);
}

export function choosePerk(state: SimState, events: SimEvent[], perkId: PerkId): boolean {
  if (state.phase !== 'PerkSelect' || !state.perkChoices) {
    return false;
  }

  if (!state.perkChoices.includes(perkId)) {
    return false;
  }

  const player = state.player;
  player.perks[perkId] = (player.perks[perkId] ?? 0) + 1;
  recomputePerkStats(player);

  state.perkChoices = null;
  state.phase = 'Playing';

  events.push({ type: 'perkChosen', perkId, level: player.level });
  return true;
}

function levelUp(state: SimState, events: SimEvent[]): void {
  const player = state.player;
  player.xp -= player.xpToNext;
  player.level += 1;
  player.xpToNext = Math.max(1, Math.round(player.xpToNext * XP_GROWTH));
  const choices = generatePerkChoices(state.rng, player, 3);
  if (choices.length === 0) {
    state.phase = 'Playing';
    state.perkChoices = null;
    return;
  }
  state.phase = 'PerkSelect';
  state.perkChoices = choices;
  events.push({ type: 'levelUp', level: player.level, xpToNext: player.xpToNext });
  events.push({ type: 'perkOffered', level: player.level, choices });
}

export function resetProgression(state: SimState): void {
  state.player.level = 1;
  state.player.xp = 0;
  state.player.xpToNext = BASE_XP_TO_NEXT;
  state.player.perks = {};
  recomputePerkStats(state.player);
  state.perkChoices = null;
}

export function getBaseXpToNext(): number {
  return BASE_XP_TO_NEXT;
}
