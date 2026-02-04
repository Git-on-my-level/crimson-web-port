import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

interface RefSymbol {
  name: string;
  address: string;
  decl: string;
  source: 'crimsonland' | 'grim';
}

interface PrefixGroup {
  prefix: string;
  count: number;
  functions: RefSymbol[];
}

const SUBSYSTEMS = [
  'player',
  'creatures',
  'creature',
  'weapons',
  'weapon',
  'projectiles',
  'projectile',
  'bonuses',
  'bonus',
  'perks',
  'perk',
  'quest',
  'ui',
  'sfx',
  'music',
  'audio',
  'terrain',
  'camera',
  'highscore',
  'config',
  'input',
  'mod',
  'console',
  'menu',
  'gameplay',
  'game',
  'text',
  'texture',
  'sprite',
  'font',
  'render',
  'particles',
  'collision',
  'math',
  'string',
  'file',
  'save',
  'load',
  'timer',
  'random'
];

const LOW_SIGNAL_PREFIXES = [
  'FUN_',
  'CRT_',
  'thunk_',
  'sub_',
  'DAT_',
  '_',
  ''
];

function extractFunctions(filePath: string, source: 'crimsonland' | 'grim'): RefSymbol[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const symbols: RefSymbol[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^\/\*\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+@\s+([0-9a-fA-F]+)\s+\*\/$/);
    
    if (match) {
      const name = match[1];
      const address = match[2];
      
      let decl = '';
      let j = i + 1;
      
      while (j < lines.length) {
        const candidate = lines[j].trim();
        if (candidate && !candidate.startsWith('/*')) {
          decl = lines[j];
          break;
        }
        j++;
      }

      if (decl) {
        symbols.push({ name, address, decl, source });
      }
      
      i = j + 1;
    } else {
      i++;
    }
  }

  return symbols;
}

function getPrefix(name: string): string {
  const parts = name.split('_');
  if (parts.length === 1) return '';
  return parts.slice(0, -1).join('_') + '_';
}

function isHighSignal(prefix: string): boolean {
  return !LOW_SIGNAL_PREFIXES.includes(prefix);
}

