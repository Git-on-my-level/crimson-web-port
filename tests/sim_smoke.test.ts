import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import type { InputFrame } from '../src/sim/types';
import { getCreatureDef } from '../src/content/creatures';
import { createQuestModeState } from '../src/sim/state';

const TOTAL_TICKS = 240;
const FIRE_START_TICK = 24;
const FIRE_END_TICK = 180;
const FIRE_INTERVAL_TICKS = 12;

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

function scriptedInput(sim: Sim, tick: number): InputFrame {
  const phase = Math.floor(tick / 60) % 4;
  let moveX = 0;
  let moveY = 0;
  if (phase === 0) moveX = 1;
  if (phase === 1) moveY = 1;
  if (phase === 2) moveX = -1;
  if (phase === 3) moveY = -1;

  const fire = tick >= FIRE_START_TICK && tick <= FIRE_END_TICK && tick % FIRE_INTERVAL_TICKS === 0;

  return {
    moveX,
    moveY,
    aimX: sim.state.player.pos.x + 20,
    aimY: sim.state.player.pos.y,
    fire,
    reload: false,
    weaponSwitch: null,
    pause: false,
    perkChoice: null,
  };
}

function hashSnapshot(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

describe('Sim smoke test', () => {
  it('runs a scripted loop deterministically', () => {
    const sim = new Sim({ seed: 2026 });
    sim.state.mode = 'quest';
    sim.state.modeState = createQuestModeState();

    spawnGrunt(sim, 18, 0);
    spawnGrunt(sim, 26, 3);

    for (let tick = 0; tick < TOTAL_TICKS; tick += 1) {
      const input = scriptedInput(sim, tick);
      sim.step(input);
    }

    expect(sim.state.tick).toBe(TOTAL_TICKS);

    expect(sim.state.score).toBe(10);
    expect(sim.state.creatures.length).toBe(1);
    expect(sim.state.projectiles.length).toBe(0);

    expect(sim.state.player.hp).toBeGreaterThan(0);

    const snapshot = {
      tick: sim.state.tick,
      score: sim.state.score,
      playerHp: sim.state.player.hp,
      playerPos: {
        x: Number(sim.state.player.pos.x.toFixed(3)),
        y: Number(sim.state.player.pos.y.toFixed(3)),
      },
      creatures: sim.state.creatures.map((creature) => ({
        id: creature.id,
        hp: creature.hp,
        x: Number(creature.pos.x.toFixed(3)),
        y: Number(creature.pos.y.toFixed(3)),
      })),
      projectiles: sim.state.projectiles.map((projectile) => ({
        id: projectile.id,
        x: Number(projectile.pos.x.toFixed(3)),
        y: Number(projectile.pos.y.toFixed(3)),
      })),
    };

    const hash = hashSnapshot(JSON.stringify(snapshot));
    expect(hash).toBe('c6fb9395');
  });
});
