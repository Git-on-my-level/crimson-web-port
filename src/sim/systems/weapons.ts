import type { WeaponDef } from '../../content/weapons';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { getWeaponById, getWeaponOrder } from '../weapons/weaponTable';

const DEFAULT_PROJECTILE_RADIUS = 0.4;

export function updateWeapons(state: SimState, events: SimEvent[], dt: number): void {
  const player = state.player;

  if (player.fireCooldownTicks > 0) {
    player.fireCooldownTicks = Math.max(0, player.fireCooldownTicks - 1);
  }

  if (player.input.weaponSwitch !== null) {
    const switched = switchWeapon(player, player.input.weaponSwitch);
    if (switched) {
      events.push({ type: 'playSfx', name: 'weapon_switch' });
    }
  }

  const weapon = getWeaponById(player.weaponId);
  if (!weapon) {
    return;
  }

  if (player.reloadTicksRemaining > 0) {
    player.reloadTicksRemaining = Math.max(0, player.reloadTicksRemaining - 1);
    if (player.reloadTicksRemaining === 0 && weapon.ammoMax !== undefined) {
      player.ammo = weapon.ammoMax;
    }
  }

  if (shouldStartReload(player, weapon)) {
    player.reloadTicksRemaining = weapon.reloadTicks ?? 0;
    return;
  }

  if (!player.input.fire || player.fireCooldownTicks > 0 || player.reloadTicksRemaining > 0) {
    return;
  }

  if (weapon.ammoMax !== undefined && player.ammo <= 0) {
    if (weapon.reloadTicks !== undefined) {
      player.reloadTicksRemaining = weapon.reloadTicks;
    }
    return;
  }

  const pellets = Math.max(1, weapon.pellets ?? 1);
  const spread = weapon.spreadRadians ?? 0;
  const muzzleOffset = weapon.muzzleOffset;

  for (let i = 0; i < pellets; i += 1) {
    const spreadOffset = spread > 0 ? (state.rng.nextFloat01() - 0.5) * spread : 0;
    const angle = player.aimAngle + spreadOffset;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const pos = {
      x: player.pos.x + dirX * muzzleOffset,
      y: player.pos.y + dirY * muzzleOffset,
    };
    const vel = {
      x: dirX * weapon.projectileSpeed,
      y: dirY * weapon.projectileSpeed,
    };

    const projectileId = state.nextEntityId++;
    const lifeTicks = Math.max(1, weapon.projectileLifeTicks);

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
  }

  if (weapon.ammoMax !== undefined) {
    player.ammo = Math.max(0, player.ammo - 1);
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });

  const cooldownTicks = Math.max(1, Math.round((1 / weapon.fireRate) / dt));
  player.fireCooldownTicks = cooldownTicks;
}

function switchWeapon(player: SimState['player'], slot: number): boolean {
  const order = getWeaponOrder();
  const index = slot - 1;
  const nextWeapon = order[index];
  if (!nextWeapon || nextWeapon === player.weaponId) {
    return false;
  }

  player.weaponId = nextWeapon;
  player.fireCooldownTicks = 0;
  player.reloadTicksRemaining = 0;
  const def = getWeaponById(nextWeapon);
  if (def.ammoMax !== undefined) {
    player.ammo = def.ammoMax;
  } else {
    player.ammo = 0;
  }
  return true;
}

function shouldStartReload(player: SimState['player'], weapon: WeaponDef): boolean {
  if (weapon.ammoMax === undefined || weapon.reloadTicks === undefined) {
    return false;
  }
  if (player.reloadTicksRemaining > 0) {
    return false;
  }
  if (!player.input.reload && player.ammo > 0) {
    return false;
  }
  if (player.ammo >= weapon.ammoMax) {
    return false;
  }
  return true;
}
