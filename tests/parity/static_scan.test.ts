import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { runStaticScan } from '../../src/parity/static_scan';

describe('static_scan', () => {
  it('detects doc markers, src markers, and wiring stubs with stable ids', () => {
    const root = process.cwd();
    const fixtureRoot = join(root, 'tests', 'fixtures', 'static_scan');
    const findings = runStaticScan({
      rootDir: fixtureRoot,
      portingDocsDir: 'docs/porting',
      sourceDir: 'src',
    });

    expect(findings.some(finding => (finding.tags ?? []).includes('static/docs'))).toBe(true);
    expect(findings.some(finding => (finding.tags ?? []).includes('static/src'))).toBe(true);
    expect(findings.some(finding => (finding.tags ?? []).includes('static/wiring'))).toBe(true);

    const firstRunIds = findings.map(finding => finding.id).sort();
    const secondRun = runStaticScan({
      rootDir: fixtureRoot,
      portingDocsDir: 'docs/porting',
      sourceDir: 'src',
    });
    const secondRunIds = secondRun.map(finding => finding.id).sort();

    expect(secondRunIds).toEqual(firstRunIds);
  });
});
