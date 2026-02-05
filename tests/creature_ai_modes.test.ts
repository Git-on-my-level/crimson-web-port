import { describe, expect, it } from 'vitest';
import type { CreatureState } from '../src/sim/state';
import type { Vec2 } from '../src/sim/types';
import { creatureAi7TickLinkTimer, creatureAiUpdateTarget } from '../src/sim/creatures/ai';

function makeCreature(x: number, y: number, overrides: Partial<CreatureState> = {}): CreatureState {
  const base: CreatureState = {
    id: 1,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    hp: 100,
    hpMax: 100,
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
    phaseSeed: 1,
    orbitAngle: 0,
    orbitRadius: 0,
    targetPos: { x, y },
    forceTarget: 0,
  };

  const pos = overrides.pos ?? base.pos;
  const targetPos = overrides.targetPos ?? { x: pos.x, y: pos.y };

  return {
    ...base,
    ...overrides,
    pos,
    targetPos,
  };
}

function vec(x: number, y: number): Vec2 {
  return { x, y };
}

describe('creature AI modes', () => {
  it('mode 0: orbit offsets when near, direct target when far', () => {
    const creature = makeCreature(0, 0, { aiMode: 0, phaseSeed: 0 });
    const playerFar = vec(900, 0);
    creatureAiUpdateTarget(creature, playerFar, [creature], 0);
    expect(creature.targetPos.x).toBe(playerFar.x);
    expect(creature.targetPos.y).toBe(playerFar.y);

    const playerNear = vec(100, 0);
    creatureAiUpdateTarget(creature, playerNear, [creature], 0);
    const orbitPhase = 0 * 3.7 * Math.PI;
    expect(creature.targetPos.x).toBeCloseTo(playerNear.x + Math.cos(orbitPhase) * 100 * 0.85, 5);
    expect(creature.targetPos.y).toBeCloseTo(playerNear.y + Math.sin(orbitPhase) * 100 * 0.85, 5);
  });

  it('mode 1: tighter orbit than mode 0', () => {
    const creature = makeCreature(0, 0, { aiMode: 1, phaseSeed: 0 });
    const playerNear = vec(120, 0);
    creatureAiUpdateTarget(creature, playerNear, [creature], 0);
    const dist = Math.hypot(playerNear.x, playerNear.y);
    const orbitPhase = 0 * 3.7 * Math.PI;
    expect(creature.targetPos.x).toBeCloseTo(playerNear.x + Math.cos(orbitPhase) * dist * 0.55, 5);
    expect(creature.targetPos.y).toBeCloseTo(playerNear.y + Math.sin(orbitPhase) * dist * 0.55, 5);
  });

  it('mode 8: wide orbit without distance cutoff', () => {
    const creature = makeCreature(0, 0, { aiMode: 8, phaseSeed: 0 });
    const playerNear = vec(200, 0);
    creatureAiUpdateTarget(creature, playerNear, [creature], 0);
    const orbitPhase = 0 * 3.7 * Math.PI;
    expect(creature.targetPos.x).toBeCloseTo(playerNear.x + Math.cos(orbitPhase) * 200 * 0.9, 5);
    expect(creature.targetPos.y).toBeCloseTo(playerNear.y + Math.sin(orbitPhase) * 200 * 0.9, 5);
  });

  it('mode 5: links to target and shrinks move scale near tether', () => {
    const link = makeCreature(50, 0);
    const creature = makeCreature(0, 0, {
      aiMode: 5,
      linkIndex: 0,
      targetOffsetX: 0,
      targetOffsetY: 0,
    });
    const creatures = [link, creature];
    const update = creatureAiUpdateTarget(creature, vec(0, 0), creatures, 0);
    expect(creature.targetPos.x).toBeCloseTo(50, 5);
    expect(creature.targetPos.y).toBeCloseTo(0, 5);
    expect(update.moveScale).toBeCloseTo(50 * 0.015625, 5);
  });

  it('mode 5: invalid link resets mode and applies self-damage', () => {
    const creature = makeCreature(0, 0, { aiMode: 5, linkIndex: 4 });
    const update = creatureAiUpdateTarget(creature, vec(0, 0), [creature], 0);
    expect(creature.aiMode).toBe(0);
    expect(update.selfDamage).toBe(1000);
  });

  it('mode 7: holds until timer expires, then resets', () => {
    const creature = makeCreature(10, -5, { aiMode: 7, orbitRadius: 1.0 });
    creatureAiUpdateTarget(creature, vec(0, 0), [creature], 0.5);
    expect(creature.orbitRadius).toBeCloseTo(0.5, 5);
    expect(creature.aiMode).toBe(7);

    creatureAiUpdateTarget(creature, vec(0, 0), [creature], 1.0);
    expect(creature.orbitRadius).toBeLessThan(0);
    expect(creature.aiMode).toBe(7);

    creatureAiUpdateTarget(creature, vec(0, 0), [creature], 0.1);
    expect(creature.aiMode).toBe(0);
  });

  it('ai7 link timer toggles aiMode when countdown flips', () => {
    const creature = makeCreature(0, 0, { flags: 0x80, linkIndex: -10, aiMode: 0 });
    creatureAi7TickLinkTimer(creature, 20, () => 0);
    expect(creature.aiMode).toBe(7);
    expect(creature.linkIndex).toBe(500);
  });
});
