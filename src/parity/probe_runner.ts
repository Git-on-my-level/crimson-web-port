import type { ParityFinding } from './report';
import { PROBES } from './probes';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProbeRunOverride } from './probes/types';
import { idleInput, constantFireInput } from './probes/utils';

type ProbeMatrixConfig = {
  seeds: number[];
  ticks: number[];
  inputPatterns: InputPattern[];
  modes: ('survival' | 'quest')[];
};

type InputPattern = 'idle' | 'constant-fire';

type InputPatternMap = {
  'idle': (tick: number) => any;
  'constant-fire': (tick: number) => any;
};

const INPUT_PATTERNS: InputPatternMap = {
  'idle': idleInput,
  'constant-fire': constantFireInput,
};

type ProbeRunStats = {
  total: number;
  passed: number;
  failed: number;
  byProbe: Record<string, { total: number; passed: number; failed: number }>;
  bySeed: Record<number, { total: number; passed: number; failed: number }>;
  byTick: Record<number, { total: number; passed: number; failed: number }>;
  byInputPattern: Record<string, { total: number; passed: number; failed: number }>;
  byMode: Record<string, { total: number; passed: number; failed: number }>;
};

function loadProbeMatrix(): ProbeMatrixConfig {
  const configPath = resolve(process.cwd(), '.codex-autorunner', 'parity', 'probe_matrix.json');
  if (!existsSync(configPath)) {
    return {
      seeds: [],
      ticks: [],
      inputPatterns: [],
      modes: [],
    };
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as ProbeMatrixConfig;
}

function getInputForPattern(pattern: string): ((tick: number) => any) | undefined {
  return INPUT_PATTERNS[pattern as keyof InputPatternMap];
}

function generateMatrixOverrides(probe: typeof PROBES[0], matrix: ProbeMatrixConfig): ProbeRunOverride[] {
  const overrides: ProbeRunOverride[] = [];
  const seeds = matrix.seeds.length > 0 ? matrix.seeds : [probe.defaultSeed];
  const ticks = matrix.ticks.length > 0 ? matrix.ticks : [probe.defaultTicks];
  const supportedPatterns: InputPattern[] = probe.inputPatterns?.length ? probe.inputPatterns : ['idle'];
  const matrixPatterns = matrix.inputPatterns.length > 0 ? matrix.inputPatterns : supportedPatterns;
  const patterns = matrixPatterns.filter((pattern) => supportedPatterns.includes(pattern));

  if (patterns.length === 0) {
    return overrides;
  }

  for (const seed of seeds) {
    for (const tick of ticks) {
      for (const pattern of patterns) {
        const inputFn = getInputForPattern(pattern);
        if (!inputFn) continue;

        const wrappedInput = (tick: number) => inputFn(tick);
        (wrappedInput as any).patternName = pattern;

        overrides.push({
          seed,
          ticks: tick,
          input: wrappedInput,
        });
      }
    }
  }

  return overrides;
}

function updateStats(stats: ProbeRunStats, probeId: string, seed: number, tick: number, inputPattern: string, mode: string, passed: boolean): void {
  stats.total += 1;
  if (passed) {
    stats.passed += 1;
  } else {
    stats.failed += 1;
  }

  if (!stats.byProbe[probeId]) {
    stats.byProbe[probeId] = { total: 0, passed: 0, failed: 0 };
  }
  stats.byProbe[probeId].total += 1;
  if (passed) {
    stats.byProbe[probeId].passed += 1;
  } else {
    stats.byProbe[probeId].failed += 1;
  }

  if (!stats.bySeed[seed]) {
    stats.bySeed[seed] = { total: 0, passed: 0, failed: 0 };
  }
  stats.bySeed[seed].total += 1;
  if (passed) {
    stats.bySeed[seed].passed += 1;
  } else {
    stats.bySeed[seed].failed += 1;
  }

  if (!stats.byTick[tick]) {
    stats.byTick[tick] = { total: 0, passed: 0, failed: 0 };
  }
  stats.byTick[tick].total += 1;
  if (passed) {
    stats.byTick[tick].passed += 1;
  } else {
    stats.byTick[tick].failed += 1;
  }

  if (!stats.byInputPattern[inputPattern]) {
    stats.byInputPattern[inputPattern] = { total: 0, passed: 0, failed: 0 };
  }
  stats.byInputPattern[inputPattern].total += 1;
  if (passed) {
    stats.byInputPattern[inputPattern].passed += 1;
  } else {
    stats.byInputPattern[inputPattern].failed += 1;
  }

  if (!stats.byMode[mode]) {
    stats.byMode[mode] = { total: 0, passed: 0, failed: 0 };
  }
  stats.byMode[mode].total += 1;
  if (passed) {
    stats.byMode[mode].passed += 1;
  } else {
    stats.byMode[mode].failed += 1;
  }
}

function formatStats(stats: ProbeRunStats): string {
  const lines: string[] = [];
  lines.push(`\n=== Probe Matrix Coverage Summary ===`);
  lines.push(`Total probe runs: ${stats.total}`);
  lines.push(`Passed: ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`Failed: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`\nBy Probe:`);
  for (const [probeId, s] of Object.entries(stats.byProbe)) {
    lines.push(`  ${probeId}: ${s.passed}/${s.total} passed`);
  }
  lines.push(`\nBy Seed:`);
  for (const [seed, s] of Object.entries(stats.bySeed)) {
    lines.push(`  ${seed}: ${s.passed}/${s.total} passed`);
  }
  lines.push(`\nBy Ticks:`);
  for (const [tick, s] of Object.entries(stats.byTick)) {
    lines.push(`  ${tick}: ${s.passed}/${s.total} passed`);
  }
  lines.push(`\nBy Input Pattern:`);
  for (const [pattern, s] of Object.entries(stats.byInputPattern)) {
    lines.push(`  ${pattern}: ${s.passed}/${s.total} passed`);
  }
  lines.push(`\nBy Mode:`);
  for (const [mode, s] of Object.entries(stats.byMode)) {
    lines.push(`  ${mode}: ${s.passed}/${s.total} passed`);
  }
  return lines.join('\n');
}

export function runDynamicProbes(): { findings: ParityFinding[]; stats?: ProbeRunStats } {
  const matrix = loadProbeMatrix();
  const findings: ParityFinding[] = [];
  const stats: ProbeRunStats = {
    total: 0,
    passed: 0,
    failed: 0,
    byProbe: {},
    bySeed: {},
    byTick: {},
    byInputPattern: {},
    byMode: {},
  };

  const useMatrix = matrix.seeds.length > 0 || matrix.ticks.length > 0 || matrix.inputPatterns.length > 0 || matrix.modes.length > 0;

  for (const probe of PROBES) {
    const overrides = useMatrix ? generateMatrixOverrides(probe, matrix) : [{}];

    for (const override of overrides) {
      try {
        const probeFindings = probe.run(override);
        for (const finding of probeFindings) {
          findings.push(finding);

          const passed = finding.status === 'pass';
          const seed = override.seed ?? probe.defaultSeed;
          const tick = override.ticks ?? probe.defaultTicks;
          const inputPattern = (override.input as any).patternName ?? 'unknown';
          const mode = 'survival';

          updateStats(stats, probe.id, seed, tick, inputPattern, mode, passed);
        }
      } catch (error) {
        const exceptionFinding: ParityFinding = {
          id: `probe:${probe.id}:exception`,
          status: 'fail',
          message: `Probe ${probe.id} crashed during execution.`,
          details: error instanceof Error ? error.stack ?? error.message : String(error),
          tags: ['dynamic', `probe:${probe.id}`, 'probe:exception'],
        };
        findings.push(exceptionFinding);

        const seed = override.seed ?? probe.defaultSeed;
        const tick = override.ticks ?? probe.defaultTicks;
        const inputPattern = (override.input as any).patternName ?? 'unknown';
        updateStats(stats, probe.id, seed, tick, inputPattern, 'unknown', false);
      }
    }
  }

  if (useMatrix && stats.total > 0) {
    console.error(formatStats(stats));
  }

  return { findings, stats: useMatrix ? stats : undefined };
}
