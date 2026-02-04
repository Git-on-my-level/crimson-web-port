import type { BonusId } from '../bonuses';

export type QuestId = string;

export type QuestObjective =
  | { type: 'survive'; durationTicks: number }
  | { type: 'killCount'; count: number; creatureKind?: string }
  | { type: 'score'; score: number };

export type QuestTimelineEvent =
  | {
      atTick: number;
      type: 'spawn';
      creatureKind: string;
      count: number;
      pattern?: 'ring' | 'edge' | 'random';
      radius?: number;
    }
  | { atTick: number; type: 'message'; text: string }
  | { atTick: number; type: 'grantBonus'; bonusType: BonusId; count?: number };

export interface QuestDef {
  id: QuestId;
  title: string;
  description?: string;
  objectives: QuestObjective[];
  timeline: QuestTimelineEvent[];
}

export type QuestStatus = 'Playing' | 'Success' | 'Failed';
