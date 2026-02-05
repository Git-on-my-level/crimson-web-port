import { describe, expect, it } from 'vitest';
import { advanceSurvivalSpawnStage } from '../src/sim/modes/survival_spawn_stage';
import { SurvivalSpawnId } from '../src/sim/modes/survival_spawn_templates';

describe('Survival spawn stage', () => {
  it('emits deterministic stage packs at level gates', () => {
    let stage = 0;

    let result = advanceSurvivalSpawnStage(stage, 4);
    expect(result.stage).toBe(0);
    expect(result.spawns).toHaveLength(0);

    result = advanceSurvivalSpawnStage(stage, 5);
    expect(result.stage).toBe(1);
    expect(result.spawns).toHaveLength(2);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.FORMATION_RING_ALIEN_8_12,
      pos: { x: -164, y: 512 },
    });
    expect(result.spawns[1]).toMatchObject({
      templateId: SurvivalSpawnId.FORMATION_RING_ALIEN_8_12,
      pos: { x: 1188, y: 512 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 9);
    expect(result.stage).toBe(2);
    expect(result.spawns).toHaveLength(1);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.ALIEN_CONST_RED_BOSS_2C,
      pos: { x: 1088, y: 512 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 11);
    expect(result.stage).toBe(3);
    expect(result.spawns).toHaveLength(12);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP2_RANDOM_35,
      pos: { x: 1088, y: 256 },
    });
    expect(result.spawns[11].pos.y).toBeCloseTo(725.333, 2);
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 13);
    expect(result.stage).toBe(4);
    expect(result.spawns).toHaveLength(4);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.ALIEN_CONST_RED_FAST_2B,
      pos: { x: 1088, y: 384 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 15);
    expect(result.stage).toBe(5);
    expect(result.spawns).toHaveLength(8);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_AI7_TIMER_38,
      pos: { x: 1088, y: 384 },
    });
    expect(result.spawns[7]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_AI7_TIMER_38,
      pos: { x: -64, y: 576 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 17);
    expect(result.stage).toBe(6);
    expect(result.spawns).toHaveLength(1);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A,
      pos: { x: 1088, y: 512 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 19);
    expect(result.stage).toBe(7);
    expect(result.spawns).toHaveLength(1);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
      pos: { x: 640, y: 512 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 21);
    expect(result.stage).toBe(8);
    expect(result.spawns).toHaveLength(2);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
      pos: { x: 384, y: 256 },
    });
    expect(result.spawns[1]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP2_SPLITTER_01,
      pos: { x: 640, y: 768 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 26);
    expect(result.stage).toBe(9);
    expect(result.spawns).toHaveLength(8);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
      pos: { x: 1088, y: 384 },
    });
    expect(result.spawns[7]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
      pos: { x: -64, y: 576 },
    });
    stage = result.stage;

    result = advanceSurvivalSpawnStage(stage, 32);
    expect(result.stage).toBe(10);
    expect(result.spawns).toHaveLength(10);
    expect(result.spawns[0]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_CONST_SHOCK_BOSS_3A,
      pos: { x: 1088, y: 512 },
    });
    expect(result.spawns[9]).toMatchObject({
      templateId: SurvivalSpawnId.SPIDER_SP1_CONST_RANGED_VARIANT_3C,
      pos: { x: 576, y: 1088 },
    });
  });
});
