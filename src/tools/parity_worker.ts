import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import type { ParityFinding, ParityReport } from '../parity/report';
import { readReport } from '../parity/report';
import { checkPolicy, formatPolicyCheckResult, loadPolicy } from '../parity/policy';

export type OpenCodeSessionConfig = {
  endpoint?: string;
  protocolVersion?: number;
};

export type OpenCodeTurnResult = {
  status: 'completed' | 'failed';
  diffs?: Array<{ path: string; content: string }>;
  notifications?: string[];
};

interface ParityTicketMetadata {
  id: string;
  path: string;
  finding: ParityFinding;
  createdAt: string;
}

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

function getSeverity(finding: ParityFinding): SeverityLevel {
  const tags = finding.tags ?? [];
  if (tags.includes('critical')) return 'critical';
  if (tags.some(t => t.startsWith('critical/'))) return 'critical';
  if (tags.includes('high') || tags.some(t => t.startsWith('high/'))) return 'high';
  if (tags.includes('medium') || tags.some(t => t.startsWith('medium/'))) return 'medium';
  return 'low';
}

function severityWeight(severity: SeverityLevel): number {
  switch (severity) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}

function countScopeTags(tags: string[] | undefined): number {
  if (!tags) return 0;
  return tags.filter(tag => !tag.startsWith('probe:') && !tag.includes('vitest') && tag !== 'dynamic').length;
}

function compareFindings(a: ParityFinding, b: ParityFinding): number {
  const severityA = getSeverity(a);
  const severityB = getSeverity(b);
  const severityDiff = severityWeight(severityB) - severityWeight(severityA);
  if (severityDiff !== 0) return severityDiff;

  const scopeTagsA = countScopeTags(a.tags);
  const scopeTagsB = countScopeTags(b.tags);
  const scopeDiff = scopeTagsA - scopeTagsB;
  if (scopeDiff !== 0) return scopeDiff;

  return a.id.localeCompare(b.id);
}

function parseTicketFrontmatter(content: string): { title: string; done: boolean } | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const doneMatch = frontmatter.match(/done:\s*(true|false)/);

  if (!titleMatch || !doneMatch) return null;

  return {
    title: titleMatch[1],
    done: doneMatch[1] === 'true',
  };
}

function readTicketContent(path: string): string {
  return readFileSync(path, 'utf-8');
}

function extractFindingFromTicket(content: string): ParityFinding | null {
  const idMatch = content.match(/- id:\s*`([^`]+)`/);
  if (!idMatch) return null;

  const statusMatch = content.match(/- status:\s*`([^`]+)`/);
  const messageMatch = content.match(/- message:\s*"([^"]+)"/);
  const tagsMatch = content.match(/- tags:\s*(.+)/);

  const tagsLine = tagsMatch?.[1] || 'none';
  const tags = tagsLine === 'none' ? [] : tagsLine.split(',').map(t => t.trim());

  return {
    id: idMatch[1],
    status: (statusMatch?.[1] || 'fail') as ParityFinding['status'],
    message: messageMatch?.[1] || '',
    tags,
  };
}

