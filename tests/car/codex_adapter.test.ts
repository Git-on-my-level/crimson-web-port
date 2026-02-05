import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CodexAdapter, resetRunArtifacts } from '../../src/car/codex_adapter';

const runRoot = resolve(process.cwd(), '.codex-autorunner', 'runs');

async function readLines(path: string): Promise<string[]> {
  const contents = await readFile(path, 'utf8');
  return contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

describe('CodexAdapter', () => {
  it('runs a turn through app-server and captures artifacts', async () => {
    const runId = `test-run-${Date.now()}`;
    await resetRunArtifacts(runRoot, runId);

    const adapter = new CodexAdapter({
      runId,
      runRoot,
      command: 'node',
      args: [resolve(process.cwd(), 'tests', 'fixtures', 'fake_codex_app_server.mjs')],
    });

    const result = await adapter.runTurn({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Test turn.' },
      ],
      metadata: { ticket: 'TICKET-670' },
    });

    await adapter.shutdown();

    expect(result.threadId).toBe('thread-test-1');
    expect(result.turnId).toBe('turn-test-1');
    expect(result.status).toBe('completed');

    const notificationsPath = resolve(runRoot, runId, 'notifications.jsonl');
    const diffsPath = resolve(runRoot, runId, 'diffs.jsonl');

    const notifications = await readLines(notificationsPath);
    const diffs = await readLines(diffsPath);

    expect(notifications.length).toBeGreaterThan(0);
    expect(diffs.length).toBeGreaterThan(0);

    const notification = JSON.parse(notifications[0]) as { type: string };
    const diff = JSON.parse(diffs[0]) as { type: string };

    expect(notification.type).toContain('notification');
    expect(diff.type).toContain('diff');
  });
});
