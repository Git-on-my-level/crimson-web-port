import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ParityFinding, ParityReport } from './report';
import { runRefTestInventory } from './ref_test_inventory';

export type ParityPolicy = {
  requiredScore: number;
  maxFindingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  requiredRefTestPortCoveragePercent: number;
};

export type PolicyCheckResult = {
  meetsPolicy: boolean;
  score: number;
  scoreMet: boolean;
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findingsBySeverityMet: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  refTestPortCoverage: number;
  refTestPortCoverageMet: boolean;
};

export function loadPolicy(rootDir?: string): ParityPolicy {
  const cwd = rootDir ?? process.cwd();
  const policyPath = join(cwd, '.codex-autorunner', 'parity', 'policy.json');

  if (!existsSync(policyPath)) {
    throw new Error(`Policy file not found at ${policyPath}`);
  }

  const raw = readFileSync(policyPath, 'utf-8');
  const policy = JSON.parse(raw) as ParityPolicy;

  if (typeof policy.requiredScore !== 'number' || policy.requiredScore < 0 || policy.requiredScore > 1) {
    throw new Error('Invalid requiredScore: must be a number between 0 and 1');
  }

  if (typeof policy.requiredRefTestPortCoveragePercent !== 'number' || policy.requiredRefTestPortCoveragePercent < 0 || policy.requiredRefTestPortCoveragePercent > 100) {
    throw new Error('Invalid requiredRefTestPortCoveragePercent: must be a number between 0 and 100');
  }

  const severityBuckets = ['critical', 'high', 'medium', 'low'] as const;
  for (const bucket of severityBuckets) {
    const value = policy.maxFindingsBySeverity[bucket];
    if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      throw new Error(`Invalid maxFindingsBySeverity.${bucket}: must be a non-negative integer`);
    }
  }

  return policy;
}

function getSeverity(finding: ParityFinding): 'critical' | 'high' | 'medium' | 'low' {
  const tags = finding.tags ?? [];
  if (tags.includes('critical') || tags.some(t => t.startsWith('critical/'))) return 'critical';
  if (tags.includes('high') || tags.some(t => t.startsWith('high/'))) return 'high';
  if (tags.includes('medium') || tags.some(t => t.startsWith('medium/'))) return 'medium';
  return 'low';
}

function countFindingsBySeverity(findings: ParityFinding[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
} {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    if (finding.status !== 'fail') continue;
    const severity = getSeverity(finding);
    counts[severity]++;
  }

  return counts;
}

function calculateScore(report: ParityReport): number {
  const total = report.findings.length;
  if (total === 0) return 1;

  const passed = report.findings.filter(f => f.status === 'pass').length;
  return passed / total;
}

function calculateRefTestPortCoverage(rootDir?: string): number {
  const inventory = runRefTestInventory({ rootDir });
  const total = inventory.entries.length;
  if (total === 0) return 100;

  const portedOrSkipped = inventory.entries.filter(
    e => e.status === 'ported' || e.status === 'skipped'
  ).length;

  return (portedOrSkipped / total) * 100;
}

export function checkPolicy(report: ParityReport, policy?: ParityPolicy, rootDir?: string): PolicyCheckResult {
  const loadedPolicy = policy ?? loadPolicy(rootDir);
  const score = calculateScore(report);
  const scoreMet = score >= loadedPolicy.requiredScore;

  const findingsBySeverity = countFindingsBySeverity(report.findings);
  const findingsBySeverityMet = {
    critical: findingsBySeverity.critical <= loadedPolicy.maxFindingsBySeverity.critical,
    high: findingsBySeverity.high <= loadedPolicy.maxFindingsBySeverity.high,
    medium: findingsBySeverity.medium <= loadedPolicy.maxFindingsBySeverity.medium,
    low: findingsBySeverity.low <= loadedPolicy.maxFindingsBySeverity.low,
  };

  const refTestPortCoverage = calculateRefTestPortCoverage(rootDir);
  const refTestPortCoverageMet = refTestPortCoverage >= loadedPolicy.requiredRefTestPortCoveragePercent;

  const meetsPolicy = scoreMet && findingsBySeverityMet.critical && findingsBySeverityMet.high && findingsBySeverityMet.medium && findingsBySeverityMet.low && refTestPortCoverageMet;

  return {
    meetsPolicy,
    score,
    scoreMet,
    findingsBySeverity,
    findingsBySeverityMet,
    refTestPortCoverage,
    refTestPortCoverageMet,
  };
}

export function formatPolicyCheckResult(result: PolicyCheckResult): string {
  const lines: string[] = [];

  lines.push('Policy Check Results:');
  lines.push(`  Score: ${result.score.toFixed(2)} (required: >=0.95) - ${result.scoreMet ? '✓' : '✗'}`);
  lines.push('  Findings by severity:');
  lines.push(`    Critical: ${result.findingsBySeverity.critical} (max: 0) - ${result.findingsBySeverityMet.critical ? '✓' : '✗'}`);
  lines.push(`    High: ${result.findingsBySeverity.high} (max: 5) - ${result.findingsBySeverityMet.high ? '✓' : '✗'}`);
  lines.push(`    Medium: ${result.findingsBySeverity.medium} (max: 20) - ${result.findingsBySeverityMet.medium ? '✓' : '✗'}`);
  lines.push(`    Low: ${result.findingsBySeverity.low} (max: 50) - ${result.findingsBySeverityMet.low ? '✓' : '✗'}`);
  lines.push(`  Ref-test port coverage: ${result.refTestPortCoverage.toFixed(1)}% (required: >=80%) - ${result.refTestPortCoverageMet ? '✓' : '✗'}`);
  lines.push(`  Overall: ${result.meetsPolicy ? '✓ Policy met' : '✗ Policy not met'}`);

  return lines.join('\n');
}
