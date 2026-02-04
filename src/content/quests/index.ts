import type { QuestDef, QuestId } from './types';

export const QUESTS: QuestDef[] = [
  {
    id: 'quest_training_grounds',
    title: 'Training Grounds',
    description: 'Hold the line while waves test your reflexes.',
    objectives: [{ type: 'survive', durationTicks: 60 * 30 }],
    timeline: [
      { atTick: 30, type: 'message', text: 'Hold steady.' },
      { atTick: 120, type: 'spawn', creatureKind: 'grunt', count: 6, pattern: 'edge' },
      { atTick: 360, type: 'spawn', creatureKind: 'grunt', count: 8, pattern: 'edge' },
      { atTick: 600, type: 'spawn', creatureKind: 'runner', count: 6, pattern: 'ring', radius: 14 },
      { atTick: 900, type: 'grantBonus', bonusType: 'score', count: 2 },
      { atTick: 1100, type: 'spawn', creatureKind: 'tank', count: 2, pattern: 'edge' },
      { atTick: 1400, type: 'spawn', creatureKind: 'runner', count: 8, pattern: 'random' },
      { atTick: 1600, type: 'message', text: 'Almost there.' },
    ],
  },
  {
    id: 'quest_test_short',
    title: 'Test Short',
    description: 'Short quest used by automated tests.',
    objectives: [{ type: 'survive', durationTicks: 120 }],
    timeline: [
      { atTick: 1, type: 'spawn', creatureKind: 'grunt', count: 1, pattern: 'edge' },
      { atTick: 30, type: 'message', text: 'Keep moving.' },
    ],
  },
];

export const DEFAULT_QUEST_ID: QuestId = QUESTS[0]?.id ?? 'quest_training_grounds';

const QUESTS_BY_ID = new Map<QuestId, QuestDef>(QUESTS.map((quest) => [quest.id, quest]));

export function getQuestDef(id: QuestId): QuestDef {
  return QUESTS_BY_ID.get(id) ?? QUESTS[0];
}

export type { QuestDef, QuestId, QuestObjective, QuestStatus, QuestTimelineEvent } from './types';
