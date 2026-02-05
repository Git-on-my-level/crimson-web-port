import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

const OUTPUT_PATH = join('src', 'content', 'perks.generated.ts');
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
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

function generatePerkId(perk: RefPerkRow, existingSlugs: Set<string>): string {
  let slug = slugify(perk.name);
  
  let suffix = 0;
  let finalSlug = slug;
  while (existingSlugs.has(finalSlug)) {
    suffix++;
    finalSlug = `${slug}_ref${suffix}`;
  }
  
  existingSlugs.add(finalSlug);
  return finalSlug;
}

function parseFlags(flagsStr: string): string[] {
  if (!flagsStr) return [];
  
  const tags: string[] = [];
  if (flagsStr.includes('0x1')) tags.push('mode_3_only');
  if (flagsStr.includes('0x2')) tags.push('two_player_only');
  if (flagsStr.includes('0x4')) tags.push('stackable');
  if (flagsStr.includes('0x5')) tags.push('mode_3_only', 'stackable');
  
  return tags;
}

function parsePrereqId(prereqStr: string): number | null {
  if (!prereqStr) return null;
  
  const match = prereqStr.match(/perk_id_(\w+)/);
  if (!match) return null;
  
  const prereqName = match[1];
  const perkIdMap: Record<string, number> = {
    'veins_of_poison': 36,
    'perk_expert': 21,
    'dodger': 26,
    'regeneration': 38,
  };
  
  return perkIdMap[prereqName] || null;
}

function generatePerkIds(perkIds: string[]): string {
  return perkIds.map((id) => `'${id}'`).join('\n  | ');
}

function generateRarity(perk: RefPerkRow): string {
  const prereqId = parsePrereqId(perk.prereq);
  const flags = parseFlags(perk.flags);
  
  // Prerequisite perks are rare or legendary
  if (prereqId !== null) {
    return 'rare';
  }
  
  // Stackable perks are common
  if (flags.includes('stackable')) {
    return 'common';
  }
  
  // Mode-specific or two-player perks are uncommon
  if (flags.includes('mode_3_only') || flags.includes('two_player_only')) {
    return 'uncommon';
  }
  
  // Default to uncommon
  return 'uncommon';
}

function generatePerkDefs(perks: RefPerkRow[], perkIds: string[]): string {
  const defs = perks.map((perk) => {
    const perkId = perkIds[perk.id];
    const name = JSON.stringify(perk.name);
    const description = JSON.stringify(perk.description);
    const flags = parseFlags(perk.flags);
    const prereqId = parsePrereqId(perk.prereq);
    const rarity = generateRarity(perk);
    
    const maxStacks = flags.includes('stackable') ? 99 : 1;
    const prereqField = prereqId !== null ? `\n  prereq: '${perkIds[prereqId]}',` : '';
    const tagsField = flags.length > 0 ? `\n  tags: [${flags.map((t) => `'${t}'`).join(', ')}],` : '';
    
    return `  {
    id: '${perkId}',
    refId: ${perk.id},
    name: ${name},
    description: ${description},
    maxStacks: ${maxStacks},
    rarity: '${rarity}',${prereqField}${tagsField}
  }`;
  });

  return defs.join(',\n');
}

function generatePerkById(perkIds: string[]): string {
  return perkIds
    .map(
      (id) => `  '${id}': PERKS.find((p) => p.id === '${id}')!,`
    )
    .join('\n');
}

function generatePerkIdFromRefId(perks: RefPerkRow[], perkIds: string[]): string {
  const cases = perks.map((perk) => {
    return `    case ${perk.id}: return '${perkIds[perk.id]}';`;
  });

  return `export function perkIdFromRefId(refId: number): PerkId | null {
  switch (refId) {
${cases.join('\n')}
    default: return null;
  }
}`;
}

function generateFile(perks: RefPerkRow[], perkIds: string[]): string {
  const perkIdsUnion = generatePerkIds(perkIds);
  const perkDefs = generatePerkDefs(perks, perkIds);
  const perkById = generatePerkById(perkIds);
  const perkIdFromRefId = generatePerkIdFromRefId(perks, perkIds);
  const timestamp = new Date().toISOString();

  return `// Auto-generated by src/tools/gen_perks_catalog.ts
// DO NOT EDIT MANUALLY
// Generated at: ${timestamp}
// Source: ${REF_PERK_MAP_PATH}

export type PerkRefId = number;

export type PerkId =
  | ${perkIdsUnion};

export interface PerkDef {
  id: PerkId;
  refId: PerkRefId;
  name: string;
  description: string;
  maxStacks: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  prereq?: PerkId;
  tags?: string[];
}

export const PERKS: PerkDef[] = [
${perkDefs},
];

export const PERK_BY_ID: Record<PerkId, PerkDef> = {
${perkById}
};

${perkIdFromRefId}
`;
}

export function checkMode(): boolean {
  return process.argv.includes('--check');
}

function normalizeGenerated(content: string): string {
  return content.replace(/\/\/ Generated at: [^\n]+\n/, '');
}

export function runGenerator(outputPath = OUTPUT_PATH, refPath = REF_PERK_MAP_PATH): void {
  const markdown = readFileSync(refPath, 'utf-8');
  const perks = parsePerkMap(markdown);
  
  if (perks.length < 58) {
    console.warn(`Warning: Only found ${perks.length} perks, expected 58`);
  }

  const existingSlugs = new Set<string>();
  const perkIds: string[] = Array(58).fill('');
  
  for (const perk of perks) {
    if (perk.id >= 0 && perk.id < perkIds.length) {
      perkIds[perk.id] = generatePerkId(perk, existingSlugs);
    }
  }
  
  const generated = generateFile(perks, perkIds);

  if (checkMode()) {
    if (!existsSync(outputPath)) {
      console.error(`Generated file does not exist: ${outputPath}`);
      process.exit(1);
    }

    const existing = readFileSync(outputPath, 'utf-8');
    if (normalizeGenerated(generated) !== normalizeGenerated(existing)) {
      console.error(`Generated file is out of sync. Run: npm run tools:gen-perks`);
      process.exit(1);
    }

    console.log(`✓ Generated file is up to date: ${outputPath}`);
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated, 'utf-8');
  console.log(`✓ Generated ${perks.length} perks to ${outputPath}`);
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;
if (import.meta.url === currentFileUrl) {
  runGenerator();
}
