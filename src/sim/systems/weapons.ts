import { WEAPONS } from '../../content/weapons';
import type { SimState } from '../state';
import type { SimEvent } from '../types';

const DEFAULT_PROJECTILE_RADIUS = 0.4;

export function updateWeapons(state: SimState, events: SimEvent[], dt: number): void {
  const player = state.player;
  if (player.fireCooldown > 0) {
    player.fireCooldown = Math.max(0, player.fireCooldown - 1);
  }

  const weapon = WEAPONS[player.weaponId] ?? WEAPONS[0];
  if (!weapon) {
    return;
  }

  if (!player.input.fire || player.fireCooldown > 0) {
    return;
  }

  const spread = weapon.spreadRadians;
  const spreadOffset = spread > 0 ? (state.rng.nextFloat01() - 0.5) * spread : 0;
  const angle = player.aimAngle + spreadOffset;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const muzzleOffset = weapon.muzzleOffset;

  const pos = {
    x: player.pos.x + dirX * muzzleOffset,
    y: player.pos.y + dirY * muzzleOffset,
  };
  const vel = {
    x: dirX * weapon.projectileSpeed,
    y: dirY * weapon.projectileSpeed,
  };

  const projectileId = state.nextEntityId++;
  const lifeTicks = Math.max(1, Math.round(weapon.projectileLifeSeconds / dt));

  state.projectiles.push({
    id: projectileId,
    pos,
    vel,
    alive: true,
    radius: DEFAULT_PROJECTILE_RADIUS,
    damage: weapon.damage,
    lifeTicksRemaining: lifeTicks,
    owner: 'player',
    kind: weapon.id,
  });

  events.push({ type: 'spawnProjectile', id: projectileId, pos, vel, kind: weapon.id });
  events.push({ type: 'playSfx', name: 'pistol_shot' });

  const cooldownTicks = Math.max(1, Math.round((1 / weapon.fireRate) / dt));
  player.fireCooldown = cooldownTicks;
}
