import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PERKS, PERK_BY_ID, type PerkDef, perkIdFromRefId } from '../src/content/perks.generated';

const REF_PERK_MAP_PATH = join('ref', 'crimson-master', 'docs', 'perk-id-map.md');

interface RefPerkRow {
  id: number;
  constName: string;
  constAddr: string;
  name: string;
  description: string;
  flags: string;
  prereq: string;
}

function parsePerkMap(markdown: string): RefPerkRow[] {
  const lines = markdown.split('\n');
  const perks: RefPerkRow[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('|')) {
      const cells = line.split('|').map((c) => c.trim());
      
      if (!inTable && cells.length > 5 && cells[1] === 'ID' && cells[2] === 'Const') {
        inTable = true;
        continue;
      }
      
      if (!inTable) continue;
      if (cells.some((c) => c.match(/^-{3,}$/))) continue;
      
      if (cells.length >= 7) {
        const idStr = cells[1];
        if (idStr && idStr !== 'ID' && !isNaN(parseInt(idStr))) {
          const id = parseInt(idStr);
          const constName = cells[2]?.replace(/\s*\(.*?\)\s*/g, '').trim() || '';
          const constAddr = cells[2]?.match(/\((.*?)\)/)?.[1] || '';
          const name = cells[3]?.trim() || '';
          const description = cells[4]?.trim() || '';
          const flags = cells[5]?.trim() || '';
          const prereq = cells[6]?.trim() || '';
          
          if (id >= 0 && id <= 57 && name) {
            perks.push({
              id,
              constName,
              constAddr,
              name,
              description,
              flags,
              prereq,
            });
          }
        }
      }
    }
  }

  return perks;
}

describe('Perk catalog parity', () => {
  it('should have at least 58 perks', () => {
    expect(PERKS.length).toBeGreaterThanOrEqual(58);
  });

  it('should have every refId appear exactly once', () => {
    const refIds = PERKS.map((p) => p.refId);
    const uniqueRefIds = new Set(refIds);
    
    expect(refIds.length).toBe(uniqueRefIds.size);
    
    for (let id = 0; id <= 57; id++) {
      expect(uniqueRefIds.has(id)).toBe(true);
    }
  });

  it('should have names matching the reference markdown', () => {
    const markdown = readFileSync(REF_PERK_MAP_PATH, 'utf-8');
    const refPerks = parsePerkMap(markdown);
    
    for (const refPerk of refPerks) {
      const generatedPerk = PERKS.find((p) => p.refId === refPerk.id);
      expect(generatedPerk).toBeDefined();
      
      if (generatedPerk) {
        expect(generatedPerk.name.trim()).toBe(refPerk.name.trim());
      }
    }
  });

  it('should have descriptions matching the reference markdown', () => {
    const markdown = readFileSync(REF_PERK_MAP_PATH, 'utf-8');
    const refPerks = parsePerkMap(markdown);
    
    for (const refPerk of refPerks) {
      const generatedPerk = PERKS.find((p) => p.refId === refPerk.id);
      expect(generatedPerk).toBeDefined();
      
      if (generatedPerk) {
        expect(generatedPerk.description.trim()).toBe(refPerk.description.trim());
      }
    }
  });

  it('should map perk IDs correctly via perkIdFromRefId', () => {
    for (const perk of PERKS) {
      const mappedId = perkIdFromRefId(perk.refId);
      expect(mappedId).toBe(perk.id);
    }
    
    expect(perkIdFromRefId(-1)).toBeNull();
    expect(perkIdFromRefId(999)).toBeNull();
  });

  it('should have PERK_BY_ID map with all perks', () => {
    expect(Object.keys(PERK_BY_ID).length).toBe(PERKS.length);
    
    for (const perk of PERKS) {
      expect(PERK_BY_ID[perk.id]).toBeDefined();
      expect(PERK_BY_ID[perk.id]).toBe(perk);
    }
  });

  it('should have unique perk IDs', () => {
    const ids = PERKS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });
});
