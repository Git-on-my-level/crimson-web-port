import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  addRunRecord,
  getSurvivalHighscores,
  getQuestHighscores,
  loadHighscores,
  saveHighscores,
  type RunRecord,
} from '../src/persistence/highscores';

const TEST_STORAGE_KEY = 'crimson_port.highscores.v1';

function clearStorage(): void {
  try {
    localStorage.removeItem(TEST_STORAGE_KEY);
  } catch {
  }
}

function setupMockLocalStorage(): void {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => Object.keys(store)[index] ?? null,
  } as unknown as Storage;

  global.localStorage = mockStorage;
  (global as any).window = { localStorage: mockStorage };
}

describe('highscores', () => {
  beforeEach(() => {
    setupMockLocalStorage();
    clearStorage();
  });

  afterEach(() => {
    clearStorage();
  });

  describe('loadHighscores', () => {
    it('returns empty array when no data exists', () => {
      const result = loadHighscores();
      expect(result).toEqual([]);
    });

    it('returns saved records', () => {
      const record: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
      };

      saveHighscores([record]);
      const result = loadHighscores();

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(100);
      expect(result[0].mode).toBe('survival');
    });
  });

  describe('addRunRecord', () => {
    it('adds a single survival record', () => {
      const record: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
      };

      addRunRecord(record);
      const result = getSurvivalHighscores();

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(100);
    });

    it('sorts survival records by score (descending)', () => {
      const now = new Date();
      const record1: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date(now.getTime() - 1000).toISOString(),
      };

      const record2: RunRecord = {
        mode: 'survival',
        score: 200,
        timeSeconds: 90,
        kills: 10,
        level: 3,
        seed: 2,
        dateISO: new Date(now.getTime() - 2000).toISOString(),
      };

      const record3: RunRecord = {
        mode: 'survival',
        score: 150,
        timeSeconds: 75,
        kills: 7,
        level: 2,
        seed: 3,
        dateISO: new Date(now.getTime() - 3000).toISOString(),
      };

      addRunRecord(record1);
      addRunRecord(record2);
      addRunRecord(record3);

      const result = getSurvivalHighscores();

      expect(result).toHaveLength(3);
      expect(result[0].score).toBe(200);
      expect(result[1].score).toBe(150);
      expect(result[2].score).toBe(100);
    });

    it('caps survival records at 20', () => {
      for (let i = 0; i < 25; i += 1) {
        const record: RunRecord = {
          mode: 'survival',
          score: 1000 - i * 10,
          timeSeconds: 60,
          kills: 5,
          level: 2,
          seed: i,
          dateISO: new Date(Date.now() - i * 1000).toISOString(),
        };

        addRunRecord(record);
      }

      const result = getSurvivalHighscores();

      expect(result).toHaveLength(20);
      expect(result[0].score).toBe(1000);
      expect(result[19].score).toBe(810);
    });

    it('separates survival and quest records', () => {
      const survivalRecord: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
      };

      const questRecord: RunRecord = {
        mode: 'quest',
        score: 50,
        timeSeconds: 30,
        kills: 3,
        level: 1,
        seed: 2,
        dateISO: new Date().toISOString(),
        questId: 'test_quest',
      };

      addRunRecord(survivalRecord);
      addRunRecord(questRecord);

      const survivalResults = getSurvivalHighscores();
      const questResults = getQuestHighscores('test_quest');

      expect(survivalResults).toHaveLength(1);
      expect(survivalResults[0].score).toBe(100);
      expect(questResults).toHaveLength(1);
      expect(questResults[0].score).toBe(50);
    });

    it('caps quest records per quest ID', () => {
      for (let i = 0; i < 25; i += 1) {
        const record: RunRecord = {
          mode: 'quest',
          score: 1000 - i * 10,
          timeSeconds: 60,
          kills: 5,
          level: 2,
          seed: i,
          dateISO: new Date(Date.now() - i * 1000).toISOString(),
          questId: 'test_quest',
        };

        addRunRecord(record);
      }

      const result = getQuestHighscores('test_quest');

      expect(result).toHaveLength(20);
    });

    it('handles mixed mode records correctly', () => {
      for (let i = 0; i < 10; i += 1) {
        const survivalRecord: RunRecord = {
          mode: 'survival',
          score: 1000 - i * 10,
          timeSeconds: 60,
          kills: 5,
          level: 2,
          seed: i,
          dateISO: new Date(Date.now() - i * 1000).toISOString(),
        };

        addRunRecord(survivalRecord);
      }

      for (let i = 0; i < 15; i += 1) {
        const questRecord: RunRecord = {
          mode: 'quest',
          score: 1500 - i * 10,
          timeSeconds: 60,
          kills: 5,
          level: 2,
          seed: i + 100,
          dateISO: new Date(Date.now() - (i + 100) * 1000).toISOString(),
          questId: 'quest_a',
        };

        addRunRecord(questRecord);
      }

      const survivalResults = getSurvivalHighscores();
      const questResults = getQuestHighscores('quest_a');

      expect(survivalResults).toHaveLength(10);
      expect(survivalResults[0].score).toBe(1000);
      expect(questResults).toHaveLength(15);
      expect(questResults[0].score).toBe(1500);
    });

    it('gracefully handles localStorage unavailability', () => {
      const originalLocalStorage = global.localStorage;
      const originalWindow = (global as any).window;
      delete (global as any).localStorage;
      delete (global as any).window;

      const record: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
      };

      expect(() => addRunRecord(record)).not.toThrow();

      const result = loadHighscores();
      expect(result).toEqual([]);

      global.localStorage = originalLocalStorage;
      (global as any).window = originalWindow;
    });
  });

  describe('getSurvivalHighscores', () => {
    it('returns empty array when no survival records exist', () => {
      const result = getSurvivalHighscores();
      expect(result).toEqual([]);
    });

    it('does not include quest records', () => {
      const questRecord: RunRecord = {
        mode: 'quest',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
        questId: 'test_quest',
      };

      addRunRecord(questRecord);
      const result = getSurvivalHighscores();

      expect(result).toEqual([]);
    });
  });

  describe('getQuestHighscores', () => {
    it('returns empty array when no quest records exist', () => {
      const result = getQuestHighscores('test_quest');
      expect(result).toEqual([]);
    });

    it('returns only records for specific quest ID', () => {
      const questARecord: RunRecord = {
        mode: 'quest',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
        questId: 'quest_a',
      };

      const questBRecord: RunRecord = {
        mode: 'quest',
        score: 200,
        timeSeconds: 90,
        kills: 10,
        level: 3,
        seed: 2,
        dateISO: new Date().toISOString(),
        questId: 'quest_b',
      };

      addRunRecord(questARecord);
      addRunRecord(questBRecord);

      const resultA = getQuestHighscores('quest_a');
      const resultB = getQuestHighscores('quest_b');

      expect(resultA).toHaveLength(1);
      expect(resultA[0].score).toBe(100);
      expect(resultB).toHaveLength(1);
      expect(resultB[0].score).toBe(200);
    });

    it('does not include survival records', () => {
      const survivalRecord: RunRecord = {
        mode: 'survival',
        score: 100,
        timeSeconds: 60,
        kills: 5,
        level: 2,
        seed: 1,
        dateISO: new Date().toISOString(),
      };

      addRunRecord(survivalRecord);
      const result = getQuestHighscores('any_quest');

      expect(result).toEqual([]);
    });
  });
});
