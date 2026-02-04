import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame, Vec2 } from '../src/sim/types';
import { getCreatureDef } from '../src/content/creatures';

const TOTAL_TICKS = 1800;
const MAX_ITERATIONS = TOTAL_TICKS * 3;
const FIRE_INTERVAL = 6;
const SWITCH_SLOTS: Record<number, number> = {
  300: 2,
  900: 3,
  1500: 4,
};

function aimAtNearest(sim: Sim): Vec2 {
  let bestDist = Number.POSITIVE_INFINITY;
  let best: Vec2 | null = null;
  for (const creature of sim.state.creatures) {
    if (!creature.alive) {
      continue;
    }
    const dx = creature.pos.x - sim.state.player.pos.x;
    const dy = creature.pos.y - sim.state.player.pos.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = creature.pos;
    }
  }
  if (!best) {
    return {
      x: sim.state.player.pos.x + 10,
      y: sim.state.player.pos.y,
    };
  }
  return best;
}

function scriptedInput(sim: Sim, iteration: number): InputFrame {
  if (sim.state.phase === 'PerkSelect') {
    return {
      moveX: 0,
      moveY: 0,
      aimX: sim.state.player.pos.x,
      aimY: sim.state.player.pos.y,
      fire: false,
      reload: false,
      weaponSwitch: null,
      pause: false,
      perkChoice: 1,
    };
  }

  const phase = Math.floor(iteration / 120) % 4;
  let moveX = 0;
  let moveY = 0;
  if (phase === 0) moveX = 1;
  if (phase === 1) moveY = 1;
  if (phase === 2) moveX = -1;
  if (phase === 3) moveY = -1;

  const target = aimAtNearest(sim);
  const weaponSwitch = SWITCH_SLOTS[iteration] ?? null;
  const fire = iteration % FIRE_INTERVAL === 0;

  return {
    moveX,
    moveY,
    aimX: target.x,
    aimY: target.y,
    fire,
    reload: false,
    weaponSwitch,
    pause: false,
    perkChoice: null,
  };
}

function spawnGrunt(sim: Sim, x: number, y: number): void {
  const def = getCreatureDef('grunt');
  const id = sim.state.nextEntityId++;
  sim.state.creatures.push({
    id,
    kind: def.id,
    alive: true,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    hp: def.hp,
    hpMax: def.hp,
    radius: def.radius,
    speed: def.speed,
    touchDamage: def.touchDamage,
    touchCooldownTicks: 0,
  });
}

function expectFinite(value: number, label: string): void {
  expect(Number.isFinite(value), label).toBe(true);
}

function expectFiniteVec(vec: Vec2, label: string): void {
  expectFinite(vec.x, `${label}.x`);
  expectFinite(vec.y, `${label}.y`);
}

describe('Survival smoke', () => {
  it('runs a deterministic survival slice with scripted input', () => {
    const sim = new Sim({ seed: 2026 });
    sim.state.player.hp = 250;
    sim.state.player.hpMax = 250;
    sim.state.player.baseHpMax = 250;
    sim.state.player.pos.x = 950;
    sim.state.player.pos.y = 0;
    spawnGrunt(sim, 960, 2);
    spawnGrunt(sim, 955, -4);
    spawnGrunt(sim, 948, 6);

    let iterations = 0;
    while (sim.state.tick < TOTAL_TICKS && iterations < MAX_ITERATIONS) {
      const input = scriptedInput(sim, iterations);
      sim.step(input);
      iterations += 1;
    }

    expect(iterations).toBeLessThan(MAX_ITERATIONS);
    expect(sim.state.tick).toBe(TOTAL_TICKS);
    expect(sim.state.phase).not.toBe('GameOver');

    expect(sim.state.score).toBe(220);
    expect(sim.state.player.level).toBe(4);
    expect(sim.state.creatures.length).toBe(1);
    expect(sim.state.projectiles.length).toBe(4);
  });

  it('keeps positions finite and HP clamped to max', () => {
    const sim = new Sim({ seed: 777 });
    sim.state.player.hp = 200;
    sim.state.player.hpMax = 200;
    sim.state.player.baseHpMax = 200;
    sim.state.player.pos.x = 900;
    sim.state.player.pos.y = -200;

    let iterations = 0;
    while (sim.state.tick < 1200 && iterations < 2000) {
      const input = scriptedInput(sim, iterations);
      sim.step(input);

      expectFiniteVec(sim.state.player.pos, 'player.pos');
      expect(sim.state.player.hp).toBeLessThanOrEqual(sim.state.player.hpMax);

      for (const creature of sim.state.creatures) {
        expectFiniteVec(creature.pos, `creature.${creature.id}.pos`);
        expect(creature.hp).toBeLessThanOrEqual(creature.hpMax);
      }

      for (const projectile of sim.state.projectiles) {
        expectFiniteVec(projectile.pos, `projectile.${projectile.id}.pos`);
      }

      for (const bonus of sim.state.bonuses) {
        expectFiniteVec(bonus.pos, `bonus.${bonus.id}.pos`);
      }

      iterations += 1;
    }
  });
});
