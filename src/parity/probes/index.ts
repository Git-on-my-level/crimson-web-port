import type { ProbeDefinition } from './types';
import { probeReloadHappens } from './probe_reload_happens';
import { probeBonusNukeKills } from './probe_bonus_nuke_kills';
import { probeAiConverges } from './probe_ai_converges';
import { probeProjectilesSpawn } from './probe_projectiles_spawn';
import { probeWorldSize } from './probe_world_size';
import { probeTerrainBackground } from './probe_terrain_background';
import { probeWeaponCatalog } from './probe_weapon_catalog';
import { probePerkCatalog } from './probe_perk_catalog';
import { probeCreatureTurnRate } from './probe_creature_turn_rate';
import { probePendingPerkFlow } from './probe_pending_perk_flow';

export const PROBES: ProbeDefinition[] = [
  probeReloadHappens,
  probeBonusNukeKills,
  probeAiConverges,
  probeProjectilesSpawn,
  probeWorldSize,
  probeTerrainBackground,
  probeWeaponCatalog,
  probePerkCatalog,
  probeCreatureTurnRate,
  probePendingPerkFlow,
];

export type { ProbeDefinition, ProbeRunOverride } from './types';
export {
  probeReloadHappens,
  probeBonusNukeKills,
  probeAiConverges,
  probeProjectilesSpawn,
  probeWorldSize,
  probeTerrainBackground,
  probeWeaponCatalog,
  probePerkCatalog,
  probeCreatureTurnRate,
  probePendingPerkFlow,
};
