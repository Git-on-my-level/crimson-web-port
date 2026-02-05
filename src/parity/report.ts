import { readFileSync, writeFileSync } from 'node:fs';

export type ParityFindingStatus = 'pass' | 'fail' | 'skip';

export interface ParityFinding {
  id: string;
  status: ParityFindingStatus;
  message: string;
  details?: string;
  expected?: unknown;
  actual?: unknown;
  tags?: string[];
}

export interface ParityRunMeta {
  runId: string;
  createdAt: string;
  baselineId?: string;
  scenario?: string;
  toolVersion?: string;
  commit?: string;
  durationMs?: number;
  notes?: string;
}

export interface ParityReport {
  schemaVersion: 1;
  meta: ParityRunMeta;
  findings: ParityFinding[];
}

export class ParityReportValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid ParityReport:\n${issues.join('\n')}`);
    this.name = 'ParityReportValidationError';
    this.issues = issues;
  }
}

const FINDING_STATUSES: readonly ParityFindingStatus[] = ['pass', 'fail', 'skip'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, path: string, issues: string[], allowEmpty = false): void {
  if (typeof value !== 'string') {
    issues.push(`${path} must be a string`);
    return;
  }
  if (!allowEmpty && value.trim().length === 0) {
    issues.push(`${path} must be a non-empty string`);
  }
}

function assertOptionalString(value: unknown, path: string, issues: string[], allowEmpty = false): void {
  if (value === undefined) {
    return;
  }
  assertString(value, path, issues, allowEmpty);
}

function assertOptionalNumber(value: unknown, path: string, issues: string[]): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(`${path} must be a finite number`);
  }
}

function assertOptionalStringArray(value: unknown, path: string, issues: string[]): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array of strings`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      issues.push(`${path}[${index}] must be a string`);
    }
  });
}

function validateFinding(value: unknown, path: string, issues: string[]): value is ParityFinding {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }

  assertString(value.id, `${path}.id`, issues);
  if (typeof value.status !== 'string' || !FINDING_STATUSES.includes(value.status as ParityFindingStatus)) {
    issues.push(`${path}.status must be one of ${FINDING_STATUSES.join(', ')}`);
  }
  assertString(value.message, `${path}.message`, issues, true);
  assertOptionalString(value.details, `${path}.details`, issues, true);
  assertOptionalStringArray(value.tags, `${path}.tags`, issues);

  return true;
}

function validateRunMeta(value: unknown, path: string, issues: string[]): value is ParityRunMeta {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }

  assertString(value.runId, `${path}.runId`, issues);
  assertString(value.createdAt, `${path}.createdAt`, issues);
  if (typeof value.createdAt === 'string' && Number.isNaN(Date.parse(value.createdAt))) {
    issues.push(`${path}.createdAt must be an ISO-8601 date-time string`);
  }

  assertOptionalString(value.baselineId, `${path}.baselineId`, issues, true);
  assertOptionalString(value.scenario, `${path}.scenario`, issues, true);
  assertOptionalString(value.toolVersion, `${path}.toolVersion`, issues, true);
  assertOptionalString(value.commit, `${path}.commit`, issues, true);
  assertOptionalString(value.notes, `${path}.notes`, issues, true);
  assertOptionalNumber(value.durationMs, `${path}.durationMs`, issues);

  if (typeof value.durationMs === 'number' && value.durationMs < 0) {
    issues.push(`${path}.durationMs must be >= 0`);
  }

  return true;
}

function validateReport(value: unknown): asserts value is ParityReport {
  const issues: string[] = [];

  if (!isRecord(value)) {
    issues.push('report must be an object');
  } else {
    if (value.schemaVersion !== 1) {
      issues.push('schemaVersion must be 1');
    }

    validateRunMeta(value.meta, 'meta', issues);

    if (!Array.isArray(value.findings)) {
      issues.push('findings must be an array');
    } else {
      value.findings.forEach((finding, index) => {
        validateFinding(finding, `findings[${index}]`, issues);
      });
    }
  }

  if (issues.length > 0) {
    throw new ParityReportValidationError(issues);
  }
}

export function writeReport(path: string, report: ParityReport): void {
  validateReport(report);
  const payload = JSON.stringify(report, null, 2);
  writeFileSync(path, `${payload}\n`, 'utf-8');
}

export function readReport(path: string): ParityReport {
  const raw = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  validateReport(parsed);
  return parsed;
}
