import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeReport, type ParityFinding, type ParityReport } from '../parity/report';
import { runStaticScan } from '../parity/static_scan';
import { runDynamicProbes } from '../parity/probe_runner';
import { checkPolicy, formatPolicyCheckResult, type ParityPolicy } from '../parity/policy';

type VitestAssertionResult = {
  fullName?: string;
  title?: string;
  status?: string;
  failureMessages?: string[];
};

type VitestSuiteResult = {
  name?: string;
  assertionResults?: VitestAssertionResult[];
};

type VitestJsonReport = {
  numTotalTests?: number;
  numFailedTests?: number;
  testResults?: VitestSuiteResult[];
};

type CliOptions = {
  dry: boolean;
  vitestJson?: string;
  threshold: number;
  runId?: string;
  rootDir?: string;
  includeRefTests: boolean;
  includeDynamicProbes: boolean;
};

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dry: false,
    threshold: 1,
    includeRefTests: true,
    includeDynamicProbes: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry') {
      options.dry = true;
    } else if (arg === '--vitest-json') {
      options.vitestJson = argv[i + 1];
      i += 1;
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
    } else if (arg === '--run-id') {
      options.runId = argv[i + 1];
      i += 1;
    } else if (arg === '--root') {
      options.rootDir = argv[i + 1];
      i += 1;
    } else if (arg === '--no-ref-tests') {
      options.includeRefTests = false;
    } else if (arg === '--no-dynamic') {
      options.includeDynamicProbes = false;
    }
  }

  return options;
}

function loadVitestJson(path: string): VitestJsonReport {
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw) as VitestJsonReport;
  return parsed;
}

function runVitest(outputPath: string): void {
  ensureDir(outputPath);
  const result = spawnSync('npx', ['vitest', 'run', '--reporter', 'json', '--outputFile', outputPath], {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
}

function buildVitestFindings(report: VitestJsonReport): {
  findings: ParityFinding[];
  totalTests: number;
  failedTests: number;
} {
  const findings: ParityFinding[] = [];
  const totalTests = typeof report.numTotalTests === 'number' ? report.numTotalTests : 0;
  const failedTests = typeof report.numFailedTests === 'number' ? report.numFailedTests : 0;

  const suites = Array.isArray(report.testResults) ? report.testResults : [];
  suites.forEach((suite, suiteIndex) => {
    const suiteName = suite.name ?? `suite-${suiteIndex}`;
    const assertions = Array.isArray(suite.assertionResults) ? suite.assertionResults : [];
    assertions.forEach((assertion, assertionIndex) => {
      const status = assertion.status ?? 'unknown';
      if (status !== 'failed' && status !== 'fail') {
        return;
      }
      const title = assertion.fullName ?? assertion.title ?? `assertion-${assertionIndex}`;
      findings.push({
        id: `vitest:${suiteName}:${title}`,
        status: 'fail',
        message: title,
        details: Array.isArray(assertion.failureMessages) ? assertion.failureMessages.join('\n') : undefined,
        tags: ['vitest', 'critical'],
      });
    });
  });

  return { findings, totalTests, failedTests };
}

function runStaticScans(options: Pick<CliOptions, 'rootDir' | 'includeRefTests'>): ParityFinding[] {
  return runStaticScan({
    rootDir: options.rootDir,
    includeRefTests: options.includeRefTests,
  });
}

// Dynamic probes are handled by src/parity/probe_runner.ts

function summarizeScore(totalTests: number, failedTests: number, extraFindings: ParityFinding[]): number {
  const additionalTotal = extraFindings.filter(f => f.status === 'pass' || f.status === 'fail').length;
  const additionalFailed = extraFindings.filter(f => f.status === 'fail').length;
  const total = totalTests + additionalTotal;
  const failed = failedTests + additionalFailed;
  if (total === 0) {
    return 1;
  }
  return (total - failed) / total;
}

function countCriticalFindings(findings: ParityFinding[]): number {
  return findings.filter(f => f.status === 'fail' && (f.tags ?? []).includes('critical')).length;
}

function buildExceptionFinding(scope: 'static' | 'dynamic', error: unknown): ParityFinding {
  return {
    id: `parity:${scope}:exception`,
    status: 'fail',
    message: `Parity ${scope} scan crashed during execution.`,
    details: error instanceof Error ? error.stack ?? error.message : String(error),
    tags: [`${scope}`, `${scope}:exception`],
  };
}

function loadPolicy(rootDir?: string): ParityPolicy | null {
  const policyPath = join(rootDir ?? process.cwd(), '.codex-autorunner', 'parity', 'policy.json');
  if (!existsSync(policyPath)) {
    return null;
  }
  const raw = readFileSync(policyPath, 'utf-8');
  return JSON.parse(raw) as ParityPolicy;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
  const runId = options.runId ?? new Date().toISOString().replace(/[:.]/g, '-');

  let vitestReport: VitestJsonReport | null = null;

  if (options.vitestJson) {
    vitestReport = loadVitestJson(resolve(options.vitestJson));
  } else if (!options.dry) {
    const vitestPath = join(process.cwd(), '.codex-autorunner', 'parity', 'runs', runId, 'vitest.json');
    runVitest(vitestPath);
    vitestReport = loadVitestJson(vitestPath);
  }

  const vitestFindings = vitestReport ? buildVitestFindings(vitestReport) : { findings: [], totalTests: 0, failedTests: 0 };
  let staticFindings: ParityFinding[] = [];
  try {
    staticFindings = runStaticScans({ rootDir: options.rootDir, includeRefTests: options.includeRefTests });
  } catch (error) {
    staticFindings = [buildExceptionFinding('static', error)];
  }

  let dynamicFindings: ParityFinding[] = [];
  try {
    const dynamicResult = options.includeDynamicProbes ? runDynamicProbes() : { findings: [] };
    dynamicFindings = dynamicResult.findings;
  } catch (error) {
    dynamicFindings = [buildExceptionFinding('dynamic', error)];
  }

  const allFindings = [...vitestFindings.findings, ...staticFindings, ...dynamicFindings];

  const report: ParityReport = {
    schemaVersion: 1,
    meta: {
      runId,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    },
    findings: allFindings,
  };

  const reportPath = join(process.cwd(), '.codex-autorunner', 'parity', 'runs', runId, 'report.json');
  ensureDir(reportPath);
  writeReport(reportPath, report);

  const latestPath = join(process.cwd(), '.codex-autorunner', 'parity', 'latest.json');
  ensureDir(latestPath);
  writeFileSync(latestPath, `${JSON.stringify({ runId }, null, 2)}\n`, 'utf-8');

  const summaryScore = summarizeScore(
    vitestFindings.totalTests,
    vitestFindings.failedTests,
    [...staticFindings, ...dynamicFindings],
  );
  const criticalCount = countCriticalFindings(allFindings);

  const policy = loadPolicy(options.rootDir);

  if (policy) {
    const policyResult = checkPolicy(report, policy, options.rootDir);
    console.log('\n' + formatPolicyCheckResult(policyResult) + '\n');

    if (!policyResult.meetsPolicy) {
      process.exitCode = 1;
      return;
    }
  } else {
    if (summaryScore < options.threshold || criticalCount > 0) {
      process.exitCode = 1;
      return;
    }
  }

  process.exitCode = 0;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
