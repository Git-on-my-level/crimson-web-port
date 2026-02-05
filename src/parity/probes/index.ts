import type { ProbeDefinition } from './types';
import { probeReloadHappens } from './probe_reload_happens';
import { probeBonusNukeKills } from './probe_bonus_nuke_kills';
import { probeAiConverges } from './probe_ai_converges';
import { probeProjectilesSpawn } from './probe_projectiles_spawn';

export const PROBES: ProbeDefinition[] = [
  probeReloadHappens,
  probeBonusNukeKills,
  probeAiConverges,
  probeProjectilesSpawn,
];

export type { ProbeDefinition, ProbeRunOverride } from './types';
export {
  probeReloadHappens,
  probeBonusNukeKills,
  probeAiConverges,
  probeProjectilesSpawn,
};
