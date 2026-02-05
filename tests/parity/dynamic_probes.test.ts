import { describe, expect, it } from 'vitest';
import {
  probeAiConverges,
  probeBonusNukeKills,
  probeProjectilesSpawn,
  probeReloadHappens,
} from '../../src/parity/probes';
import { assignWeapon } from '../../src/sim/weapons/weaponTable';
import { EMPTY_INPUT } from '../../src/sim/types';

function expectProbeFailure(findings: { status: string; tags?: string[] }[], tag: string) {
  expect(findings.length).toBeGreaterThan(0);
  expect(findings.some((finding) => finding.status === 'fail')).toBe(true);
  expect(findings.some((finding) => (finding.tags ?? []).includes('dynamic'))).toBe(true);
  expect(findings.some((finding) => (finding.tags ?? []).includes(tag))).toBe(true);
}

describe('Parity: dynamic probes', () => {
  it('reload probe emits findings on failure', () => {
    const findings = probeReloadHappens.run({
      setup: (sim) => {
        assignWeapon(sim.state.player, 'pistol');
        sim.state.player.ammo = 0;
      },
    });
    expectProbeFailure(findings, 'probe:reload-happens');
  });

  it('nuke probe emits findings on failure', () => {
    const findings = probeBonusNukeKills.run({
      setup: (sim) => {
        sim.state.creatures = [];
      },
    });
    expectProbeFailure(findings, 'probe:bonus-nuke-kills');
  });

  it('ai convergence probe emits findings on failure', () => {
    const findings = probeAiConverges.run({
      setup: (sim) => {
        if (sim.state.creatures[0]) {
          sim.state.creatures[0].speed = 0;
        }
      },
    });
    expectProbeFailure(findings, 'probe:ai-converges');
  });

  it('projectile probe emits findings on failure', () => {
    const findings = probeProjectilesSpawn.run({
      input: () => ({ ...EMPTY_INPUT }),
    });
    expectProbeFailure(findings, 'probe:projectiles-spawn');
  });
});
