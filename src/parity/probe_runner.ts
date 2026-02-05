import type { ParityFinding } from './report';
import { PROBES } from './probes';

export function runDynamicProbes(): ParityFinding[] {
  const findings: ParityFinding[] = [];
  for (const probe of PROBES) {
    try {
      const probeFindings = probe.run();
      findings.push(...probeFindings);
    } catch (error) {
      findings.push({
        id: `probe:${probe.id}:exception`,
        status: 'fail',
        message: `Probe ${probe.id} crashed during execution.`,
        details: error instanceof Error ? error.stack ?? error.message : String(error),
        tags: ['dynamic', `probe:${probe.id}`, 'probe:exception'],
      });
    }
  }
  return findings;
}
