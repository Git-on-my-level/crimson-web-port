import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readReport } from '../../src/parity/report';

describe('parity_run', () => {
  it('ingests a vitest json override and writes a report', () => {
    const root = process.cwd();
    const runId = 'vitest-fixture-run';
    const runDir = join(root, '.codex-autorunner', 'parity', 'runs', runId);
    const reportPath = join(runDir, 'report.json');
    const fixturePath = join(root, 'tests', 'fixtures', 'vitest.fail.json');
    const tsxCli = join(root, 'node_modules', 'tsx', 'dist', 'cli.cjs');

    if (existsSync(runDir)) {
      rmSync(runDir, { recursive: true, force: true });
    }

    const result = spawnSync(
      process.execPath,
      [tsxCli, join(root, 'src', 'tools', 'parity_run.ts'), '--dry', '--vitest-json', fixturePath, '--run-id', runId],
      { cwd: root }
    );

    expect(result.status).toBe(1);
    const report = readReport(reportPath);
    const vitestFailures = report.findings.filter(
      finding => finding.status === 'fail' && (finding.tags ?? []).includes('vitest')
    );
    expect(vitestFailures).toHaveLength(2);
    expect(report.meta.runId).toBe(runId);
  });
});
