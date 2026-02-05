// @parity-tags: parity-system/bonuses, ref-test/double-xp
import { describe, expect, it } from 'vitest';
import { createSimState } from '../../src/sim/state';
import { spawnCreatureAtPosition } from '../../src/sim/systems/creatures';
import { resolveCollisions } from '../../src/sim/systems/collision';
import { getCreatureDef } from '../../src/content/creatures';
import { grantXp } from '../../src/sim/systems/progression';

describe('ref parity: double xp bonus', () => {
  it('doubles xp when double xp bonus is active', () => {
    const state = createSimState(100);
    state.player.xp = 100;
    state.player.activeEffects.double_xp = 300;

    const creatureDef = getCreatureDef('grunt');
    const events: any[] = [];
    grantXp(state, events, creatureDef.xpValue);

    expect(state.player.xp).toBe(100 + creatureDef.xpValue * 2);
  });

  it('awards normal xp when double xp bonus is inactive', () => {
    const state = createSimState(101);
    state.player.xp = 100;

    const creatureDef = getCreatureDef('grunt');
    const events: any[] = [];
    grantXp(state, events, creatureDef.xpValue);

    expect(state.player.xp).toBe(100 + creatureDef.xpValue);
  });

  it('doubles xp on creature kill with double xp bonus active', () => {
    const state = createSimState(102);
    state.player.xp = 100;
    state.player.activeEffects.double_xp = 300;

    const spawnEvents: any[] = [];
    spawnCreatureAtPosition(state, spawnEvents, 'grunt', { x: 5, y: 0 });

    const creature = state.creatures[0];
    if (!creature) {
      throw new Error('Expected creature to spawn');
    }

    const initialXp = state.player.xp;
    const killEvents: any[] = [];
    creature.hp = 0;
    creature.alive = false;

    killEvents.push({ type: 'death', target: 'creature', id: creature.id });
    state.score += getCreatureDef('grunt').scoreValue;
    grantXp(state, killEvents, getCreatureDef('grunt').xpValue);

    expect(state.player.xp).toBe(initialXp + getCreatureDef('grunt').xpValue * 2);
  });
});