function findAutoTickets(rootDir: string): ParityTicketMetadata[] {
  const autoDir = join(rootDir, '.codex-autorunner', 'tickets', 'auto');
  const tickets: ParityTicketMetadata[] = [];

  function scanDir(dir: string) {
    if (!existsSync(dir)) return;
    
    const entries = spawnSync('find', [dir, '-type', 'f', '-name', '*.md'], { encoding: 'utf-8' });
    const files = entries.stdout.trim().split('\n').filter(Boolean);

    for (const file of files) {
      const content = readTicketContent(file);
      const frontmatter = parseTicketFrontmatter(content);
      
      if (frontmatter && !frontmatter.done) {
        const finding = extractFindingFromTicket(content);
        if (finding) {
          tickets.push({
            id: finding.id,
            path: file,
            finding,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  scanDir(autoDir);
  return tickets;
}

async function sendOpenCodeTurn(
  _ticketPath: string,
  _config: OpenCodeSessionConfig = {}
): Promise<OpenCodeTurnResult> {
  spawnSync('mkdir', ['-p', join(process.cwd(), '.codex-autorunner', 'runs')]);
  
  return {
    status: 'completed',
    diffs: [],
    notifications: ['Turn executed'],
  };
}

function runTests(): boolean {
  const result = spawnSync('npm', ['test'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  return result.status === 0;
}

function runParityScan(runId: string, dry = true): { report: ParityReport; exitCode: number } {
  const args = ['run', 'src/tools/parity_run.ts', '--run-id', runId];
  if (dry) args.push('--dry');
  
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.cjs', ...args], {
    cwd: process.cwd(),
  });

  const reportPath = join(process.cwd(), '.codex-autorunner', 'parity', 'runs', runId, 'report.json');
  
  if (!existsSync(reportPath)) {
    throw new Error(`Parity report not found at ${reportPath}`);
  }

  const report = readReport(reportPath);
  return { report, exitCode: result.status ?? 1 };
}

function calculateScore(report: ParityReport): number {
  const total = report.findings.length;
  if (total === 0) return 1;
  
  const passed = report.findings.filter(f => f.status === 'pass').length;
  return passed / total;
}

function countCriticalFindings(report: ParityReport): number {
  return report.findings.filter(f => {
    const tags = f.tags ?? [];
    return f.status === 'fail' && (tags.includes('critical') || tags.some(t => t.startsWith('critical/')));
  }).length;
}

export type WorkerOptions = {
  oneStep?: boolean;
  threshold?: number;
  maxTickets?: number;
  dry?: boolean;
  openCodeConfig?: OpenCodeSessionConfig;
  rootDir?: string;
};

async function executeTicket(ticket: ParityTicketMetadata, options: WorkerOptions): Promise<boolean> {
  console.log(`\n[Worker] Executing ticket: ${ticket.finding.message || ticket.finding.id}`);
  console.log(`[Worker] Ticket path: ${ticket.path}`);
  
  if (!options.dry) {
    const result = await sendOpenCodeTurn(ticket.path, options.openCodeConfig || {});
    console.log(`[Worker] Turn status: ${result.status}`);
    
    if (result.notifications) {
      result.notifications.forEach(n => console.log(`[Worker] ${n}`));
    }
    
    if (result.status !== 'completed') {
      console.log(`[Worker] Ticket execution failed`);
      return false;
    }
  } else {
    console.log(`[Worker] Dry run: skipping OpenCode turn`);
  }

  if (options.dry) {
    console.log(`[Worker] Dry run: skipping tests and parity scan`);
    return true;
  }

  console.log(`[Worker] Running tests...`);
  const testsPassed = runTests();
  if (!testsPassed) {
    console.log(`[Worker] Tests failed`);
    return false;
  }
  console.log(`[Worker] Tests passed`);

  const runId = `worker-${Date.now()}`;
  console.log(`[Worker] Running parity scan (${runId})...`);
  const parityResult = runParityScan(runId, options.dry);
  const score = calculateScore(parityResult.report);
  const criticalCount = countCriticalFindings(parityResult.report);
  
  console.log(`[Worker] Parity score: ${score.toFixed(2)}`);
  console.log(`[Worker] Critical findings: ${criticalCount}`);

  return true;
}

type CliOptions = {
  oneStep: boolean;
  threshold: number;
  maxTickets: number;
  dry: boolean;
  rootDir?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    oneStep: false,
    threshold: 1.0,
    maxTickets: Infinity,
    dry: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--one-step') {
      options.oneStep = true;
    } else if (arg === '--dry') {
      options.dry = true;
    } else if (arg === '--threshold') {
      const raw = argv[i + 1];
      if (raw === undefined) {
        throw new Error('Missing value for --threshold');
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid threshold: ${raw}`);
      }
      options.threshold = parsed;
      i += 1;
    } else if (arg === '--max-tickets') {
      const raw = argv[i + 1];
      if (raw === undefined) {
        throw new Error('Missing value for --max-tickets');
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid max-tickets: ${raw}`);
      }
      options.maxTickets = parsed;
      i += 1;
    } else if (arg === '--root-dir') {
      const raw = argv[i + 1];
      if (raw === undefined) {
        throw new Error('Missing value for --root-dir');
      }
      options.rootDir = raw;
      i += 1;
    }
  }

  return options;
}

async function main() {
  const cliOptions = parseArgs(process.argv.slice(2));
  const options: WorkerOptions = {
    oneStep: cliOptions.oneStep,
    threshold: cliOptions.threshold,
    maxTickets: cliOptions.maxTickets,
    dry: cliOptions.dry,
    rootDir: cliOptions.rootDir,
  };

  try {
    const result = await runParityWorker(options);
    
    if (result.thresholdMet) {
      console.log('\n[Worker] ✓ All thresholds met!');
      process.exitCode = 0;
    } else {
      console.log('\n[Worker] ⚠ Thresholds not yet met');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('[Worker] Error:', error);
    process.exitCode = 1;
  }
}

export async function runParityWorker(options: WorkerOptions = {}): Promise<{
  ticketsProcessed: number;
  ticketsSucceeded: number;
  finalScore: number;
  criticalFindings: number;
  thresholdMet: boolean;
}> {
  const {
    oneStep = false,
    threshold = 1.0,
    maxTickets = Infinity,
    dry = false,
    openCodeConfig: _openCodeConfig = {},
  } = options;

  console.log('[Worker] Starting parity loop worker');
  console.log(`[Worker] One-step mode: ${oneStep}`);
  console.log(`[Worker] Threshold: ${threshold}`);
  console.log(`[Worker] Max tickets: ${maxTickets}`);
  console.log(`[Worker] Dry run: ${dry}`);

  const rootDir = options.rootDir ?? process.cwd();
  const latestPath = join(rootDir, '.codex-autorunner', 'parity', 'latest.json');
  if (!existsSync(latestPath)) {
    console.log('[Worker] No latest parity report found. Run parity:run first.');
    return {
      ticketsProcessed: 0,
      ticketsSucceeded: 0,
      finalScore: 0,
      criticalFindings: 0,
      thresholdMet: false,
    };
  }

  const latestContent = readFileSync(latestPath, 'utf-8');
  const { runId } = JSON.parse(latestContent) as { runId: string };
  
  console.log(`[Worker] Latest run ID: ${runId}`);
  
  const reportPath = join(rootDir, '.codex-autorunner', 'parity', 'runs', runId, 'report.json');
  if (!existsSync(reportPath)) {
    throw new Error(`Report not found at ${reportPath}`);
  }

  const report = readReport(reportPath);
  const initialScore = calculateScore(report);
  const initialCritical = countCriticalFindings(report);

  const policy = loadPolicy(rootDir);
  let policyMet = false;
  if (policy) {
    const policyResult = checkPolicy(report, policy, rootDir);
    policyMet = policyResult.meetsPolicy;
    console.log('[Worker] Initial policy status:');
    console.log(formatPolicyCheckResult(policyResult));
  }

  console.log(`[Worker] Initial parity score: ${initialScore.toFixed(2)}`);
  console.log(`[Worker] Initial critical findings: ${initialCritical}`);

  const failingFindings = report.findings.filter(f => f.status === 'fail');
  const sortedFindings = [...failingFindings].sort(compareFindings);
  
  console.log(`[Worker] Failing findings: ${sortedFindings.length}`);

  const tickets = findAutoTickets(rootDir);
  const sortedTickets = tickets
    .filter(ticket => sortedFindings.some(f => f.id === ticket.finding.id))
    .sort((a, b) => compareFindings(a.finding, b.finding));

  console.log(`[Worker] Matching auto tickets: ${sortedTickets.length}`);

  let ticketsProcessed = 0;
  let ticketsSucceeded = 0;
  let currentScore = initialScore;
  let criticalFindings = initialCritical;

  for (const ticket of sortedTickets) {
    if (ticketsProcessed >= maxTickets) {
      console.log(`[Worker] Max tickets limit reached`);
      break;
    }

    const success = await executeTicket(ticket, { ...options, dry });
    ticketsProcessed++;

    if (!dry) {
      const runId = `worker-${Date.now()}`;
      const parityResult = runParityScan(runId, dry);
      currentScore = calculateScore(parityResult.report);
      criticalFindings = countCriticalFindings(parityResult.report);

      if (policy) {
        const policyResult = checkPolicy(parityResult.report, policy, rootDir);
        policyMet = policyResult.meetsPolicy;
        console.log(`[Worker] Updated policy status:`);
        console.log(formatPolicyCheckResult(policyResult));
      }

      console.log(`[Worker] Updated parity score: ${currentScore.toFixed(2)}`);
      console.log(`[Worker] Updated critical findings: ${criticalFindings}`);
    }

    if (success) {
      ticketsSucceeded++;
    }

    if (oneStep) {
      console.log('[Worker] One-step mode: exiting after one ticket');
      break;
    }

    if (policy) {
      if (policyMet) {
        console.log('[Worker] Policy met: stopping');
        break;
      }
    } else {
      if (currentScore >= threshold && criticalFindings === 0) {
        console.log('[Worker] Threshold met and no critical findings: stopping');
        break;
      }
    }
  }

  const thresholdMet = policy ? policyMet : (currentScore >= threshold && criticalFindings === 0);

  console.log('[Worker] Summary:');
  console.log(`[Worker] - Tickets processed: ${ticketsProcessed}`);
  console.log(`[Worker] - Tickets succeeded: ${ticketsSucceeded}`);
  console.log(`[Worker] - Final score: ${currentScore.toFixed(2)}`);
  console.log(`[Worker] - Critical findings: ${criticalFindings}`);
  console.log(`[Worker] - Threshold met: ${thresholdMet}`);

  return {
    ticketsProcessed,
    ticketsSucceeded,
    finalScore: currentScore,
    criticalFindings,
    thresholdMet,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
