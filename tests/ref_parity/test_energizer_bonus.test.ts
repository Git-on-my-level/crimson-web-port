// @parity-tags: parity-system/bonuses, ref-test/energizer
import { describe, expect, it } from 'vitest';
import { Sim } from '../../src/sim/sim';
import { EMPTY_INPUT } from '../../src/sim/types';
import { resolveCollisions } from '../../src/sim/systems/collision';
import { spawnCreatureAtPosition } from '../../src/sim/systems/creatures';

function setupOverlap(sim: Sim): void {
  const spawnEvents: any[] = [];
  const playerPos = { x: sim.state.player.pos.x, y: sim.state.player.pos.y };
  spawnCreatureAtPosition(sim.state, spawnEvents, 'grunt', playerPos);
  const creature = sim.state.creatures[0];
  if (!creature) {
    throw new Error('Expected creature to spawn');
  }
  sim.state.player.pos.x = creature.pos.x;
  sim.state.player.pos.y = creature.pos.y;
}

function setupWeakCreature(sim: Sim): void {
  const spawnEvents: any[] = [];
  const playerPos = { x: sim.state.player.pos.x + 10, y: sim.state.player.pos.y };
  spawnCreatureAtPosition(sim.state, spawnEvents, 'grunt', playerPos);
  const creature = sim.state.creatures[0];
  if (!creature) {
    throw new Error('Expected creature to spawn');
  }
  creature.hp = 10;
  creature.hpMax = 400;
  creature.pos.x = sim.state.player.pos.x + 10;
  creature.pos.y = sim.state.player.pos.y;
}

describe('ref parity: energizer bonus', () => {
  it('inverts target heading for weak creatures', () => {
    const sim = new Sim({ seed: 41 });

    sim.state.creatures = [{
      id: 2,
      pos: { x: sim.state.player.pos.x + 10, y: sim.state.player.pos.y },
      vel: { x: 0, y: 0 },
      hp: 10,
      hpMax: 400,
      radius: 1,
      speed: 3,
      touchDamage: 0,
      touchCooldownTicks: 0,
      alive: true,
      kind: 'grunt',
      heading: 0,
      targetHeading: 0,
      moveScale: 1.0,
      aiMode: 0,
      flags: 0,
      linkIndex: -1,
      targetOffsetX: 0,
      targetOffsetY: 0,
      phaseSeed: 0,
      orbitAngle: 0,
      orbitRadius: 0,
      targetPos: { x: sim.state.player.pos.x + 10, y: sim.state.player.pos.y },
      forceTarget: 0,
    }];

    sim.state.player.activeEffects.energizer = 60;

    sim.step(EMPTY_INPUT);

    const creature = sim.state.creatures[0];
    if (!creature) {
      throw new Error('Expected creature to still exist');
    }

    const dx = sim.state.player.pos.x - creature.pos.x;
    const dy = sim.state.player.pos.y - creature.pos.y;

    const dotProduct = dx * creature.vel.x + dy * creature.vel.y;

    expect(dotProduct).toBeLessThan(0);
  });

  it('eat kills award xp without contact damage', () => {
    const sim = new Sim({ seed: 42 });
    setupOverlap(sim);
    sim.state.player.activeEffects.energizer = 60;

    const creature = sim.state.creatures[0];
    if (!creature) {
      throw new Error('Expected creature to spawn');
    }

    const initialHp = sim.state.player.hp;
    const initialXp = sim.state.player.xp;
    const events: any[] = [];
    resolveCollisions(sim.state, events);

    expect(sim.state.player.hp).toBe(initialHp);
    expect(creature.alive).toBe(false);
    expect(sim.state.player.xp).toBeGreaterThan(initialXp);
    expect(events.some((e) => e.type === 'pickup' && e.bonusType === 'ui_bonus')).toBe(false);
  });
});
