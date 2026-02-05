import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import type { ParityFinding, ParityReport } from './report';

type TicketOwner = 'codex' | 'opencode';

type TicketizerOptions = {
  rootDir?: string;
  outputDir?: string;
};

type TicketWriteResult = {
  id: string;
  path: string;
  owner: TicketOwner;
  changed: boolean;
};

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function resolveOutputDir(options: TicketizerOptions): string {
  const rootDir = options.rootDir ? resolve(options.rootDir) : process.cwd();
  if (!options.outputDir) {
    return resolve(rootDir, '.codex-autorunner', 'tickets', 'auto');
  }
  if (isAbsolute(options.outputDir)) {
    return options.outputDir;
  }
  return resolve(rootDir, options.outputDir);
}

function hasSystemTag(tags: string[]): boolean {
  return tags.some(tag => tag === 'tooling' || tag.startsWith('tooling/') || tag === 'parity-system' || tag.startsWith('parity-system/'));
}

function routeOwner(finding: ParityFinding): TicketOwner {
  const tags = finding.tags ?? [];
  return hasSystemTag(tags) ? 'codex' : 'opencode';
}

function describeFailingProbe(finding: ParityFinding): string {
  const tags = finding.tags ?? [];
  if (tags.includes('vitest') || finding.id.startsWith('vitest:')) {
    return `Vitest: ${finding.message || finding.id}`;
  }
  const probeTag = tags.find(tag => tag.startsWith('probe:'));
  if (probeTag) {
    return `Probe ${probeTag.replace('probe:', '')}`;
  }
  if (tags.some(tag => tag.startsWith('static/'))) {
    return `Static scan: ${finding.message || finding.id}`;
  }
  if (tags.some(tag => tag.startsWith('ref-test'))) {
    return `Ref test inventory: ${finding.message || finding.id}`;
  }
  return `Parity finding: ${finding.id}`;
}

function buildReproCommand(report: ParityReport, finding: ParityFinding): string {
  const runId = report.meta.runId;
  const tags = finding.tags ?? [];
  if (tags.includes('vitest') || finding.id.startsWith('vitest:')) {
    const title = (finding.message || finding.id).replace(/"/g, '\\"');
    return `npx vitest run --testNamePattern "${title}"`;
  }
  if (tags.includes('dynamic') || tags.some(tag => tag.startsWith('probe:')) || finding.id.startsWith('probe:')) {
    return `npx tsx src/tools/parity_run.ts --dry --run-id ${runId}`;
  }
  return `npx tsx src/tools/parity_run.ts --dry --run-id ${runId}`;
}

function formatTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) {
    return 'none';
  }
  return [...tags].sort().join(', ');
}

function formatOptionalJson(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildTicketMarkdown(report: ParityReport, finding: ParityFinding, owner: TicketOwner): string {
  const titleText = finding.message && finding.message.trim().length > 0 ? finding.message.trim() : finding.id;
  const title = `PARITY-${finding.id}: ${titleText}`;
  const reproductionCommand = buildReproCommand(report, finding);
  const lines: string[] = [];

  lines.push('---');
  lines.push(`title: ${JSON.stringify(title)}`);
  lines.push(`owner: ${owner}`);
  lines.push('done: false');
  lines.push('---');
  lines.push('');
  lines.push('## Goal');
  lines.push('Resolve this parity finding so the parity run no longer reports a failure.');
  lines.push('');
  lines.push('## Failing Probe/Test');
  lines.push(`- ${describeFailingProbe(finding)}`);
  lines.push('');
  lines.push('## Finding');
  lines.push(`- id: \`${finding.id}\``);
  lines.push(`- status: \`${finding.status}\``);
  if (finding.message && finding.message.trim().length > 0) {
    lines.push(`- message: ${JSON.stringify(finding.message)}`);
  }
  lines.push(`- tags: ${formatTags(finding.tags)}`);
  lines.push(`- run: \`${report.meta.runId}\``);
  lines.push(`- created: \`${report.meta.createdAt}\``);
  lines.push('');
  lines.push('## Reproduction');
  lines.push('```bash');
  lines.push(reproductionCommand);
  lines.push('```');

  if (finding.details && finding.details.trim().length > 0) {
    lines.push('');
    lines.push('## Details');
    lines.push('```');
    lines.push(finding.details.trim());
    lines.push('```');
  }

  const expectedPayload = formatOptionalJson(finding.expected);
  if (expectedPayload) {
    lines.push('');
    lines.push('## Expected');
    lines.push('```json');
    lines.push(expectedPayload.trimEnd());
    lines.push('```');
  }

  const actualPayload = formatOptionalJson(finding.actual);
  if (actualPayload) {
    lines.push('');
    lines.push('## Actual');
    lines.push('```json');
    lines.push(actualPayload.trimEnd());
    lines.push('```');
  }

  lines.push('');
  lines.push('## Acceptance');
  lines.push(`- \`${reproductionCommand}\` completes without this failure.`);
  lines.push('- Add or update parity coverage for this behavior if it is missing.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export function writeParityTickets(report: ParityReport, options: TicketizerOptions = {}): TicketWriteResult[] {
  const outputDir = resolveOutputDir(options);
  const findings = report.findings.filter(finding => finding.status === 'fail').sort((a, b) => a.id.localeCompare(b.id));
  const results: TicketWriteResult[] = [];

  for (const finding of findings) {
    const owner = routeOwner(finding);
    const filePath = join(outputDir, `PARITY-${finding.id}.md`);
    const content = buildTicketMarkdown(report, finding, owner);
    const existing = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
    const changed = existing !== content;

    if (changed) {
      ensureDir(filePath);
      writeFileSync(filePath, content, 'utf-8');
    }

    results.push({ id: finding.id, path: filePath, owner, changed });
  }

  return results;
}
