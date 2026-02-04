import type { QuestTimelineEvent } from '../../content/quests';
import { getQuestDef } from '../../content/quests';
import type { QuestModeState, SimState } from '../state';
import type { SimEvent } from '../types';
import { spawnCreatureAtEdge, spawnCreatureAtPosition } from './creatures';
import { spawnBonus } from './bonuses';
import { clampToWorld, findSpawnPosAwayFromPlayer, pickRandomWorldPos } from '../world';

const RING_DEFAULT_RADIUS = 12;
const RANDOM_SPAWN_MIN_DISTANCE = 8;

export function updateQuestMode(state: SimState, events: SimEvent[]): void {
  if (state.mode !== 'quest') {
    return;
  }

  const modeState = ensureQuestState(state);
  if (modeState.status !== 'Playing') {
    return;
  }

  modeState.elapsedTicks += 1;

  const quest = getQuestDef(modeState.questId);
  processTimeline(state, modeState, quest.timeline, events);
  evaluateObjectives(state, modeState, quest, events);
}

function ensureQuestState(state: SimState): QuestModeState {
  if (state.modeState.kind === 'quest') {
    return state.modeState;
  }

  const next: QuestModeState = {
    kind: 'quest',
    questId: state.selectedQuestId,
    elapsedTicks: 0,
    killsByKind: {},
    killsTotal: 0,
    status: 'Playing',
    nextTimelineIndex: 0,
    messages: [],
  };
  state.modeState = next;
  return next;
}

function processTimeline(
  state: SimState,
  modeState: QuestModeState,
  timeline: QuestTimelineEvent[],
  events: SimEvent[],
): void {
  while (
    modeState.nextTimelineIndex < timeline.length &&
    timeline[modeState.nextTimelineIndex].atTick <= modeState.elapsedTicks
  ) {
    const event = timeline[modeState.nextTimelineIndex];
    handleTimelineEvent(state, modeState, event, events);
    modeState.nextTimelineIndex += 1;
  }
}

function handleTimelineEvent(
  state: SimState,
  modeState: QuestModeState,
  event: QuestTimelineEvent,
  events: SimEvent[],
): void {
  switch (event.type) {
    case 'spawn': {
      spawnCreatures(state, events, event);
      break;
    }
    case 'message': {
      modeState.messages.push({ text: event.text, tick: modeState.elapsedTicks });
      events.push({ type: 'questMessage', text: event.text });
      break;
    }
    case 'grantBonus': {
      const count = event.count ?? 1;
      for (let i = 0; i < count; i += 1) {
        const spawnPos = clampToWorld({ ...state.player.pos }, 0.8);
        spawnBonus(state, events, spawnPos, event.bonusType);
      }
      break;
    }
  }
}

function spawnCreatures(
  state: SimState,
  events: SimEvent[],
  event: Extract<QuestTimelineEvent, { type: 'spawn' }>,
): void {
  const pattern = event.pattern ?? 'edge';
  const count = Math.max(1, event.count);

  if (pattern === 'edge') {
    for (let i = 0; i < count; i += 1) {
      spawnCreatureAtEdge(state, events, event.creatureKind);
    }
    return;
  }

  if (pattern === 'ring') {
    const radius = event.radius ?? RING_DEFAULT_RADIUS;
    const baseAngle = state.rng.nextFloat01() * Math.PI * 2;
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i / count) * Math.PI * 2;
      const pos = {
        x: state.player.pos.x + Math.cos(angle) * radius,
        y: state.player.pos.y + Math.sin(angle) * radius,
      };
      spawnCreatureAtPosition(state, events, event.creatureKind, clampToWorld(pos, 0));
    }
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const spawnPos = findSpawnPosAwayFromPlayer(
      state.rng,
      state.player.pos,
      RANDOM_SPAWN_MIN_DISTANCE,
      12,
      (rng) => pickRandomWorldPos(rng, 1),
    );
    spawnCreatureAtPosition(state, events, event.creatureKind, spawnPos);
  }
}

function evaluateObjectives(state: SimState, modeState: QuestModeState, quest: ReturnType<typeof getQuestDef>, events: SimEvent[]): void {
  const completed = quest.objectives.every((objective) => {
    switch (objective.type) {
      case 'survive':
        return modeState.elapsedTicks >= objective.durationTicks;
      case 'killCount': {
        if (objective.creatureKind) {
          return (modeState.killsByKind[objective.creatureKind] ?? 0) >= objective.count;
        }
        return modeState.killsTotal >= objective.count;
      }
      case 'score':
        return state.score >= objective.score;
      default:
        return false;
    }
  });

  if (completed) {
    setQuestStatus(state, modeState, 'Success', events);
  }
}

export function registerQuestKill(modeState: QuestModeState, creatureKind: string): void {
  modeState.killsTotal += 1;
  modeState.killsByKind[creatureKind] = (modeState.killsByKind[creatureKind] ?? 0) + 1;
}

export function setQuestStatus(
  state: SimState,
  modeState: QuestModeState,
  status: QuestModeState['status'],
  events: SimEvent[],
): void {
  if (modeState.status === status) {
    return;
  }

  modeState.status = status;
  if (status === 'Success') {
    state.phase = 'QuestResults';
  }
  if (status === 'Failed') {
    state.phase = 'QuestFailed';
  }
  events.push({ type: 'questStatusChanged', status });
}
