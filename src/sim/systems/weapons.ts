import type { WeaponDef } from '../../content/weapons';
import { getProjectileProfile } from '../../content/projectiles';
import { PROJECTILE_BY_TYPE_ID } from '../../content/projectiles.generated';
import type { SimState } from '../state';
import type { SimEvent } from '../types';
import { assignWeapon, getWeaponById, getWeaponOrder, isWeaponAvailable } from '../weapons/weaponTable';
import { spawnProjectile } from './projectiles';
import { spawnSecondaryProjectile } from './secondaryProjectiles';
import { spawnParticleFast, spawnParticleSlow } from './particles';
import { getDamageMultiplier, getReloadRateMultiplier } from './bonuses';
import { applyDamageToPlayer } from './collision';
import { refRadius } from '../modes/survival_ref';

const DEFAULT_PROJECTILE_RADIUS = 0.4;
const ANGRY_RELOADER_PROJECTILE_TYPE_ID = 0x0b;
const ANGRY_RELOADER_ANGLE_OFFSET = 0.1;

const WEAPON_TO_PROJECTILE_TYPE_ID: Record<string, number | null> = {
  'pistol': 0x01,
  'assault_rifle': 0x02,
  'shotgun': 0x03,
  'sawed_off_shotgun': 0x03,
  'submachine_gun': 0x05,
  'gauss_gun': 0x06,
  'mean_minigun': 0x01,
  'flamethrower': null,
  'plasma_rifle': 0x09,
  'multi_plasma': 0x09,
  'plasma_minigun': 0x0B,
  'rocket_launcher': null,
  'seeker_rockets': null,
  'plasma_shotgun': 0x0B,
  'blow_torch': null,
  'hr_flamer': null,
  'mini_rocket_swarmers': null,
  'rocket_minigun': null,
  'pulse_gun': 0x13,
  'jackhammer': 0x03,
  'ion_rifle': 0x15,
  'ion_minigun': 0x16,
  'ion_cannon': 0x17,
  'shrinkifier_5k': 0x18,
  'blade_gun': 0x19,
  'spider_plasma': 0x1A,
  'evil_scythe': null,
  'plasma_cannon': 0x1C,
  'splitter_gun': 0x1D,
  'gauss_shotgun': 0x06,
  'ion_shotgun': 0x16,
  'flameburst': null,
  'raygun': null,
  'unknown_34': null,
  'unknown_35': null,
  'unknown_36': null,
  'unknown_37': null,
  'unknown_38': null,
  'unknown_39': null,
  'unknown_40': null,
  'plague_sphreader_gun': 0x29,
  'bubblegun': null,
  'rainbow_gun': 0x2B,
  'grim_weapon': null,
  'fire_bullets': 0x2D,
  'unknown_46': null,
  'unknown_47': null,
  'unknown_48': null,
  'unknown_49': null,
  'transmutator': null,
  'blaster_r_300': null,
  'lighting_rifle': null,
  'nuke_launcher': null,
};

