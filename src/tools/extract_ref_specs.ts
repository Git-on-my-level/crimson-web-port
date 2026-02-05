import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

export interface RefWeaponSpec {
  weapon_id: number;
  name: string | null;
  ammo_class: number | null;
  clip_size: number | null;
  shot_cooldown: number | null;
  reload_time: number | null;
  spread_heat_inc: number | null;
  fire_sound: string | null;
  reload_sound: string | null;
  icon_index: number | null;
  flags: number | null;
  projectile_meta: number | null;
  damage_scale: number | null;
  pellet_count: number | null;
}

interface RefSpecsOutput {
  generated_at: string;
  source: string;
  weapon_table: RefWeaponSpec[];
}

const REF_WEAPONS_PATH = join('ref', 'crimson-master', 'src', 'crimson', 'weapons.py');
const OUTPUT_PATH = join('.codex-autorunner', 'parity', 'baselines', 'ref_specs.json');

function stripInlineComment(value: string): string {
  const hashIndex = value.indexOf('#');
  if (hashIndex === -1) {
    return value;
  }
  const singleQuoteIndex = value.indexOf("'");
  if (singleQuoteIndex !== -1 && singleQuoteIndex < hashIndex) {
    return value;
  }
  return value.slice(0, hashIndex).trim();
}

function parseValue(raw: string): string | number | null {
  const cleaned = stripInlineComment(raw.trim().replace(/,$/, ''));
  if (cleaned === 'None') {
    return null;
  }
  if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
    return cleaned.slice(1, -1);
  }
  const numeric = Number(cleaned);
  if (Number.isNaN(numeric)) {
    return cleaned;
  }
  return numeric;
}

export function extractWeaponTable(source: string): RefWeaponSpec[] {
  const tableStart = source.indexOf('WEAPON_TABLE = [');
  if (tableStart === -1) {
    throw new Error('WEAPON_TABLE not found in weapons.py');
  }
  const tableSlice = source.slice(tableStart);
  const matches = [...tableSlice.matchAll(/Weapon\((.*?)\),/gs)];
  if (matches.length === 0) {
    throw new Error('No Weapon(...) entries found in WEAPON_TABLE');
  }

  return matches.map((match) => {
    const block = match[1];
    const entry: Record<string, string | number | null> = {};

    for (const line of block.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }
      const [rawKey, ...rest] = trimmed.split('=');
      const key = rawKey.trim();
      const value = parseValue(rest.join('=').trim());
      entry[key] = value;
    }

    return entry as unknown as RefWeaponSpec;
  });
}

export function extractRefSpecsFromFile(refPath = REF_WEAPONS_PATH): RefSpecsOutput {
  const source = readFileSync(refPath, 'utf-8');
  const weaponTable = extractWeaponTable(source);

  return {
    generated_at: new Date().toISOString(),
    source: refPath,
    weapon_table: weaponTable,
  };
}

export function writeRefSpecs(outputPath = OUTPUT_PATH, refPath = REF_WEAPONS_PATH): void {
  const specs = extractRefSpecsFromFile(refPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(specs, null, 2));
  console.log(`✓ Wrote ${specs.weapon_table.length} weapons to ${outputPath}`);
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;
if (import.meta.url === currentFileUrl) {
  writeRefSpecs();
}
