import type { QuestId } from '../content/quests';

const STORAGE_KEY = 'crimson_port.highscores.v1';
const MAX_RECORDS = 20;

export type GameMode = 'survival' | 'quest';

export interface RunRecord {
  mode: GameMode;
  score: number;
  timeSeconds: number;
  kills: number;
  level: number;
  seed: number;
  dateISO: string;
  questId?: QuestId;
}

interface StorageData {
  version: number;
  records: RunRecord[];
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function parseStorageData(raw: string | null): StorageData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
      return parsed as StorageData;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadHighscores(): RunRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  const raw = storage.getItem(STORAGE_KEY);
  const data = parseStorageData(raw);

  if (!data) return [];

  return data.records;
}

function saveStorageData(data: StorageData): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function saveHighscores(records: RunRecord[]): void {
  const data: StorageData = {
    version: 1,
    records,
  };
  saveStorageData(data);
}

export function addRunRecord(record: RunRecord): void {
  const records = loadHighscores();
  records.push(record);

  const sortedRecords = records
    .sort((a, b) => {
      if (a.mode !== b.mode) {
        return a.mode.localeCompare(b.mode);
      }
      return b.score - a.score;
    });

  const modeRecords: Record<string, RunRecord[]> = {};
  for (const rec of sortedRecords) {
    const key = rec.mode + (rec.questId || '');
    if (!modeRecords[key]) {
      modeRecords[key] = [];
    }
    if (modeRecords[key].length < MAX_RECORDS) {
      modeRecords[key].push(rec);
    }
  }

  const cappedRecords = Object.values(modeRecords).flat();
  saveHighscores(cappedRecords);
}

export function getSurvivalHighscores(): RunRecord[] {
  return loadHighscores().filter(r => r.mode === 'survival').slice(0, MAX_RECORDS);
}

export function getQuestHighscores(questId: QuestId): RunRecord[] {
  return loadHighscores().filter(r => r.mode === 'quest' && r.questId === questId).slice(0, MAX_RECORDS);
}