const BURST_COOLDOWN_SECONDS = 0.0667;
const SHARPSHOOTER_SPREAD_HEAT = 0.02;
const SPREAD_HEAT_CAP = 0.48;
const SPREAD_HEAT_SCALE = 1.3;
const AIM_JITTER_MASK = 0x1ff;
const AIM_JITTER_SCALE = (2 * Math.PI) / 512;
const AIM_JITTER_MAG_SCALE = 1 / 512;
const PELLET_JITTER_RANGE = 200;
const NATIVE_MUZZLE_FORWARD_OFFSET = refRadius(16);
const PISTOL_MUZZLE_LATERAL_OFFSET = refRadius(4);
const PROJECTILE_SPEED_META_CAP = 80;
export function updateWeapons(state: SimState, events: SimEvent[], dt: number): void {
  const player = state.player;
  const reloadWasDown = player.prevReloadPressed;

  const firePressed = player.input.fire && !player.prevFirePressed;
  const reloadPressed = player.input.reload && !player.prevReloadPressed;
  player.prevFirePressed = player.input.fire;
  player.prevReloadPressed = player.input.reload;

  if (player.input.weaponSwitch !== null) {
    const switched = switchWeapon(player, player.input.weaponSwitch);
    if (switched) {
      events.push({ type: 'playSfx', name: 'weapon_switch' });
    }
  }

  const hasAlternateWeapon = (player.perks['alternate_weapon'] ?? 0) > 0;
  const altSwapped = reloadPressed && hasAlternateWeapon && player.altWeaponId !== null;
  if (altSwapped) {
    swapAltWeapon(player);
    events.push({ type: 'playSfx', name: 'weapon_switch' });
    player.shotCooldown = Math.max(0, player.shotCooldown + 0.1);
  }

  const weapon = getWeaponById(player.weaponId);
  if (!weapon) {
    return;
  }

  const hasAnxiousLoader = (player.perks['anxious_loader'] ?? 0) > 0;
  const hasStationaryReloader = (player.perks['stationary_reloader'] ?? 0) > 0;
  const hasAngryReloader = (player.perks['angry_reloader'] ?? 0) > 0;
  const hasRegressionBullets = (player.perks['regression_bullets'] ?? 0) > 0;
  const hasAmmunitionWithin = (player.perks['ammunition_within'] ?? 0) > 0;

  if (player.reloadTimer > 0 && hasAnxiousLoader && firePressed) {
    player.reloadTimer = Math.max(0, player.reloadTimer - 0.05);
  }

  if (player.reloadTimer > 0) {
    const moving = Math.hypot(player.input.moveX, player.input.moveY) > 0.01;
    let reloadRateMultiplier = getReloadRateMultiplier(player);
    if (!moving && hasStationaryReloader) {
      reloadRateMultiplier *= 3.0;
    }

    if (
      hasAngryReloader &&
      player.reloadTimerMax > 0.5 &&
      player.reloadTimer > player.reloadTimerMax * 0.5
    ) {
      const half = player.reloadTimerMax * 0.5;
      const nextTimer = player.reloadTimer - dt * reloadRateMultiplier;
      player.reloadTimer = nextTimer;
      if (nextTimer <= half) {
        const count = 7 + Math.floor(player.reloadTimerMax * 4.0);
        spawnAngryReloadRing(state, events, count, ANGRY_RELOADER_ANGLE_OFFSET);
      }
    } else {
      player.reloadTimer = Math.max(0, player.reloadTimer - dt * reloadRateMultiplier);
    }

    if (player.reloadTimer <= 0 && weapon.ammoMax !== undefined) {
      player.ammo = weapon.ammoMax;
      player.reloadTimerMax = 0;
    }
  }

  if (shouldStartReload(player, weapon, altSwapped, reloadWasDown)) {
    player.reloadTimer = Math.max(0, weapon.reloadTime ?? 0);
    player.reloadTimerMax = player.reloadTimer;
    return;
  }

  if (!player.input.fire || player.shotCooldown > 0) {
    return;
  }

  const damageMultiplier = getDamageMultiplier(player);

  const ammoClass = weapon.ammoClass ?? 0;
  const reloadTime = weapon.reloadTime ?? 0;
  let firingDuringReload = false;
  if (player.reloadTimer > 0) {
    if (weapon.ammoMax !== undefined && player.ammo <= 0 && player.xp > 0) {
      if (hasRegressionBullets) {
        firingDuringReload = true;
        const factor = ammoClass === 1 ? 4 : 200;
        player.xp = Math.max(0, Math.floor(player.xp - reloadTime * factor));
      } else if (hasAmmunitionWithin) {
        firingDuringReload = true;
        const cost = ammoClass === 1 ? 0.15 : 1.0;
        applyDamageToPlayer(state, cost, events);
      } else {
        return;
      }
    } else {
      return;
    }
  }

  if (weapon.ammoMax !== undefined && player.ammo <= 0 && !firingDuringReload) {
    if (weapon.reloadTime !== undefined) {
      player.reloadTimer = Math.max(0, weapon.reloadTime ?? 0);
      player.reloadTimerMax = player.reloadTimer;
    }
    return;
  }

  const aimDx = player.input.aimX - player.pos.x;
  const aimDy = player.input.aimY - player.pos.y;
  const aimDist = Math.hypot(aimDx, aimDy);
  const aimMaxOffset = aimDist * player.spreadHeat * 0.5;
  const aimDirX = aimDist > 0.0001 ? aimDx / aimDist : player.aimDir.x;
  const aimDirY = aimDist > 0.0001 ? aimDy / aimDist : player.aimDir.y;
  const jitterDir = state.rng.nextUint32() & AIM_JITTER_MASK;
  const jitterMag = state.rng.nextUint32() & AIM_JITTER_MASK;
  const jitterAngle = jitterDir * AIM_JITTER_SCALE;
  const jitterOffset = aimMaxOffset * (jitterMag * AIM_JITTER_MAG_SCALE);
  const jitteredAimX = player.input.aimX + Math.cos(jitterAngle) * jitterOffset;
  const jitteredAimY = player.input.aimY + Math.sin(jitterAngle) * jitterOffset;
  const shotAngle = Math.atan2(jitteredAimY - player.pos.y, jitteredAimX - player.pos.x);

  const fireBulletsActive = (player.activeEffects['fire_bullets'] ?? 0) > 0;
  const particleAngle = shotAngle;
  const muzzle = getMuzzlePosition(player.pos.x, player.pos.y, aimDirX, aimDirY, weapon.id);
  const muzzleBaseX = muzzle.x;
  const muzzleBaseY = muzzle.y;
  let ammoCost = 1;

  const spawnProjectileForWeapon = (
    weaponDef: WeaponDef,
    angle: number,
    options: { kind?: string; damage?: number; speedScale?: number } = {},
  ): void => {
    const projectileProfile = getProjectileProfile(weaponDef.projectileProfileId);
    const projectileRadius = projectileProfile.projectileRadius ?? DEFAULT_PROJECTILE_RADIUS;
    const pierceRemaining = projectileProfile.pierceCount ?? 0;
    const explosionRadius = projectileProfile.explosionRadius ?? 0;
    const explosionDamage = explosionRadius
      ? weaponDef.damage * damageMultiplier * (projectileProfile.explosionDamageMultiplier ?? 1)
      : 0;
    const projectileSpeed = resolveProjectileSpeed(weaponDef) * player.perkStats.projectileSpeedMultiplier;
    const pDirX = Math.cos(angle);
    const pDirY = Math.sin(angle);
    const posX = muzzleBaseX;
    const posY = muzzleBaseY;
    const velX = pDirX * projectileSpeed;
    const velY = pDirY * projectileSpeed;
    const lifeTicks = Math.max(1, weaponDef.projectileLifeTicks);

    const typeId = WEAPON_TO_PROJECTILE_TYPE_ID[weaponDef.id];
    const projectileId = typeId !== null && typeId !== undefined ? PROJECTILE_BY_TYPE_ID[typeId] : null;
    const kind = options.kind ?? projectileId ?? weaponDef.id;

    const damage = options.damage ?? weaponDef.damage;
    const damageWithMultiplier = damage * damageMultiplier;

    spawnProjectile(
      state,
      events,
      { x: posX, y: posY },
      { x: velX, y: velY },
      kind,
      damageWithMultiplier,
      lifeTicks,
      'player',
      projectileRadius,
      {
        pierceRemaining,
        explosionRadius,
        explosionDamage,
        speedScale: options.speedScale,
        ignoreLifetime: true,
      },
    );
  };

  if (fireBulletsActive) {
    const pellets = getFireBulletsPelletCount(weapon.id);
    const pelletJitterStep = getPelletJitterStep(weapon.id);
    for (let i = 0; i < pellets; i += 1) {
      const pelletJitter = pellets > 1 ? (state.rng.nextUint32() % PELLET_JITTER_RANGE) - 100 : 0;
      const angle = shotAngle + pelletJitter * pelletJitterStep;
      spawnProjectileForWeapon(weapon, angle, { kind: 'fire_bullets' });
    }
  } else if (weapon.id === 'rocket_launcher') {
    spawnSecondaryProjectile(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      shotAngle,
      1,
      'player',
      {
        damage: weapon.damage * damageMultiplier,
        lifeTicks: Math.max(1, weapon.projectileLifeTicks),
        speed: resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier,
        explosionRadius: 3.5,
        explosionDamage: weapon.damage * damageMultiplier,
      },
    );
  } else if (weapon.id === 'seeker_rockets') {
    spawnSecondaryProjectile(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      shotAngle,
      2,
      'player',
      {
        damage: weapon.damage * damageMultiplier,
        lifeTicks: Math.max(1, weapon.projectileLifeTicks),
        speed: resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier,
        explosionRadius: 3.5,
        explosionDamage: weapon.damage * damageMultiplier,
      },
    );
  } else if (weapon.id === 'mini_rocket_swarmers') {
    const rocketCount = Math.max(1, Math.floor(player.ammo));
    const step = rocketCount * (Math.PI / 3);
    let angle = (shotAngle - Math.PI) - step * rocketCount * 0.5;
    for (let i = 0; i < rocketCount; i += 1) {
      spawnSecondaryProjectile(
        state,
        events,
        {
          x: player.pos.x + Math.cos(angle) * NATIVE_MUZZLE_FORWARD_OFFSET,
          y: player.pos.y + Math.sin(angle) * NATIVE_MUZZLE_FORWARD_OFFSET,
        },
        angle,
        2,
        'player',
        {
          damage: weapon.damage * damageMultiplier,
          lifeTicks: Math.max(1, weapon.projectileLifeTicks),
          speed: resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier,
          explosionRadius: 3.5,
          explosionDamage: weapon.damage * damageMultiplier,
        },
      );
      angle += step;
    }
    ammoCost = rocketCount;
  } else if (weapon.id === 'rocket_minigun') {
    spawnSecondaryProjectile(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      shotAngle,
      4,
      'player',
      {
        damage: weapon.damage * damageMultiplier,
        lifeTicks: Math.max(1, weapon.projectileLifeTicks),
        speed: resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier,
        explosionRadius: 3.5,
        explosionDamage: weapon.damage * damageMultiplier,
      },
    );
  } else if (weapon.id === 'flamethrower') {
    spawnParticleFast(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      particleAngle,
      0,
      'player',
      { damagePerTick: weapon.damage * damageMultiplier },
    );
    ammoCost = 0.1;
  } else if (weapon.id === 'blow_torch') {
    spawnParticleFast(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      particleAngle,
      1,
      'player',
      { damagePerTick: weapon.damage * damageMultiplier },
    );
    ammoCost = 0.05;
  } else if (weapon.id === 'hr_flamer') {
    spawnParticleFast(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      particleAngle,
      2,
      'player',
      { damagePerTick: weapon.damage * damageMultiplier },
    );
    ammoCost = 0.1;
  } else if (weapon.id === 'bubblegun') {
    spawnParticleSlow(
      state,
      events,
      { x: muzzleBaseX, y: muzzleBaseY },
      particleAngle,
      8,
      'player',
      { damagePerTick: weapon.damage * damageMultiplier },
    );
    ammoCost = 0.15;
  } else if (weapon.id === 'multi_plasma') {
    const spreadSmall = Math.PI / 10;
    const spreadLarge = Math.PI / 6;
    const plasmaRifle = getWeaponById('plasma_rifle');
    const plasmaMinigun = getWeaponById('plasma_minigun');
    const patterns: Array<{ offset: number; weaponDef: WeaponDef; kind: string }> = [
      { offset: -spreadSmall, weaponDef: plasmaRifle, kind: 'plasma_rifle' },
      { offset: -spreadLarge, weaponDef: plasmaMinigun, kind: 'plasma_minigun' },
      { offset: 0, weaponDef: plasmaRifle, kind: 'plasma_rifle' },
      { offset: spreadLarge, weaponDef: plasmaMinigun, kind: 'plasma_minigun' },
      { offset: spreadSmall, weaponDef: plasmaRifle, kind: 'plasma_rifle' },
    ];
    for (const pattern of patterns) {
      spawnProjectileForWeapon(pattern.weaponDef, shotAngle + pattern.offset, { kind: pattern.kind });
    }
  } else if (weapon.id === 'plasma_shotgun') {
    const plasmaMinigun = getWeaponById('plasma_minigun');
    for (let i = 0; i < 14; i += 1) {
      const jitter = ((state.rng.nextUint32() & 0xff) - 0x80) * 0.002;
      const speedScale = 1.0 + (state.rng.nextUint32() % 100) * 0.01;
      spawnProjectileForWeapon(plasmaMinigun, shotAngle + jitter, { kind: 'plasma_minigun', speedScale });
    }
  } else if (weapon.id === 'gauss_shotgun') {
    const gaussGun = getWeaponById('gauss_gun');
    for (let i = 0; i < 6; i += 1) {
      const jitter = (state.rng.nextUint32() % 200 - 100) * 0.002;
      const speedScale = 1.4 + (state.rng.nextUint32() % 0x50) * 0.01;
      spawnProjectileForWeapon(gaussGun, shotAngle + jitter, { kind: 'gauss_gun', speedScale });
    }
  } else if (weapon.id === 'ion_shotgun') {
    const ionMinigun = getWeaponById('ion_minigun');
    for (let i = 0; i < 8; i += 1) {
      const jitter = (state.rng.nextUint32() % 200 - 100) * 0.0026;
      const speedScale = 1.4 + (state.rng.nextUint32() % 0x50) * 0.01;
      spawnProjectileForWeapon(ionMinigun, shotAngle + jitter, { kind: 'ion_minigun', speedScale });
    }
  } else {
    const pellets = Math.max(1, weapon.pellets ?? 1);
    const pelletJitterStep = getPelletJitterStep(weapon.id);
    for (let i = 0; i < pellets; i += 1) {
      const pelletJitter = pellets > 1 ? (state.rng.nextUint32() % PELLET_JITTER_RANGE) - 100 : 0;
      const angle = shotAngle + pelletJitter * pelletJitterStep;
      spawnProjectileForWeapon(weapon, angle);
    }
  }

  if (weapon.ammoMax !== undefined && !firingDuringReload) {
    player.ammo = Math.max(0, player.ammo - ammoCost);
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });

  const hasFastshot = (player.perks['fastshot'] ?? 0) > 0;
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

