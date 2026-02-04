import { describe, expect, it } from 'vitest';
import { mapSimSfxName, SFX_KEYS } from '../src/audio/sfx';

describe('mapSimSfxName', () => {
  it('maps known sim sfx names', () => {
    expect(mapSimSfxName('pickup')).toBe(SFX_KEYS.pickup);
    expect(mapSimSfxName('weapon_switch')).toBe(SFX_KEYS.weaponSwitch);
    expect(mapSimSfxName('pistol_shot')).toBe(SFX_KEYS.weaponShot);
    expect(mapSimSfxName('smg_shot')).toBe(SFX_KEYS.weaponShot);
    expect(mapSimSfxName('ui_click')).toBe(SFX_KEYS.uiClick);
  });

  it('returns null for unknown names', () => {
    expect(mapSimSfxName('mystery')).toBeNull();
  });
});
