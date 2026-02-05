import type { WeaponDef } from '../../content/weapons';
import { getProjectileProfile } from '../../content/projectiles';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { assignWeapon, getWeaponById, getWeaponOrder, isWeaponAvailable } from '../weapons/weaponTable';
import { spawnProjectile } from './projectiles';
import { getDamageMultiplier, getReloadRateMultiplier } from './bonuses';

const DEFAULT_PROJECTILE_RADIUS = 0.4;

const BURST_COOLDOWN_SECONDS = 0.0667;
const SHARPSHOOTER_SPREAD_HEAT = 0.02;
const SPREAD_HEAT_CAP = 0.48;
const SPREAD_HEAT_SCALE = 1.3;
const AIM_JITTER_MASK = 0x1ff;
const AIM_JITTER_SCALE = (2 * Math.PI) / 512;
const AIM_JITTER_MAG_SCALE = 1 / 512;
const PELLET_JITTER_RANGE = 200;

export function updateWeapons(state: SimState, events: SimEvent[], dt: number): void {
  const player = state.player;

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

  if (player.reloadTimer > 0) {
    const reloadRateMultiplier = getReloadRateMultiplier(player);
    player.reloadTimer = Math.max(0, player.reloadTimer - dt * reloadRateMultiplier);
    if (player.reloadTimer <= 0 && weapon.ammoMax !== undefined) {
      player.ammo = weapon.ammoMax;
    }
  }

  if (shouldStartReload(player, weapon)) {
    player.reloadTimer = Math.max(0, weapon.reloadTime ?? 0);
    return;
  }

  if (!player.input.fire || player.shotCooldown > 0 || player.reloadTimer > 0) {
    return;
  }

  const damageMultiplier = getDamageMultiplier(player);

  if (weapon.ammoMax !== undefined && player.ammo <= 0) {
    if (weapon.reloadTime !== undefined) {
      player.reloadTimer = Math.max(0, weapon.reloadTime ?? 0);
    }
    return;
  }

  const aimDx = player.input.aimX - player.pos.x;
  const aimDy = player.input.aimY - player.pos.y;
  const aimDist = Math.hypot(aimDx, aimDy);
  const aimMaxOffset = aimDist * player.spreadHeat * 0.5;
  const jitterDir = state.rng.nextUint32() & AIM_JITTER_MASK;
  const jitterMag = state.rng.nextUint32() & AIM_JITTER_MASK;
  const jitterAngle = jitterDir * AIM_JITTER_SCALE;
  const jitterOffset = aimMaxOffset * (jitterMag * AIM_JITTER_MAG_SCALE);
  const jitteredAimX = player.input.aimX + Math.cos(jitterAngle) * jitterOffset;
  const jitteredAimY = player.input.aimY + Math.sin(jitterAngle) * jitterOffset;
  const shotAngle = Math.atan2(jitteredAimY - player.pos.y, jitteredAimX - player.pos.x);

  const fireBulletsActive = (player.activeEffects['fire_bullets'] ?? 0) > 0;
  const pellets = fireBulletsActive ? getFireBulletsPelletCount(weapon.id) : Math.max(1, weapon.pellets ?? 1);
  const muzzleOffset = weapon.muzzleOffset;
  const lifeTicks = Math.max(1, weapon.projectileLifeTicks);
  const projectileSpeed = weapon.projectileSpeed * player.perkStats.projectileSpeedMultiplier;
  const projectileProfile = getProjectileProfile(weapon.projectileProfileId);
  const projectileRadius = projectileProfile.projectileRadius ?? DEFAULT_PROJECTILE_RADIUS;
  const pierceRemaining = projectileProfile.pierceCount ?? 0;
  const explosionRadius = projectileProfile.explosionRadius ?? 0;
  const explosionDamage = explosionRadius
    ? weapon.damage * damageMultiplier * (projectileProfile.explosionDamageMultiplier ?? 1)
    : 0;
  const projectileKind = fireBulletsActive ? 'fire_bullets' : weapon.id;
  const pelletJitterStep = getPelletJitterStep(weapon.id);

  for (let i = 0; i < pellets; i += 1) {
    const pelletJitter = pellets > 1 ? (state.rng.nextUint32() % PELLET_JITTER_RANGE) - 100 : 0;
    const angle = shotAngle + pelletJitter * pelletJitterStep;
    const pDirX = Math.cos(angle);
    const pDirY = Math.sin(angle);

    const posX = player.pos.x + pDirX * muzzleOffset;
    const posY = player.pos.y + pDirY * muzzleOffset;
    const velX = pDirX * projectileSpeed;
    const velY = pDirY * projectileSpeed;

    spawnProjectile(
      state,
      events,
      { x: posX, y: posY },
      { x: velX, y: velY },
      projectileKind,
      weapon.damage * damageMultiplier,
      lifeTicks,
      'player',
      projectileRadius,
      {
        pierceRemaining,
        explosionRadius,
        explosionDamage,
      },
    );
  }

  if (weapon.ammoMax !== undefined) {
    player.ammo = Math.max(0, player.ammo - 1);
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });

  const hasFastshot = (player.perks['spray_and_pray'] ?? 0) > 0;
  const hasSharpshooter = (player.perks['sharpshooter'] ?? 0) > 0;
  let shotCooldown = Math.max(0, weapon.shotCooldown ?? 0);
  if (hasFastshot) {
    shotCooldown *= 0.88;
  }
  if (hasSharpshooter) {
    shotCooldown *= 1.05;
  }
  if (weapon.fireMode === 'burst') {
    shotCooldown = Math.max(shotCooldown, BURST_COOLDOWN_SECONDS);
  }
  player.shotCooldown = Math.max(0, shotCooldown);

  if (!hasSharpshooter) {
    const spreadHeatBase = weapon.spreadHeatInc ?? 0;
    const spreadHeatNext = Math.max(0, player.spreadHeat + spreadHeatBase * SPREAD_HEAT_SCALE);
    player.spreadHeat = Math.min(SPREAD_HEAT_CAP, spreadHeatNext);
  } else {
    player.spreadHeat = SHARPSHOOTER_SPREAD_HEAT;
  }
}

