import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readReport, writeReport, type ParityReport } from '../../src/parity/report';

describe('parity report schema', () => {
  it('round-trips a report through disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-report-'));
    const filePath = join(dir, 'report.json');

    const report: ParityReport = {
      schemaVersion: 1,
      meta: {
        runId: 'run-001',
        createdAt: new Date('2026-02-05T12:00:00.000Z').toISOString(),
        baselineId: 'baseline-01',
        scenario: 'survival-smoke',
        toolVersion: '0.1.0',
        commit: 'abc123',
        durationMs: 1234,
        notes: 'sample run'
      },
      findings: [
        {
          id: 'finding-1',
          status: 'pass',
          message: 'All good',
          tags: ['sim', 'sanity']
        }
      ]
    };

    writeReport(filePath, report);
    const reloaded = readReport(filePath);

    expect(reloaded).toEqual(report);

    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a malformed finding', () => {
    const dir = mkdtempSync(join(tmpdir(), 'parity-report-'));
    const filePath = join(dir, 'report.json');

    const report = {
      schemaVersion: 1,
      meta: {
        runId: 'run-002',
        createdAt: new Date('2026-02-05T12:00:00.000Z').toISOString()
      },
      findings: [
        {
          status: 'fail',
          message: 'Missing id'
        }
      ]
    } as ParityReport;

    expect(() => writeReport(filePath, report)).toThrow('findings[0].id');

    rmSync(dir, { recursive: true, force: true });
  });
});
