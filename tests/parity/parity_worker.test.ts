import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readReport } from '../../src/parity/report';

describe('parity_worker', () => {
  const root = process.cwd();
  const autoDir = join(root, '.codex-autorunner', 'tickets', 'auto', 'worker-test');

  function cleanup(): void {
    if (existsSync(autoDir)) {
      rmSync(autoDir, { recursive: true, force: true });
    }
  }

  function setupMockTickets(): void {
    cleanup();
    
    const ticket1Path = join(autoDir, 'PARITY-vitest:tests/test1.ts:test1 fails.md');
    const ticket2Path = join(autoDir, 'PARITY-vitest:tests/test2.ts:test2 fails.md');
    
    mkdirSync(dirname(ticket1Path), { recursive: true });
    mkdirSync(dirname(ticket2Path), { recursive: true });
    
    const ticket1Content = `---
title: "PARITY-vitest:tests/test1.ts:test1 fails"
owner: opencode
done: false
---

## Goal
Resolve this parity finding so parity run no longer reports a failure.

## Finding
- id: \`vitest:tests/test1.ts:test1 fails\`
- status: \`fail\`
- message: "test1 fails"
- tags: vitest, high
- run: \`test-run\`
- created: \`2024-01-01T00:00:00.000Z\`

## Acceptance
- \`npx vitest run --testNamePattern "test1 fails"\` completes without this failure.
`;

    const ticket2Content = `---
title: "PARITY-vitest:tests/test2.ts:test2 fails"
owner: opencode
done: false
---

## Goal
Resolve this parity finding so the parity run no longer reports a failure.

## Finding
- id: \`vitest:tests/test2.ts:test2 fails\`
- status: \`fail\`
- message: "test2 fails"
- tags: vitest, critical
- run: \`test-run\`
- created: \`2024-01-02T00:00:00.000Z\`

## Acceptance
- \`npx vitest run --testNamePattern "test2 fails"\` completes without this failure.
`;

    writeFileSync(ticket1Path, ticket1Content, 'utf-8');
    writeFileSync(ticket2Path, ticket2Content, 'utf-8');
  }

  function setupMockReport(): void {
    const reportPath = join(root, '.codex-autorunner', 'parity', 'runs', 'test-run', 'report.json');
    const latestPath = join(root, '.codex-autorunner', 'parity', 'latest.json');

    const reportDir = join(root, '.codex-autorunner', 'parity', 'runs', 'test-run');
    if (existsSync(reportDir)) {
      rmSync(reportDir, { recursive: true, force: true });
    }

    mkdirSync(reportDir, { recursive: true });

    const report = {
      schemaVersion: 1,
      meta: {
        runId: 'test-run',
        createdAt: '2024-01-01T00:00:00.000Z',
        durationMs: 100,
      },
      findings: [
        {
          id: 'vitest:tests/test1.ts:test1 fails',
          status: 'fail',
          message: 'test1 fails',
          tags: ['vitest', 'high'],
        },
        {
          id: 'vitest:tests/test2.ts:test2 fails',
          status: 'fail',
          message: 'test2 fails',
          tags: ['vitest', 'critical'],
        },
      ],
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
    writeFileSync(latestPath, JSON.stringify({ runId: 'test-run' }, null, 2) + '\n', 'utf-8');
  }

  it('can parse and find tickets with different severity tags', () => {
    setupMockTickets();

    const reportPath = join(root, '.codex-autorunner', 'parity', 'runs', 'test-run', 'report.json');
    
    setupMockReport();
    
    const report = readReport(reportPath);
    const findings = report.findings.filter(f => f.status === 'fail');
    
    expect(findings).toHaveLength(2);
    
    const criticalFinding = findings.find(f => f.tags?.includes('critical'));
    const highFinding = findings.find(f => f.tags?.includes('high'));
    
    expect(criticalFinding).toBeDefined();
    expect(highFinding).toBeDefined();

    cleanup();
  });

  it('returns empty result when no latest report exists', async () => {
    cleanup();

    const { runParityWorker } = await import('../../src/tools/parity_worker');

    const latestPath = join(root, '.codex-autorunner', 'parity', 'latest.json');
    if (existsSync(latestPath)) {
      rmSync(latestPath, { recursive: true, force: true });
    }

    const result = await runParityWorker({
      oneStep: true,
      threshold: 1.0,
      dry: true,
    });

    expect(result.ticketsProcessed).toBe(0);
    expect(result.ticketsSucceeded).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.criticalFindings).toBe(0);
    expect(result.thresholdMet).toBe(false);
  });
});