function resolveProjectileSpeed(weapon: WeaponDef): number {
  const metaSpeed = weapon.projectileMeta ?? weapon.projectileSpeed;
  const boundedMetaSpeed = Math.min(PROJECTILE_SPEED_META_CAP, Math.max(weapon.projectileSpeed, metaSpeed));
  return Math.max(1, boundedMetaSpeed);
}

function getMuzzlePosition(
  playerX: number,
  playerY: number,
  aimDirX: number,
  aimDirY: number,
  weaponId: WeaponDef['id'],
): { x: number; y: number } {
  const lateral = weaponId === 'pistol' ? PISTOL_MUZZLE_LATERAL_OFFSET : 0;
  const perpX = -aimDirY;
  const perpY = aimDirX;
  return {
    x: playerX + aimDirX * NATIVE_MUZZLE_FORWARD_OFFSET - perpX * lateral,
    y: playerY + aimDirY * NATIVE_MUZZLE_FORWARD_OFFSET - perpY * lateral,
  };
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
  const projectileSpeed = resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier;
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

    const posX = player.pos.x + dirX * NATIVE_MUZZLE_FORWARD_OFFSET;
    const posY = player.pos.y + dirY * NATIVE_MUZZLE_FORWARD_OFFSET;
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
        ignoreLifetime: true,
      },
    );
  }

  events.push({ type: 'playSfx', name: `${weapon.id}_shot` });
}

