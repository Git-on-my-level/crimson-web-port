export const SFX_KEYS = {
  uiClick: 'sfx-ui-click',
  pickup: 'sfx-pickup',
  weaponSwitch: 'sfx-weapon-switch',
  weaponShot: 'sfx-weapon-shot',
  perkOffer: 'sfx-perk-offer',
  perkChoose: 'sfx-perk-choose',
};

export const SFX_PRELOAD_KEYS = Object.values(SFX_KEYS);

export function mapSimSfxName(name: string): string | null {
  if (name === 'pickup') {
    return SFX_KEYS.pickup;
  }
  if (name === 'weapon_switch') {
    return SFX_KEYS.weaponSwitch;
  }
  if (name.endsWith('_shot')) {
    return SFX_KEYS.weaponShot;
  }
  if (name === 'ui_click') {
    return SFX_KEYS.uiClick;
  }
  return null;
}