function groupByPrefix(symbols: RefSymbol[]): PrefixGroup[] {
  const groups = new Map<string, RefSymbol[]>();
  
  for (const sym of symbols) {
    const prefix = getPrefix(sym.name);
    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix)!.push(sym);
  }

  return Array.from(groups.entries())
    .map(([prefix, funcs]) => ({
      prefix: prefix || '(no_prefix)',
      count: funcs.length,
      functions: funcs.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => b.count - a.count);
}

function groupBySubsystem(symbols: RefSymbol[]): Map<string, RefSymbol[]> {
  const subsystems = new Map<string, RefSymbol[]>();
  
  for (const sym of symbols) {
    const name = sym.name.toLowerCase();
    let assigned = false;
    
    for (const subsystem of SUBSYSTEMS) {
      if (name.startsWith(subsystem + '_')) {
        if (!subsystems.has(subsystem)) {
          subsystems.set(subsystem, []);
        }
        subsystems.get(subsystem)!.push(sym);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      const prefix = getPrefix(sym.name);
      if (isHighSignal(prefix)) {
        if (!subsystems.has('misc')) {
          subsystems.set('misc', []);
        }
        subsystems.get('misc')!.push(sym);
      }
    }
  }
  
  return subsystems;
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const rootDir = process.cwd();
  const refDir = join(rootDir, 'ref');
  const docsRefDir = join(rootDir, 'docs', 'ref');
  const docsPortingDir = join(rootDir, 'docs', 'porting');
  const docsProgressDir = join(rootDir, 'docs', 'progress');

  ensureDir(docsRefDir);
  ensureDir(docsPortingDir);
  ensureDir(docsProgressDir);

  const crimsonlandPath = join(refDir, 'crimsonland.exe_decompiled.c');
  const grimPath = join(refDir, 'grim.dll_decompiled.c');

  const crimsonlandSyms = extractFunctions(crimsonlandPath, 'crimsonland');
  const grimSyms = extractFunctions(grimPath, 'grim');
  const allSymbols = [...crimsonlandSyms, ...grimSyms];

  const sortedSymbols = allSymbols.sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(
    join(docsRefDir, 'ref-symbols.json'),
    JSON.stringify(sortedSymbols, null, 2)
  );

  const prefixGroups = groupByPrefix(sortedSymbols);
  const highSignalGroups = prefixGroups.filter(g => isHighSignal(g.prefix.replace(/\(no_prefix\)/, '')));

  let summary = '# Reference Symbols Summary\n\n';
  summary += `Total functions extracted: ${sortedSymbols.length}\n\n`;
  summary += '## By Source\n\n';
  summary += `- crimsonland.exe: ${crimsonlandSyms.length} functions\n`;
  summary += `- grim.dll: ${grimSyms.length} functions\n\n`;
  summary += '## High-Signal Prefixes\n\n';
  summary += '| Prefix | Count |\n';
  summary += '|--------|-------|\n';
  for (const group of highSignalGroups) {
    summary += `| ${group.prefix} | ${group.count} |\n`;
  }
  summary += '\n## All Prefixes\n\n';
  summary += '| Prefix | Count |\n';
  summary += '|--------|-------|\n';
  for (const group of prefixGroups) {
    summary += `| ${group.prefix} | ${group.count} |\n`;
  }

  writeFileSync(join(docsRefDir, 'ref-summary.md'), summary);

  let indexContent = '# Porting Workbook\n\n';
  indexContent += 'This workbook tracks progress porting functions from the Crimsonland decompiled C reference to TypeScript.\n\n';
  indexContent += '## Subsystem Status\n\n';
  indexContent += '| Subsystem | Functions |\n';
  indexContent += '|-----------|-----------|\n';

  const subsystems = groupBySubsystem(sortedSymbols);
  
  for (const [name, funcs] of subsystems) {
    indexContent += `| [${name}](./${name}.md) | ${funcs.length} |\n`;
  }

  indexContent += '\n## High-Signal Prefixes\n\n';
  indexContent += '| Prefix | Count |\n';
  indexContent += '|--------|-------|\n';
  for (const group of highSignalGroups.slice(0, 20)) {
    indexContent += `| ${group.prefix} | ${group.count} |\n`;
  }
  indexContent += `\n*Total high-signal functions: ${highSignalGroups.reduce((sum, g) => sum + g.count, 0)}*\n\n`;
  indexContent += '> Note: High-signal excludes FUN_*, CRT_*, thunk_*, and unprefixed functions.\n';

  writeFileSync(join(docsPortingDir, 'index.md'), indexContent);

  for (const [name, funcs] of subsystems) {
    const sortedFuncs = funcs.sort((a, b) => a.name.localeCompare(b.name));
    
    let content = `# ${name.charAt(0).toUpperCase() + name.slice(1)} Subsystem\n\n`;
    content += `Functions: ${sortedFuncs.length}\n\n`;
    content += '## Function Checklist\n\n';
    
    for (const func of sortedFuncs) {
      content += `- [ ] \`${func.name}\` — TODO (ref: ${func.source}:${func.address})\n`;
    }
    
    writeFileSync(join(docsPortingDir, `${name}.md`), content);
  }

  let progressContent = `# TICKET-010 Progress\n\n`;
  progressContent += `Generated: ${new Date().toISOString()}\n\n`;
  progressContent += '## What was generated\n\n';
  progressContent += '### Tool script\n';
  progressContent += '- `src/tools/extract_ref_map.ts` — Extracts function metadata from ref/*.c files\n\n';
  progressContent += '### Reference docs (auto-generated)\n';
  progressContent += '- `docs/ref/ref-symbols.json` — Machine-readable symbol list\n';
  progressContent += '- `docs/ref/ref-summary.md` — Human-readable summary\n\n';
  progressContent += '### Porting workbook (auto-generated skeleton)\n';
  progressContent += '- `docs/porting/index.md` — Overview with subsystem links\n';
  
  for (const name of subsystems.keys()) {
    progressContent += `- \`docs/porting/${name}.md\` — ${name} subsystem checklist\n`;
  }
  
  progressContent += '\n## How to use this workbook\n\n';
  progressContent += '### Automatic updates\n';
  progressContent += 'Run `npm run tools:extract-ref` to regenerate all files from ref/*.c.\n';
  progressContent += '**Warning:** This overwrites manual edits in docs/porting/*.md.\n\n';
  progressContent += '### Manual workflow (recommended)\n';
  progressContent += '1. The `docs/porting/*.md` files are generated initially as a checklist template.\n';
  progressContent += '2. After porting a function, update its entry to mark complete and add notes:\n';
  progressContent += '   ```\n';
  progressContent += '   - [x] player_update — ported to src/sim/player.ts (notes: simplified physics)\n';
  progressContent += '   ```\n';
  progressContent += '3. If you need to regenerate (e.g., new ref files), preserve your manual edits or merge them.\n\n';
  progressContent += '## Subsystem breakdown\n\n';
  progressContent += '| Subsystem | Count |\n';
  progressContent += '|-----------|-------|\n';
  
  for (const [name, funcs] of subsystems) {
    progressContent += `| ${name} | ${funcs.length} |\n`;
  }
  
  progressContent += `\n**Total tracked functions:** ${sortedSymbols.length}\n`;
  
  writeFileSync(join(docsProgressDir, 'TICKET-010.md'), progressContent);

  console.log(`✓ Extracted ${sortedSymbols.length} functions`);
  console.log(`✓ Generated docs/ref/ref-symbols.json`);
  console.log(`✓ Generated docs/ref/ref-summary.md`);
  console.log(`✓ Generated docs/porting/index.md`);
  console.log(`✓ Generated ${subsystems.size} subsystem files in docs/porting/`);
  console.log(`✓ Generated docs/progress/TICKET-010.md`);
}

main();