function spawnAngryReloadRing(
  state: SimState,
  events: SimEvent[],
  count: number,
  angleOffset: number,
): void {
  if (count <= 0) {
    return;
  }
  const weapon = getWeaponById('plasma_minigun');
  if (!weapon) {
    return;
  }
  const player = state.player;
  const damageMultiplier = getDamageMultiplier(player);
  const projectileSpeed = resolveProjectileSpeed(weapon) * player.perkStats.projectileSpeedMultiplier;
  const projectileProfile = getProjectileProfile(weapon.projectileProfileId);
  const projectileRadius = projectileProfile.projectileRadius ?? DEFAULT_PROJECTILE_RADIUS;
  const pierceRemaining = projectileProfile.pierceCount ?? 0;
  const explosionRadius = projectileProfile.explosionRadius ?? 0;
  const explosionDamage = explosionRadius
    ? weapon.damage * damageMultiplier * (projectileProfile.explosionDamageMultiplier ?? 1)
    : 0;
  const lifeTicks = Math.max(1, weapon.projectileLifeTicks);
  const kind = PROJECTILE_BY_TYPE_ID[ANGRY_RELOADER_PROJECTILE_TYPE_ID] ?? weapon.id;
  const step = (2 * Math.PI) / count;

  for (let i = 0; i < count; i += 1) {
    const angle = i * step + angleOffset;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const velX = dirX * projectileSpeed;
    const velY = dirY * projectileSpeed;
    spawnProjectile(
      state,
      events,
      { x: player.pos.x, y: player.pos.y },
      { x: velX, y: velY },
      kind,
      weapon.damage * damageMultiplier,
      lifeTicks,
      'player',
      projectileRadius,
      {
        pierceRemaining,
        explosionRadius,
        explosionDamage,
        ignoreLifetime: true,
      },
    );
  }
}

