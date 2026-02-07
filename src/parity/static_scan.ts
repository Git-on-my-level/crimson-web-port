import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import type { ParityFinding } from './report';
import { runRefTestInventory, type RefTestInventoryOptions } from './ref_test_inventory';

type ScanCategory = 'docs' | 'src' | 'wiring';

export type WiringStubCheck = {
  id: string;
  description: string;
  paths: string[];
  pattern: RegExp;
  tags?: string[];
};

export type StaticScanOptions = {
  rootDir?: string;
  portingDocsDir?: string;
  sourceDir?: string;
  wiringStubs?: WiringStubCheck[];
  includeRefTests?: boolean;
  refTestInventory?: RefTestInventoryOptions;
  persistRefTestMap?: boolean;
};

type MarkerRule = {
  typeKey: string;
  pattern: RegExp;
  status: ParityFinding['status'];
  category: ScanCategory;
  messagePrefix: string;
};

const EXCLUDED_SCAN_FILES = new Set(['src/parity/static_scan.ts']);

const DOC_MARKERS: MarkerRule[] = [
  { typeKey: 'docs:TODO', pattern: /\bTODO\b/, status: 'skip', category: 'docs', messagePrefix: 'Porting TODO' },
  { typeKey: 'docs:UNPORTED', pattern: /\bUNPORTED\b/, status: 'skip', category: 'docs', messagePrefix: 'Porting UNPORTED' },
  { typeKey: 'docs:PARTIAL', pattern: /\bPARTIAL\b/, status: 'skip', category: 'docs', messagePrefix: 'Porting PARTIAL' },
  { typeKey: 'docs:STUB', pattern: /\bSTUB\b/, status: 'skip', category: 'docs', messagePrefix: 'Porting STUB' },
];

const SRC_MARKERS: MarkerRule[] = [
  {
    typeKey: 'src:TODO(parity)',
    pattern: /TODO\(parity\)/,
    status: 'fail',
    category: 'src',
    messagePrefix: 'Parity TODO',
  },
  {
    typeKey: 'src:PARITY',
    pattern: /PARITY:/,
    status: 'fail',
    category: 'src',
    messagePrefix: 'Parity marker',
  },
  {
    typeKey: 'src:throw-TODO',
    pattern: /throw\s+new\s+Error\(\"TODO\"\)/,
    status: 'fail',
    category: 'src',
    messagePrefix: 'Parity TODO throw',
  },
];

export const DEFAULT_WIRING_STUBS: WiringStubCheck[] = [
  {
    id: 'playSfx-routing',
    description: 'Sim emits playSfx but adapter does not route it',
    paths: ['src'],
    pattern: /WIRING_STUB:.*playSfx/,
    tags: ['wiring', 'audio'],
  },
  {
    id: 'reload-input-unconsumed',
    description: 'Reload input exists but never consumed',
    paths: ['src', 'docs'],
    pattern: /WIRING_STUB:.*reload input/,
    tags: ['wiring', 'input'],
  },
];

function listFiles(rootDir: string, targetPath: string, extensions?: string[]): string[] {
  const resolved = resolve(rootDir, targetPath);
  const results: string[] = [];
  const stack: string[] = [resolved];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    let stats: ReturnType<typeof statSync>;
    try {
      stats = statSync(current);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        stack.push(join(current, entry.name));
      }
      continue;
    }

    if (!stats.isFile()) {
      continue;
    }

    if (extensions && extensions.length > 0) {
      const matched = extensions.some(ext => current.endsWith(ext));
      if (!matched) {
        continue;
      }
    }

    results.push(current);
  }

  return results.sort();
}

function makeFindingId(typeKey: string, relPath: string, line: number): string {
  const hash = createHash('sha1').update(`${relPath}:${line}:${typeKey}`).digest('hex').slice(0, 12);
  return `static:${typeKey}:${hash}`;
}

function buildFinding(
  rule: MarkerRule,
  relPath: string,
  line: number,
  text: string,
  extraTags?: string[]
): ParityFinding {
  const baseTags = [`static/${rule.category}`];
  const tags = extraTags ? [...baseTags, ...extraTags] : baseTags;
  const message = `${rule.messagePrefix}: ${relPath}:${line}`;
  return {
    id: makeFindingId(rule.typeKey, relPath, line),
    status: rule.status,
    message,
    details: text.trim(),
    tags,
  };
}

function scanFileForMarkers(filePath: string, rootDir: string, rules: MarkerRule[]): ParityFinding[] {
  const relPath = relative(rootDir, filePath);
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const findings: ParityFinding[] = [];

  lines.forEach((lineText, index) => {
    rules.forEach(rule => {
      if (rule.pattern.test(lineText)) {
        findings.push(buildFinding(rule, relPath, index + 1, lineText));
      }
    });
  });

  return findings;
}

function scanDocs(rootDir: string, docsDir: string): ParityFinding[] {
  const files = listFiles(rootDir, docsDir, ['.md']);
  return files.flatMap(filePath => scanFileForMarkers(filePath, rootDir, DOC_MARKERS));
}

function scanSrc(rootDir: string, sourceDir: string): ParityFinding[] {
  const files = listFiles(rootDir, sourceDir, ['.ts', '.tsx', '.js', '.jsx']).filter(
    filePath => !EXCLUDED_SCAN_FILES.has(relative(rootDir, filePath)),
  );
  return files.flatMap(filePath => scanFileForMarkers(filePath, rootDir, SRC_MARKERS));
}

function scanWiringStubs(rootDir: string, wiringStubs: WiringStubCheck[]): ParityFinding[] {
  const findings: ParityFinding[] = [];

  wiringStubs.forEach(stub => {
    const paths = stub.paths.length > 0 ? stub.paths : ['src'];
    const files = paths.flatMap(path => listFiles(rootDir, path));
    const uniqueFiles = Array.from(new Set(files)).sort();

    uniqueFiles.forEach(filePath => {
      const relPath = relative(rootDir, filePath);
      if (EXCLUDED_SCAN_FILES.has(relPath)) {
        return;
      }
      const raw = readFileSync(filePath, 'utf-8');
      const lines = raw.split(/\r?\n/);

      lines.forEach((lineText, index) => {
        if (stub.pattern.test(lineText)) {
          const rule: MarkerRule = {
            typeKey: `wiring:${stub.id}`,
            pattern: stub.pattern,
            status: 'fail',
            category: 'wiring',
            messagePrefix: `Wiring stub (${stub.description})`,
          };
          findings.push(buildFinding(rule, relPath, index + 1, lineText, stub.tags));
        }
      });
    });
  });

  return findings;
}

export function runStaticScan(options: StaticScanOptions = {}): ParityFinding[] {
  const rootDir = options.rootDir ? resolve(options.rootDir) : process.cwd();
  const portingDocsDir = options.portingDocsDir ?? 'docs/porting';
  const sourceDir = options.sourceDir ?? 'src';
  const wiringStubs = options.wiringStubs ?? DEFAULT_WIRING_STUBS;
  const includeRefTests = options.includeRefTests ?? true;
  const persistRefTestMap = options.persistRefTestMap ?? options.rootDir === undefined;

  const findings = [
    ...scanDocs(rootDir, portingDocsDir),
    ...scanSrc(rootDir, sourceDir),
    ...scanWiringStubs(rootDir, wiringStubs),
  ];

  if (includeRefTests) {
    const refFindings = runRefTestInventory({
      rootDir,
      persist: persistRefTestMap,
      ...(options.refTestInventory ?? {}),
    }).findings;
    findings.push(...refFindings);
  }

  return findings.sort((a, b) => a.id.localeCompare(b.id));
}
