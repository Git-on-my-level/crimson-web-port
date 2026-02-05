import { SurvivalSpawnId } from './survival_spawn_templates';

export type SurvivalSpawnTemplateCall = {
  templateId: number;
  pos: { x: number; y: number };
  heading: number;
};

export type SurvivalStageAdvance = {
  stage: number;
  spawns: SurvivalSpawnTemplateCall[];
};

export function advanceSurvivalSpawnStage(stage: number, playerLevel: number): SurvivalStageAdvance {
  let nextStage = Math.floor(stage);
  const level = Math.floor(playerLevel);
  const spawns: SurvivalSpawnTemplateCall[] = [];
  const heading = Math.PI;

  while (true) {
    if (nextStage === 0) {
      if (level < 5) break;
      nextStage = 1;
      spawns.push({
        templateId: SurvivalSpawnId.FORMATION_RING_ALIEN_8_12,
        pos: { x: -164, y: 512 },
        heading,
      });
      spawns.push({
        templateId: SurvivalSpawnId.FORMATION_RING_ALIEN_8_12,
        pos: { x: 1188, y: 512 },
        heading,
      });
      continue;
    }

    if (nextStage === 1) {
      if (level < 9) break;
      nextStage = 2;
      spawns.push({
        templateId: SurvivalSpawnId.ALIEN_CONST_RED_BOSS_2C,
        pos: { x: 1088, y: 512 },
        heading,
      });
      continue;
    }

    if (nextStage === 2) {
      if (level < 11) break;
      nextStage = 3;
      const step = 128 / 3;
      for (let i = 0; i < 12; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP2_RANDOM_35,
          pos: { x: 1088, y: i * step + 256 },
          heading,
        });
      }
      continue;
    }

    if (nextStage === 3) {
      if (level < 13) break;
      nextStage = 4;
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.ALIEN_CONST_RED_FAST_2B,
          pos: { x: 1088, y: i * 64 + 384 },
          heading,
        });
      }
      continue;
    }

    if (nextStage === 4) {
      if (level < 15) break;
      nextStage = 5;
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_AI7_TIMER_38,
          pos: { x: 1088, y: i * 64 + 384 },
          heading,
        });
      }
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_AI7_TIMER_38,
          pos: { x: -64, y: i * 64 + 384 },
          heading,
        });
      }
      continue;
    }

    if (nextStage === 5) {
      if (level < 17) break;
      nextStage = 6;
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A,
        pos: { x: 1088, y: 512 },
        heading,
      });
      continue;
    }

    if (nextStage === 6) {
      if (level < 19) break;
      nextStage = 7;
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
        pos: { x: 640, y: 512 },
        heading,
      });
      continue;
    }

    if (nextStage === 7) {
      if (level < 21) break;
      nextStage = 8;
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
        pos: { x: 384, y: 256 },
        heading,
      });
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
        pos: { x: 640, y: 768 },
        heading,
      });
      continue;
    }

    if (nextStage === 8) {
      if (level < 26) break;
      nextStage = 9;
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
          pos: { x: 1088, y: i * 64 + 384 },
          heading,
        });
      }
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
          pos: { x: -64, y: i * 64 + 384 },
          heading,
        });
      }
      continue;
    }

    if (nextStage === 9) {
      if (level <= 31) break;
      nextStage = 10;
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A,
        pos: { x: 1088, y: 512 },
        heading,
      });
      spawns.push({
        templateId: SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A,
        pos: { x: -64, y: 512 },
        heading,
      });
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
          pos: { x: i * 64 + 384, y: -64 },
          heading,
        });
      }
      for (let i = 0; i < 4; i += 1) {
        spawns.push({
          templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
          pos: { x: i * 64 + 384, y: 1088 },
          heading,
        });
      }
      continue;
    }

    break;
  }

  return { stage: nextStage, spawns };
}
