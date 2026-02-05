import type { Vec2 } from '../types';
import type { Rng } from '../rng';
import { refRadius } from './survival_ref';

export const SurvivalSpawnId = {
  SPIDER_SP2_SPLITTER_01: 0x01,
  FORMATION_RING_ALIEN_8_12: 0x12,
  ALIEN_CONST_RED_FAST_2B: 0x2b,
  ALIEN_CONST_RED_BOSS_2C: 0x2c,
  SPIDER_SP2_RANDOM_35: 0x35,
  SPIDER_SP1_AI7_TIMER_38: 0x38,
  SPIDER_SP1_CONST_SHOCK_BOSS_3A: 0x3a,
  SPIDER_SP1_CONST_RANGED_VARIANT_3C: 0x3c,
} as const;

export type SurvivalSpawnTemplateId = (typeof SurvivalSpawnId)[keyof typeof SurvivalSpawnId];

export type SurvivalTemplateSpawn = {
  kind: string;
  pos: Vec2;
};

const TEMPLATE_KIND_MAP: Record<number, string> = {
  [SurvivalSpawnId.SPIDER_SP2_SPLITTER_01]: 'spider_elite',
  [SurvivalSpawnId.ALIEN_CONST_RED_FAST_2B]: 'alien',
  [SurvivalSpawnId.ALIEN_CONST_RED_BOSS_2C]: 'alien_elite',
  [SurvivalSpawnId.SPIDER_SP2_RANDOM_35]: 'spider_elite',
  [SurvivalSpawnId.SPIDER_SP1_AI7_TIMER_38]: 'spider',
  [SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A]: 'spider_elite',
  [SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C]: 'spider',
};

export function resolveSurvivalSpawnTemplate(
  templateId: number,
  pos: Vec2,
  _rng: Rng,
): SurvivalTemplateSpawn[] {
  if (templateId === SurvivalSpawnId.FORMATION_RING_ALIEN_8_12) {
    return buildRingFormation(pos, 'alien', 8, refRadius(100));
  }

  const kind = TEMPLATE_KIND_MAP[templateId] ?? 'grunt';
  return [{ kind, pos }];
}

function buildRingFormation(center: Vec2, kind: string, count: number, radius: number): SurvivalTemplateSpawn[] {
  const spawns: SurvivalTemplateSpawn[] = [{ kind, pos: { x: center.x, y: center.y } }];
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i += 1) {
    const angle = step * i;
    spawns.push({
      kind,
      pos: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
    });
  }
  return spawns;
}
