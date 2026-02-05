import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { runRefTestInventory } from '../src/parity/ref_test_inventory';

describe('ref_test_inventory', () => {
  it('produces deterministic inventory and findings', () => {
    const root = process.cwd();
    const fixtureRoot = join(root, 'tests', 'fixtures', 'ref_test_inventory');
    const inventory = runRefTestInventory({
      rootDir: fixtureRoot,
      refTestsDir: 'ref/crimson-master/tests',
      tsTestsDir: 'tests/ref_parity',
      mapPath: '.codex-autorunner/parity/ref_test_port_map.json',
      highPriorityTests: ['test_beta.py'],
      persist: false,
    });

    expect(inventory.pyTests).toHaveLength(2);
    expect(inventory.tsTests).toHaveLength(1);
    expect(inventory.entries.map(entry => entry.py)).toEqual([
      'ref/crimson-master/tests/test_alpha.py',
      'ref/crimson-master/tests/test_beta.py',
    ]);

    const highPriorityFinding = inventory.findings.find(finding => finding.message.includes('High priority'));
    expect(highPriorityFinding?.status).toBe('skip');

    const missingTagsFinding = inventory.findings.find(finding => finding.message.includes('missing parity tags'));
    expect(missingTagsFinding?.status).toBe('fail');

    const secondRun = runRefTestInventory({
      rootDir: fixtureRoot,
      refTestsDir: 'ref/crimson-master/tests',
      tsTestsDir: 'tests/ref_parity',
      mapPath: '.codex-autorunner/parity/ref_test_port_map.json',
      highPriorityTests: ['test_beta.py'],
      persist: false,
    });

    expect(secondRun.entries).toEqual(inventory.entries);
    expect(secondRun.findings).toEqual(inventory.findings);
  });
});
