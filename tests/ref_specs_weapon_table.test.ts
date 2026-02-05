import { describe, expect, it } from 'vitest';
import { WEAPONS, type WeaponId } from '../src/content/weapons';
import { extractRefSpecsFromFile } from '../src/tools/extract_ref_specs';

const TICKS_PER_SECOND = 60;

const REF_WEAPON_MAPPING: Record<WeaponId, string> = {
  pistol: 'Pistol',
  assault_rifle: 'Assault Rifle',
  shotgun: 'Shotgun',
  sawed_off_shotgun: 'Sawed-off Shotgun',
  submachine_gun: 'Submachine Gun',
  gauss_gun: 'Gauss Gun',
  mean_minigun: 'Mean Minigun',
  flamethrower: 'Flamethrower',
  plasma_rifle: 'Plasma Rifle',
  multi_plasma: 'Multi-Plasma',
  plasma_minigun: 'Plasma Minigun',
  rocket_launcher: 'Rocket Launcher',
  seeker_rockets: 'Seeker Rockets',
  plasma_shotgun: 'Plasma Shotgun',
  blow_torch: 'Blow Torch',
  hr_flamer: 'HR Flamer',
  mini_rocket_swarmers: 'Mini-Rocket Swarmers',
  rocket_minigun: 'Rocket Minigun',
  pulse_gun: 'Pulse Gun',
  jackhammer: 'Jackhammer',
  ion_rifle: 'Ion Rifle',
  ion_minigun: 'Ion Minigun',
  ion_cannon: 'Ion Cannon',
  shrinkifier_5k: 'Shrinkifier 5k',
  blade_gun: 'Blade Gun',
  spider_plasma: 'Spider Plasma',
  evil_scythe: 'Evil Scythe',
  plasma_cannon: 'Plasma Cannon',
  splitter_gun: 'Splitter Gun',
  gauss_shotgun: 'Gauss Shotgun',
  ion_shotgun: 'Ion Shotgun',
  flameburst: 'Flameburst',
  raygun: 'RayGun',
  plague_sphreader_gun: 'Plague Sphreader Gun',
  bubblegun: 'Bubblegun',
  rainbow_gun: 'Rainbow Gun',
  grim_weapon: 'Grim Weapon',
  fire_bullets: 'Fire bullets',
  transmutator: 'Transmutator',
  blaster_r_300: 'Blaster R-300',
  lighting_rifle: 'Lighting Rifle',
  nuke_launcher: 'Nuke Launcher',
};

describe('ref weapon table parity', () => {
  it('matches key weapon fields against the ref specs', () => {
    const { weapon_table } = extractRefSpecsFromFile();
    const refByName = new Map(weapon_table.map((weapon) => [weapon.name, weapon]));

    const mappedNames = new Set<string>();
    for (const weapon of WEAPONS) {
      if (!weapon.name) {
        continue;
      }
      const refName = REF_WEAPON_MAPPING[weapon.id];
      expect(refName).toBeTruthy();
      if (mappedNames.has(refName)) {
        throw new Error(`Duplicate ref weapon mapping for ${refName}`);
      }
      mappedNames.add(refName);

      const refWeapon = refByName.get(refName);
      expect(refWeapon).toBeTruthy();
      if (!refWeapon) {
        continue;
      }

      const expectedClip = weapon.ammoMax ?? null;
      const expectedReloadSeconds = weapon.reloadTime;
      const expectedPellets = weapon.pellets ?? 1;

      expect(refWeapon.clip_size).toBe(expectedClip);
      expect(refWeapon.reload_time).toBe(expectedReloadSeconds);
      expect(refWeapon.pellet_count).toBe(expectedPellets);
    }
  });
});
