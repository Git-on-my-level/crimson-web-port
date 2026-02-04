import type { BonusId } from '../bonuses';

export type QuestId = string;

export type QuestObjective =
  | { type: 'survive'; durationTicks: number }
  | { type: 'killCount'; count: number; creatureKind?: string }
  | { type: 'score'; score: number }
  | { type: 'bonusCollect'; count: number; bonusType?: BonusId };

export type QuestSpawnPoint = { x: number; y: number };

export type QuestSpawnPattern = 'ring' | 'edge' | 'random' | 'fixed';

export type QuestTimelineEvent =
  | {
      atTick: number;
      type: 'spawn';
      creatureKind: string;
      count: number;
      pattern?: QuestSpawnPattern;
      radius?: number;
      center?: QuestSpawnPoint;
      position?: QuestSpawnPoint;
      positions?: QuestSpawnPoint[];
    }
  | {
      atTick: number;
      type: 'spawnStream';
      creatureKind: string;
      count: number;
      intervalTicks: number;
      durationTicks: number;
      pattern?: QuestSpawnPattern;
      radius?: number;
      center?: QuestSpawnPoint;
      position?: QuestSpawnPoint;
      positions?: QuestSpawnPoint[];
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
