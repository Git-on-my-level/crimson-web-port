import { describe, expect, it } from 'vitest';
import { PROJECTILES, PROJECTILE_BY_ID, PROJECTILE_BY_TYPE_ID } from '../src/content/projectiles.generated';

describe('Projectile defs parity', () => {
  it('has correct projectile type IDs for key weapons', () => {
    expect(PROJECTILE_BY_TYPE_ID[1]).toBe('pistol');
    expect(PROJECTILE_BY_TYPE_ID[2]).toBe('assault_rifle');
    expect(PROJECTILE_BY_TYPE_ID[3]).toBe('shotgun');
    expect(PROJECTILE_BY_TYPE_ID[5]).toBe('submachine_gun');
    expect(PROJECTILE_BY_TYPE_ID[6]).toBe('gauss_gun');
    expect(PROJECTILE_BY_TYPE_ID[9]).toBe('plasma_rifle');
    expect(PROJECTILE_BY_TYPE_ID[0x0B]).toBe('plasma_minigun');
  });

  it('has correct speeds for key projectile types', () => {
    const pistol = PROJECTILE_BY_ID['pistol'];
    expect(pistol).toBeDefined();
    expect(pistol?.speed).toBe(20);

    const plasma = PROJECTILE_BY_ID['plasma_rifle'];
    expect(plasma).toBeDefined();
    expect(plasma?.speed).toBe(20);

    const gauss = PROJECTILE_BY_ID['gauss_gun'];
    expect(gauss).toBeDefined();
    expect(gauss?.speed).toBe(20);
  });

  it('has correct lifetimes for key projectile types', () => {
    const pistol = PROJECTILE_BY_ID['pistol'];
    expect(pistol).toBeDefined();
    expect(pistol?.lifeSeconds).toBe(1.0);

    const plasma = PROJECTILE_BY_ID['plasma_rifle'];
    expect(plasma).toBeDefined();
    expect(plasma?.lifeSeconds).toBe(1.0);

    const gauss = PROJECTILE_BY_ID['gauss_gun'];
    expect(gauss).toBeDefined();
    expect(gauss?.lifeSeconds).toBe(1.0);
  });

  it('has correct radius values for key projectile types', () => {
    const pistol = PROJECTILE_BY_ID['pistol'];
    expect(pistol).toBeDefined();
    expect(pistol?.radius).toBe(1);

    const gauss = PROJECTILE_BY_ID['gauss_gun'];
    expect(gauss).toBeDefined();
    expect(gauss?.radius).toBe(1);

    const ionRifle = PROJECTILE_BY_ID['ion_rifle'];
    expect(ionRifle).toBeDefined();
    expect(ionRifle?.radius).toBe(1);
  });

  it('has correct base damage meta for key projectile types', () => {
    const pistol = PROJECTILE_BY_ID['pistol'];
    expect(pistol).toBeDefined();
    expect(pistol?.baseDamageMeta).toBe(55);

    const assaultRifle = PROJECTILE_BY_ID['assault_rifle'];
    expect(assaultRifle).toBeDefined();
    expect(assaultRifle?.baseDamageMeta).toBe(50);

    const plasmaRifle = PROJECTILE_BY_ID['plasma_rifle'];
    expect(plasmaRifle).toBeDefined();
    expect(plasmaRifle?.baseDamageMeta).toBe(30);

    const gaussGun = PROJECTILE_BY_ID['gauss_gun'];
    expect(gaussGun).toBeDefined();
    expect(gaussGun?.baseDamageMeta).toBe(215);
  });

  it('has correct damage pool values for special projectiles', () => {
    const gaussGun = PROJECTILE_BY_ID['gauss_gun'];
    expect(gaussGun).toBeDefined();
    expect(gaussGun?.damagePool).toBe(300);

    const fireBullets = PROJECTILE_BY_ID['fire_bullets'];
    expect(fireBullets).toBeDefined();
    expect(fireBullets?.damagePool).toBe(240);

    const bladeGun = PROJECTILE_BY_ID['blade_gun'];
    expect(bladeGun).toBeDefined();
    expect(bladeGun?.damagePool).toBe(50);

    const pistol = PROJECTILE_BY_ID['pistol'];
    expect(pistol).toBeDefined();
    expect(pistol?.damagePool).toBe(1);
  });

  it('contains all expected projectile types', () => {
    expect(PROJECTILES.length).toBeGreaterThan(0);

    const expectedIds = [
      'pistol',
      'assault_rifle',
      'shotgun',
      'submachine_gun',
      'gauss_gun',
      'plasma_rifle',
      'plasma_minigun',
      'pulse_gun',
      'ion_rifle',
      'ion_minigun',
      'ion_cannon',
      'shrinkifier',
      'blade_gun',
      'spider_plasma',
      'plasma_cannon',
      'splitter_gun',
      'plague_spreader',
      'rainbow_gun',
      'fire_bullets',
    ];

    for (const id of expectedIds) {
      expect(PROJECTILE_BY_ID[id]).toBeDefined();
    }
  });
});
