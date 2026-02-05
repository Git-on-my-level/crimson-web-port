import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readReport } from '../../src/parity/report';
import { writeParityTickets } from '../../src/parity/ticketizer';

function runParity(params: {
  runId: string;
  fixtureRoot: string;
  vitestJson: string;
}): { reportPath: string; exitCode: number } {
  const root = process.cwd();
  const runDir = join(root, '.codex-autorunner', 'parity', 'runs', params.runId);
  const reportPath = join(runDir, 'report.json');
  const tsxCli = join(root, 'node_modules', 'tsx', 'dist', 'cli.cjs');
  const parityRun = join(root, 'src', 'tools', 'parity_run.ts');

  if (existsSync(runDir)) {
    rmSync(runDir, { recursive: true, force: true });
  }

  const result = spawnSync(
    process.execPath,
    [
      tsxCli,
      parityRun,
      '--dry',
      '--vitest-json',
      params.vitestJson,
      '--run-id',
      params.runId,
      '--root',
      params.fixtureRoot,
      '--no-ref-tests',
    ],
    { cwd: root }
  );

  return { reportPath, exitCode: result.status ?? 1 };
}

function applyMockFix(targetPath: string): () => void {
  const original = readFileSync(targetPath, 'utf-8');
  const patched = original.replace('TODO(parity)', 'DONE(parity)');
  if (patched === original) {
    throw new Error('Expected mock fix to change fixture content.');
  }
  writeFileSync(targetPath, patched, 'utf-8');
  return () => {
    writeFileSync(targetPath, original, 'utf-8');
  };
}

function countFailing(reportPath: string): number {
  const report = readReport(reportPath);
  return report.findings.filter(finding => finding.status === 'fail').length;
}

describe('parity e2e', () => {
  it('runs scan, ticketize, mock fix, and rescan', () => {
    const root = process.cwd();
    const fixtureRoot = join(root, 'tests', 'fixtures', 'parity_e2e');
    const vitestJson = join(fixtureRoot, 'vitest.fail.json');
    const runId = `e2e-mocked-${Date.now()}`;

    const firstRun = runParity({ runId, fixtureRoot, vitestJson });
    expect(firstRun.exitCode).toBe(1);

    const initialFailures = countFailing(firstRun.reportPath);
    expect(initialFailures).toBeGreaterThan(0);

    const ticketsDir = join(root, '.codex-autorunner', 'tickets', 'auto', 'e2e', runId);
    if (existsSync(ticketsDir)) {
      rmSync(ticketsDir, { recursive: true, force: true });
    }
    const tickets = writeParityTickets(readReport(firstRun.reportPath), { outputDir: ticketsDir });
    expect(tickets.length).toBeGreaterThan(0);
    tickets.forEach(ticket => {
      expect(ticket.path.startsWith(join(root, '.codex-autorunner'))).toBe(true);
    });

    const targetFile = join(fixtureRoot, 'src', 'feature.ts');
    const restore = applyMockFix(targetFile);

    try {
      const secondRunId = `${runId}-after`;
      const secondRun = runParity({ runId: secondRunId, fixtureRoot, vitestJson });
      expect(secondRun.exitCode).toBe(1);

      const secondFailures = countFailing(secondRun.reportPath);
      expect(secondFailures).toBeLessThan(initialFailures);
    } finally {
      restore();
    }
  });
});
