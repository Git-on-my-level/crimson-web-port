import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { updateWeapons } from '../src/sim/systems/weapons';
import { EMPTY_INPUT } from '../src/sim/types';
import { WEAPON_BY_ID } from '../src/content/weapons';
import { Rng } from '../src/sim/rng';

const AIM_JITTER_MASK = 0x1ff;
const AIM_JITTER_SCALE = (2 * Math.PI) / 512;
const AIM_JITTER_MAG_SCALE = 1 / 512;

function computeExpectedAngle(seed: number, spreadHeat: number, aimX: number, aimY: number): number {
  const rng = new Rng(seed);
  const dx = aimX;
  const dy = aimY;
  const dist = Math.hypot(dx, dy);
  const maxOffset = dist * spreadHeat * 0.5;
  const jitterDir = rng.nextUint32() & AIM_JITTER_MASK;
  const jitterMag = rng.nextUint32() & AIM_JITTER_MASK;
  const jitterAngle = jitterDir * AIM_JITTER_SCALE;
  const jitterOffset = maxOffset * (jitterMag * AIM_JITTER_MAG_SCALE);
  const jitteredAimX = aimX + Math.cos(jitterAngle) * jitterOffset;
  const jitteredAimY = aimY + Math.sin(jitterAngle) * jitterOffset;
  return Math.atan2(jitteredAimY, jitteredAimX);
}

describe('Player aim jitter determinism', () => {
  it('produces deterministic shot angles for a fixed seed', () => {
    const sim = new Sim({ seed: 5 });
    const weapon = WEAPON_BY_ID.pistol;

    sim.state.rng.seed(123);
    sim.state.player.weaponId = 'pistol';
    sim.state.player.ammo = weapon.ammoMax ?? 0;
    sim.state.player.shotCooldown = 0;
    sim.state.player.reloadTimer = 0;
    sim.state.player.spreadHeat = 0.25;
    sim.state.player.input = { ...EMPTY_INPUT, aimX: 12, aimY: 0, fire: true };

    const expectedAngle = computeExpectedAngle(123, 0.25, 12, 0);

    const events: Array<{ type: string; vel?: { x: number; y: number } }> = [];
    updateWeapons(sim.state, events as any, sim.fixedDeltaSeconds);

    const shot = events.find((event) => event.type === 'spawnProjectile');
    expect(shot).toBeTruthy();

    const vel = shot?.vel ?? { x: 0, y: 0 };
    const actualAngle = Math.atan2(vel.y, vel.x);

    expect(actualAngle).toBeCloseTo(expectedAngle, 6);
  });
});
