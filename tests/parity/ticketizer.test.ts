import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ParityReport } from '../../src/parity/report';
import { writeParityTickets } from '../../src/parity/ticketizer';

const fixturePath = join(process.cwd(), 'tests', 'fixtures', 'parity_report.ticketizer.json');

function loadFixture(): ParityReport {
  const raw = readFileSync(fixturePath, 'utf-8');
  return JSON.parse(raw) as ParityReport;
}

describe('ticketizer', () => {
  it('writes stable, routed parity tickets', () => {
    const report = loadFixture();
    const outputDir = mkdtempSync(join(tmpdir(), 'parity-ticketizer-'));

    try {
      writeParityTickets(report, { outputDir });

      const files = readdirSync(outputDir).sort();
      expect(files).toHaveLength(3);
      expect(files).toEqual([
        'PARITY-probe:bonus-nuke.md',
        'PARITY-probe:ui-wiring.md',
        'PARITY-vitest:weapons:reload.md',
      ]);

      const contentsById = new Map<string, string>();
      files.forEach(file => {
        const content = readFileSync(join(outputDir, file), 'utf-8');
        const id = file.replace(/^PARITY-/, '').replace(/\.md$/, '');
        contentsById.set(id, content);
      });

      expect(contentsById.get('probe:ui-wiring')).toContain('owner: codex');
      expect(contentsById.get('vitest:weapons:reload')).toContain('owner: codex');
      expect(contentsById.get('probe:bonus-nuke')).toContain('owner: opencode');

      const before = files.map(file => readFileSync(join(outputDir, file), 'utf-8'));
      writeParityTickets(report, { outputDir });
      const after = files.map(file => readFileSync(join(outputDir, file), 'utf-8'));
      expect(after).toEqual(before);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
