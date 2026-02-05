import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import readline from 'node:readline';

export type ApprovalPolicy = 'permissive' | 'strict' | 'manual';

export type TurnMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type TurnInput = {
  messages: TurnMessage[];
  metadata?: Record<string, unknown>;
};

export type TurnResult = {
  threadId: string;
  turnId: string;
  status: string;
};

type AppServerEnvelope = {
  id?: string;
  type: string;
  payload?: Record<string, unknown>;
};

type PendingRequest = {
  resolve: (value: AppServerEnvelope) => void;
  reject: (reason?: Error) => void;
};

type NotificationHandler = (message: AppServerEnvelope) => void;

type AppServerOptions = {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  onNotification: NotificationHandler;
};

class AppServerConnection {
  private proc: ChildProcessWithoutNullStreams;
  private pending = new Map<string, PendingRequest>();
  private nextId = 1;
  private closed = false;

  constructor(options: AppServerOptions) {
    this.proc = spawn(options.command, options.args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'pipe',
    });

    const rl = readline.createInterface({ input: this.proc.stdout });
    rl.on('line', (line) => {
      if (!line.trim()) {
        return;
      }
      let message: AppServerEnvelope;
      try {
        message = JSON.parse(line) as AppServerEnvelope;
      } catch (error) {
        this.rejectAll(new Error(`Failed to parse app-server output: ${line}`));
        return;
      }

      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        if (pending) {
          this.pending.delete(message.id);
          pending.resolve(message);
        }
        return;
      }

      options.onNotification(message);
    });

    this.proc.on('error', (error) => {
      this.rejectAll(error);
    });

    this.proc.on('exit', (code, signal) => {
      if (this.closed) {
        return;
      }
      this.closed = true;
      const reason = new Error(`app-server exited (${code ?? 'null'}:${signal ?? 'null'})`);
      this.rejectAll(reason);
    });
  }

  async initialize(): Promise<void> {
    const response = await this.request('initialize', { protocolVersion: 2 });
    if (response.type !== 'initialized') {
      throw new Error(`Expected initialized response, got ${response.type}`);
    }
  }

  async request(type: string, payload?: Record<string, unknown>): Promise<AppServerEnvelope> {
    const id = String(this.nextId++);
    const message: AppServerEnvelope = {
      id,
      type,
      payload,
    };
    return await new Promise<AppServerEnvelope>((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      this.proc.stdin.write(`${JSON.stringify(message)}\n`);
    });
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.proc.stdin.end();
    this.proc.kill();
  }

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}

type CodexAdapterOptions = {
  runId: string;
  runRoot?: string;
  approvalPolicy?: ApprovalPolicy;
  command?: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

export class CodexAdapter {
  private options: CodexAdapterOptions;
  private connection: AppServerConnection | null = null;
  private threadId: string | null = null;
  private notificationsStream: ReturnType<typeof createWriteStream> | null = null;
  private diffsStream: ReturnType<typeof createWriteStream> | null = null;

  constructor(options: CodexAdapterOptions) {
    this.options = options;
  }

  async runTurn(input: TurnInput): Promise<TurnResult> {
    const runDir = await this.ensureRunDir();
    this.openArtifactStreams(runDir);

    if (!this.connection) {
      this.connection = new AppServerConnection({
        command: this.options.command ?? 'codex',
        args: this.options.args ?? ['app-server'],
        cwd: this.options.cwd,
        env: this.options.env,
        onNotification: (message) => this.handleNotification(message),
      });
      await this.connection.initialize();
    }

    if (!this.threadId) {
      const threadResponse = await this.connection.request('thread/start', {
        metadata: {
          runId: this.options.runId,
        },
      });
      if (threadResponse.type !== 'thread/started') {
        throw new Error(`Expected thread/started response, got ${threadResponse.type}`);
      }
      const threadId = threadResponse.payload?.threadId;
      if (typeof threadId !== 'string') {
        throw new Error('thread/started missing threadId');
      }
      this.threadId = threadId;
    }

    const turnResponse = await this.connection.request('turn/start', {
      threadId: this.threadId,
      input,
      approvalPolicy: this.options.approvalPolicy ?? 'permissive',
    });

    if (turnResponse.type !== 'turn/complete') {
      throw new Error(`Expected turn/complete response, got ${turnResponse.type}`);
    }

    const turnId = turnResponse.payload?.turnId;
    const status = turnResponse.payload?.status;
    if (typeof turnId !== 'string' || typeof status !== 'string') {
      throw new Error('turn/complete missing turnId or status');
    }

    return {
      threadId: this.threadId,
      turnId,
      status,
    };
  }

  async shutdown(): Promise<void> {
    await this.connection?.close();
    this.connection = null;
    this.notificationsStream?.end();
    this.notificationsStream = null;
    this.diffsStream?.end();
    this.diffsStream = null;
  }

  private async ensureRunDir(): Promise<string> {
    const runRoot = this.options.runRoot ?? resolve(process.cwd(), '.codex-autorunner', 'runs');
    const runDir = resolve(runRoot, this.options.runId);
    await mkdir(runDir, { recursive: true });
    return runDir;
  }

  private openArtifactStreams(runDir: string): void {
    if (!this.notificationsStream) {
      this.notificationsStream = createWriteStream(resolve(runDir, 'notifications.jsonl'), { flags: 'a' });
    }
    if (!this.diffsStream) {
      this.diffsStream = createWriteStream(resolve(runDir, 'diffs.jsonl'), { flags: 'a' });
    }
  }

  private handleNotification(message: AppServerEnvelope): void {
    if (!this.notificationsStream || !this.diffsStream) {
      return;
    }
    if (message.type.includes('diff')) {
      this.diffsStream.write(`${JSON.stringify(message)}\n`);
      return;
    }
    if (message.type.includes('notification')) {
      this.notificationsStream.write(`${JSON.stringify(message)}\n`);
    }
  }
}

export async function runCodexTurn(options: CodexAdapterOptions, input: TurnInput): Promise<TurnResult> {
  const adapter = new CodexAdapter(options);
  try {
    return await adapter.runTurn(input);
  } finally {
    await adapter.shutdown();
  }
}

export async function resetRunArtifacts(runRoot: string, runId: string): Promise<void> {
  const runDir = resolve(runRoot, runId);
  await rm(runDir, { recursive: true, force: true });
  await mkdir(runDir, { recursive: true });
  await writeFile(resolve(runDir, 'notifications.jsonl'), '', 'utf8');
  await writeFile(resolve(runDir, 'diffs.jsonl'), '', 'utf8');
}