export function getFireBulletsPelletCount(weaponId: WeaponDef['id']): number {
  const weapon = getWeaponById(weaponId);
  if (!weapon) {
    return 1;
  }
  return Math.max(1, weapon.pellets ?? 1);
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
  const projectileSpeed = weapon.projectileSpeed * player.perkStats.projectileSpeedMultiplier;
  const projectileProfile = getProjectileProfile(weapon.projectileProfileId);
  const projectileRadius = projectileProfile.projectileRadius ?? DEFAULT_PROJECTILE_RADIUS;
  const pierceRemaining = projectileProfile.pierceCount ?? 0;
  const explosionRadius = projectileProfile.explosionRadius ?? 0;
  const explosionDamage = explosionRadius
    ? weapon.damage * damageMultiplier * (projectileProfile.explosionDamageMultiplier ?? 1)
    : 0;

  for (let i = 0; i < projectilesPerTick; i++) {
    const angleOffset = (i / projectilesPerTick) * Math.PI * 2;
    const rotationAngle = tickOffset * rotationSpeed;
    const totalAngle = player.aimAngle + angleOffset + rotationAngle;

    const dirX = Math.cos(totalAngle);
    const dirY = Math.sin(totalAngle);

    const posX = player.pos.x + dirX * weapon.muzzleOffset;
    const posY = player.pos.y + dirY * weapon.muzzleOffset;
    const velX = dirX * projectileSpeed;
    const velY = dirY * projectileSpeed;

    spawnProjectile(
      state,
      events,
      { x: posX, y: posY },
      { x: velX, y: velY },
      weapon.id,
      weapon.damage * damageMultiplier,
      lifeTicks,
      'player',
      projectileRadius,
      {
        pierceRemaining,
        explosionRadius,
        explosionDamage,
      },
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

  if (!isWeaponAvailable(player, nextWeapon)) {
    return false;
  }

  assignWeapon(player, nextWeapon);
  return true;
}

function shouldStartReload(player: SimState['player'], weapon: WeaponDef): boolean {
  if (weapon.ammoMax === undefined || weapon.reloadTime === undefined) {
    return false;
  }
  if (player.reloadTimer > 0) {
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

function getPelletJitterStep(weaponId: WeaponDef['id']): number {
  if (weaponId === 'shotgun' || weaponId === 'jackhammer') {
    return 0.0013;
  }
  if (weaponId === 'sawed_off_shotgun') {
    return 0.004;
  }
  return 0.0015;
}
