import type { WeaponDef } from '../../content/weapons';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { getWeaponById, getWeaponOrder } from '../weapons/weaponTable';
import { spawnProjectile } from './projectiles';
import { getDamageMultiplier, getFireRateMultiplier } from './bonuses';

const DEFAULT_PROJECTILE_RADIUS = 0.4;

const BURST_COOLDOWN = 4;

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

  const damageMultiplier = getDamageMultiplier(player);

  if (weapon.ammoMax !== undefined && player.ammo <= 0) {
    if (weapon.reloadTicks !== undefined) {
      player.reloadTicksRemaining = weapon.reloadTicks;
    }
    return;
  }

  const pellets = Math.max(1, weapon.pellets ?? 1);
  const spread = weapon.spreadRadians ?? 0;
  const muzzleOffset = weapon.muzzleOffset;
  const lifeTicks = Math.max(1, weapon.projectileLifeTicks);

  for (let i = 0; i < pellets; i += 1) {
    const spreadOffset = spread > 0 ? (state.rng.nextFloat01() - 0.5) * spread : 0;
    const angle = player.aimAngle + spreadOffset;
    const pDirX = Math.cos(angle);
    const pDirY = Math.sin(angle);

    const posX = player.pos.x + pDirX * muzzleOffset;
    const posY = player.pos.y + pDirY * muzzleOffset;
    const velX = pDirX * weapon.projectileSpeed;
    const velY = pDirY * weapon.projectileSpeed;

    spawnProjectile(
      state,
      events,
      { x: posX, y: posY },
      { x: velX, y: velY },
      weapon.id,
      weapon.damage * damageMultiplier,
      lifeTicks,
      'player',
      DEFAULT_PROJECTILE_RADIUS,
    );
  }

  if (weapon.ammoMax !== undefined) {
    player.ammo = Math.max(0, player.ammo - 1);
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });

  const fireRateMultiplier = getFireRateMultiplier(player);
  let cooldownTicks = Math.max(1, Math.round((1 / (weapon.fireRate * fireRateMultiplier)) / dt));
  if (weapon.fireMode === 'burst') {
    cooldownTicks = Math.max(cooldownTicks, BURST_COOLDOWN);
  }
  player.fireCooldownTicks = cooldownTicks;
}

export function fireSpiralPattern(
  state: SimState,
  events: SimEvent[],
  weapon: WeaponDef,
  projectilesPerTick: number,
  rotationSpeed: number,
  tickOffset: number,
): void {
  const player = state.player;
  const lifeTicks = Math.max(1, weapon.projectileLifeTicks);
  const damageMultiplier = getDamageMultiplier(player);

  for (let i = 0; i < projectilesPerTick; i++) {
    const angleOffset = (i / projectilesPerTick) * Math.PI * 2;
    const rotationAngle = tickOffset * rotationSpeed;
    const totalAngle = player.aimAngle + angleOffset + rotationAngle;

    const dirX = Math.cos(totalAngle);
    const dirY = Math.sin(totalAngle);

    const posX = player.pos.x + dirX * weapon.muzzleOffset;
    const posY = player.pos.y + dirY * weapon.muzzleOffset;
    const velX = dirX * weapon.projectileSpeed;
    const velY = dirY * weapon.projectileSpeed;

    spawnProjectile(
      state,
      events,
      { x: posX, y: posY },
      { x: velX, y: velY },
      weapon.id,
      weapon.damage * damageMultiplier,
      lifeTicks,
      'player',
      DEFAULT_PROJECTILE_RADIUS,
    );
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });
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
