import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import type { ParityFinding } from './report';

type RefTestPortStatus = 'ported' | 'skipped' | 'todo';

export type RefTestPortEntry = {
  py: string;
  ts: string;
  status: RefTestPortStatus;
};

export type RefTestInventoryOptions = {
  rootDir?: string;
  refTestsDir?: string;
  tsTestsDir?: string;
  mapPath?: string;
  highPriorityTests?: string[];
  persist?: boolean;
};

export type RefTestInventory = {
  entries: RefTestPortEntry[];
  findings: ParityFinding[];
  pyTests: string[];
  tsTests: string[];
  mapUpdated: boolean;
};

export const DEFAULT_HIGH_PRIORITY = [
  'test_freeze_bonus.py',
  'test_nuke_bonus.py',
  'test_energizer_bonus.py',
  'test_bonus_pistol_rules.py',
  'test_survival_director.py',
];

const TAG_PATTERN = /@parity-tags:\s*([^\n]+)/i;

function listFiles(rootDir: string, targetPath: string, predicate: (filePath: string) => boolean): string[] {
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

    if (predicate(current)) {
      results.push(current);
    }
  }

  return results.sort();
}

function listPythonTests(rootDir: string, refTestsDir: string): string[] {
  return listFiles(rootDir, refTestsDir, filePath => basename(filePath).startsWith('test_') && filePath.endsWith('.py')).map(
    filePath => relative(rootDir, filePath)
  );
}

function listTsParityTests(rootDir: string, tsTestsDir: string): string[] {
  return listFiles(rootDir, tsTestsDir, filePath => /\.(test|spec)\.ts$/.test(filePath)).map(filePath =>
    relative(rootDir, filePath)
  );
}

function normalizeEntry(entry: unknown): RefTestPortEntry | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const candidate = entry as Record<string, unknown>;
  const py = typeof candidate.py === 'string' ? candidate.py : null;
  const ts = typeof candidate.ts === 'string' ? candidate.ts : '';
  const status = candidate.status === 'ported' || candidate.status === 'skipped' || candidate.status === 'todo' ? candidate.status : null;
  if (!py || !status) {
    return null;
  }
  return { py: py.replace(/^\.\//, ''), ts: ts.replace(/^\.\//, ''), status };
}

function loadMap(mapPath: string): RefTestPortEntry[] {
  if (!existsSync(mapPath)) {
    return [];
  }
  try {
    const raw = readFileSync(mapPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeEntry).filter((entry): entry is RefTestPortEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function inferTsPath(pyTest: string, tsTestsSet: Set<string>, tsTestsDir: string): string {
  const base = basename(pyTest, '.py');
  const candidate = join(tsTestsDir, `${base}.test.ts`);
  if (tsTestsSet.has(candidate)) {
    return candidate;
  }
  return '';
}

function extractTagsFromFile(filePath: string): string[] | null {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(TAG_PATTERN);
  if (!match) {
    return null;
  }
  const tags = match[1]
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  return tags.length > 0 ? tags : null;
}

function makeFindingId(typeKey: string, ref: string): string {
  const hash = createHash('sha1').update(`${typeKey}:${ref}`).digest('hex').slice(0, 12);
  return `ref-test:${typeKey}:${hash}`;
}

export function runRefTestInventory(options: RefTestInventoryOptions = {}): RefTestInventory {
  const rootDir = options.rootDir ? resolve(options.rootDir) : process.cwd();
  const refTestsDir = options.refTestsDir ?? 'ref/crimson-master/tests';
  const tsTestsDir = options.tsTestsDir ?? 'tests/ref_parity';
  const mapPath = options.mapPath ?? join('.codex-autorunner', 'parity', 'ref_test_port_map.json');
  const persist = options.persist ?? false;
  const highPriority = new Set(options.highPriorityTests ?? DEFAULT_HIGH_PRIORITY);

  const pyTests = listPythonTests(rootDir, refTestsDir);
  const tsTests = listTsParityTests(rootDir, tsTestsDir);
  const tsTestsSet = new Set(tsTests);

  const existingEntries = loadMap(join(rootDir, mapPath));
  const entryByPy = new Map(existingEntries.map(entry => [entry.py, entry]));

  const entries: RefTestPortEntry[] = pyTests.map(pyTest => {
    const existing = entryByPy.get(pyTest);
    if (existing) {
      const ts = existing.ts || inferTsPath(pyTest, tsTestsSet, tsTestsDir);
      return { py: pyTest, ts, status: existing.status };
    }
    const inferredTs = inferTsPath(pyTest, tsTestsSet, tsTestsDir);
    const status: RefTestPortStatus = inferredTs ? 'ported' : 'todo';
    return { py: pyTest, ts: inferredTs, status };
  });

  entries.sort((a, b) => a.py.localeCompare(b.py));

  let mapUpdated = false;
  if (persist) {
    const payload = `${JSON.stringify(entries, null, 2)}\n`;
    const fullMapPath = join(rootDir, mapPath);
    const existingPayload = existsSync(fullMapPath) ? readFileSync(fullMapPath, 'utf-8') : '';
    if (payload !== existingPayload) {
      ensureDir(fullMapPath);
      writeFileSync(fullMapPath, payload, 'utf-8');
      mapUpdated = true;
    }
  }

  const findings: ParityFinding[] = [];

  for (const entry of entries) {
    const pyBase = basename(entry.py);
    if (entry.status === 'todo' && highPriority.has(pyBase)) {
      findings.push({
        id: makeFindingId('todo', entry.py),
        status: 'skip',
        message: `High priority ref test still TODO: ${entry.py}`,
        tags: ['ref-test', 'ref-test:todo', 'priority:high'],
      });
    }

    if (entry.status === 'ported' && entry.ts) {
      const tsPath = join(rootDir, entry.ts);
      if (!existsSync(tsPath)) {
        findings.push({
          id: makeFindingId('missing-ts', entry.ts),
          status: 'fail',
          message: `Ported ref test missing parity test file: ${entry.ts}`,
          tags: ['ref-test', 'ref-test:ported', 'ref-test:missing-file'],
        });
        continue;
      }
      const tags = extractTagsFromFile(tsPath);
      if (!tags) {
        findings.push({
          id: makeFindingId('missing-tags', entry.ts),
          status: 'fail',
          message: `Ported ref test missing parity tags: ${entry.ts}`,
          tags: ['ref-test', 'ref-test:ported', 'ref-test:missing-tags'],
        });
      }
    }
  }

  findings.sort((a, b) => a.id.localeCompare(b.id));

  return {
    entries,
    findings,
    pyTests,
    tsTests,
    mapUpdated,
  };
}