function swapAltWeapon(player: SimState['player']): boolean {
  if (!player.altWeaponId) {
    return false;
  }
  [
    player.weaponId,
    player.ammo,
    player.reloadTimer,
    player.reloadTimerMax,
    player.shotCooldown,
    player.spreadHeat,
    player.altWeaponId,
    player.altAmmo,
    player.altReloadTimer,
    player.altReloadTimerMax,
    player.altShotCooldown,
    player.altSpreadHeat,
  ] = [
    player.altWeaponId,
    player.altAmmo,
    player.altReloadTimer,
    player.altReloadTimerMax,
    player.altShotCooldown,
    player.altSpreadHeat,
    player.weaponId,
    player.ammo,
    player.reloadTimer,
    player.reloadTimerMax,
    player.shotCooldown,
    player.spreadHeat,
  ];
  return true;
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

function shouldStartReload(
  player: SimState['player'],
  weapon: WeaponDef,
  ignoreReloadInput: boolean,
  reloadWasDown: boolean,
): boolean {
  if (weapon.ammoMax === undefined || weapon.reloadTime === undefined) {
    return false;
  }
  if (player.reloadTimer > 0) {
    return false;
  }
  if (!player.input.reload && player.ammo > 0) {
    return false;
  }
  if (ignoreReloadInput && player.input.reload) {
    return false;
  }
  if (player.ammo >= weapon.ammoMax) {
    return false;
  }
  if (player.input.reload && reloadWasDown) {
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
