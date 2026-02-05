import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { extractRefSpecsFromFile, type RefWeaponSpec } from './extract_ref_specs';

const OUTPUT_PATH = join('src', 'content', 'weapons.generated.ts');
const REF_WEAPONS_PATH = join('ref', 'crimson-master', 'src', 'crimson', 'weapons.py');

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function generateWeaponId(spec: RefWeaponSpec): string {
  if (spec.name) {
    return slugify(spec.name);
  }
  return `unknown_${spec.weapon_id}`;
}

interface FullWeaponSpec {
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

function getAllWeaponSpecs(specs: RefWeaponSpec[]): FullWeaponSpec[] {
  const knownWeaponMap = new Map<number, RefWeaponSpec>();
  for (const spec of specs) {
    knownWeaponMap.set(spec.weapon_id, spec);
  }

  const allSpecs: FullWeaponSpec[] = [];
  for (let id = 1; id <= 53; id++) {
    const known = knownWeaponMap.get(id);
    if (known) {
      allSpecs.push(known);
    } else {
      allSpecs.push({
        weapon_id: id,
        name: null,
        ammo_class: null,
        clip_size: null,
        shot_cooldown: null,
        reload_time: null,
        spread_heat_inc: null,
        fire_sound: null,
        reload_sound: null,
        icon_index: null,
        flags: null,
        projectile_meta: null,
        damage_scale: null,
        pellet_count: null,
      });
    }
  }

  return allSpecs;
}

function generateWeaponIds(specs: FullWeaponSpec[]): string {
  const ids = specs.map((s) => `'${generateWeaponId(s)}'`);
  return ids.join('\n  | ');
}

function formatNumber(value: number | null): string {
  if (value === null) return 'null';
  return String(value);
}

function formatFloat(value: number | null): string {
  if (value === null) return 'null';
  return String(value);
}

const TICKS_PER_SECOND = 60;

function generateWeaponDefs(specs: FullWeaponSpec[]): string {
  const defs = specs.map((spec) => {
    const id = generateWeaponId(spec);
    const name = spec.name ? `'${spec.name}'` : 'null';
    const ammoClass = formatNumber(spec.ammo_class);
    const clipSize = spec.clip_size !== null ? formatNumber(spec.clip_size) : '0';
    const shotCooldown = spec.shot_cooldown !== null ? formatFloat(spec.shot_cooldown) : '0';
    const reloadTime = spec.reload_time !== null ? formatFloat(spec.reload_time) : '0';
    const spreadHeatInc = spec.spread_heat_inc !== null ? formatFloat(spec.spread_heat_inc) : '0';
    const fireSound = spec.fire_sound ? `'${spec.fire_sound}'` : 'null';
    const reloadSound = spec.reload_sound ? `'${spec.reload_sound}'` : 'null';
    const iconIndex = formatNumber(spec.icon_index);
    const flags = formatNumber(spec.flags);
    const projectileMeta = formatNumber(spec.projectile_meta);
    const damageScale = spec.damage_scale !== null ? formatFloat(spec.damage_scale) : '0';
    const pelletCount = spec.pellet_count !== null ? formatNumber(spec.pellet_count) : '1';

    const ammoMax = clipSize;
    const reloadTicks = reloadTime !== '0' ? `Math.round(${reloadTime} * ${TICKS_PER_SECOND})` : '0';
    const pellets = pelletCount;
    const spreadRadians = spreadHeatInc !== '0' ? `(${spreadHeatInc} * 0.01)` : '0';
    const muzzleOffset = '1.5';
    const projectileLifeTicks = '60';
    const projectileSpeed = '20';
    const damage = damageScale !== '0' ? damageScale : '0';
    const fireRate = shotCooldown !== '0' ? `(1.0 / ${shotCooldown})` : '0';
    const fireMode = 'auto';
    const projectileProfileId = 'undefined';
    const unlockLevel = '1';

    return `  {
    id: '${id}',
    refId: ${spec.weapon_id},
    name: ${name},
    ammoClass: ${ammoClass},
    clipSize: ${clipSize},
    shotCooldown: ${shotCooldown},
    reloadTime: ${reloadTime},
    spreadHeatInc: ${spreadHeatInc},
    fireSound: ${fireSound},
    reloadSound: ${reloadSound},
    iconIndex: ${iconIndex},
    flags: ${flags},
    projectileMeta: ${projectileMeta},
    damageScale: ${damageScale},
    pelletCount: ${pelletCount},
    ammoMax: ${ammoMax},
    reloadTicks: ${reloadTicks},
    pellets: ${pellets},
    spreadRadians: ${spreadRadians},
    muzzleOffset: ${muzzleOffset},
    projectileLifeTicks: ${projectileLifeTicks},
    projectileSpeed: ${projectileSpeed},
    damage: ${damage},
    fireRate: ${fireRate},
    fireMode: '${fireMode}',
    projectileProfileId: ${projectileProfileId},
    unlockLevel: ${unlockLevel},
  }`;
  });

  return defs.join(',\n');
}

function generateWeaponById(specs: FullWeaponSpec[]): string {
  const entries = specs.map((spec) => {
    const id = generateWeaponId(spec);
    return `  '${id}': WEAPONS.find(w => w.id === '${id}')!,`;
  });

  return entries.join('\n');
}

function generateWeaponIdFromRefId(specs: FullWeaponSpec[]): string {
  const cases = specs.map((spec) => {
    const id = generateWeaponId(spec);
    return `    case ${spec.weapon_id}: return '${id}';`;
  });

  return `export function weaponIdFromRefId(refId: number): WeaponId | null {
  switch (refId) {
${cases.join('\n')}
    default: return null;
  }
}`;
}

function generateWeaponRefIdFromWeaponId(specs: FullWeaponSpec[]): string {
  const cases = specs.map((spec) => {
    const id = generateWeaponId(spec);
    return `    case '${id}': return ${spec.weapon_id};`;
  });

  return `export function weaponRefIdFromWeaponId(weaponId: WeaponId): WeaponRefId | null {
  switch (weaponId) {
${cases.join('\n')}
    default: return null;
  }
}`;
}

function generateFile(specs: FullWeaponSpec[]): string {
  const weaponIds = generateWeaponIds(specs);
  const weaponDefs = generateWeaponDefs(specs);
  const weaponById = generateWeaponById(specs);
  const weaponIdFromRefId = generateWeaponIdFromRefId(specs);
  const weaponRefIdFromWeaponId = generateWeaponRefIdFromWeaponId(specs);
  const timestamp = new Date().toISOString();

  return `// Auto-generated by src/tools/gen_weapons_catalog.ts
// DO NOT EDIT MANUALLY
// Generated at: ${timestamp}
// Source: ${REF_WEAPONS_PATH}

export type WeaponRefId = number;

export type WeaponId =
  | ${weaponIds};

export interface WeaponDef {
  id: WeaponId;
  refId: WeaponRefId;
  name: string | null;
  ammoClass: number | null;
  clipSize: number | null;
  shotCooldown: number | null;
  reloadTime: number | null;
  spreadHeatInc: number | null;
  fireSound: string | null;
  reloadSound: string | null;
  iconIndex: number | null;
  flags: number | null;
  projectileMeta: number | null;
  damageScale: number | null;
  pelletCount: number | null;

  ammoMax: number;
  reloadTicks: number;
  pellets: number;
  spreadRadians: number;
  muzzleOffset: number;
  projectileLifeTicks: number;
  projectileSpeed: number;
  damage: number;
  fireRate: number;
  fireMode: 'single' | 'auto' | 'burst';
  projectileProfileId: undefined;
  unlockLevel?: number;
}

export const WEAPONS: WeaponDef[] = [
${weaponDefs},
];

export const WEAPON_BY_ID: Record<WeaponId, WeaponDef> = {
${weaponById}
};

${weaponIdFromRefId}

${weaponRefIdFromWeaponId}
`;
}

export function checkMode(): boolean {
  return process.argv.includes('--check');
}

function normalizeGenerated(content: string): string {
  return content.replace(/\/\/ Generated at: [^\n]+\n/, '');
}

export function runGenerator(outputPath = OUTPUT_PATH, refPath = REF_WEAPONS_PATH): void {
  const specs = extractRefSpecsFromFile(refPath).weapon_table;
  const allSpecs = getAllWeaponSpecs(specs);
  const generated = generateFile(allSpecs);

  if (checkMode()) {
    if (!existsSync(outputPath)) {
      console.error(`Generated file does not exist: ${outputPath}`);
      process.exit(1);
    }

    const existing = readFileSync(outputPath, 'utf-8');
    if (normalizeGenerated(generated) !== normalizeGenerated(existing)) {
      console.error(`Generated file is out of sync. Run: npm run tools:gen-weapons`);
      process.exit(1);
    }

    console.log(`✓ Generated file is up to date: ${outputPath}`);
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated, 'utf-8');
  console.log(`✓ Generated ${allSpecs.length} weapons to ${outputPath}`);
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;
if (import.meta.url === currentFileUrl) {
  runGenerator();
}
