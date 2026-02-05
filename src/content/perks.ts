import { PERK_BY_ID, type PerkDef, type PerkId } from './perks.generated';

export { PERKS, PERK_BY_ID, type PerkDef, type PerkId, type PerkRefId, perkIdFromRefId } from './perks.generated';

export type PerkRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export function getPerkDef(id: PerkId): PerkDef | undefined {
  return PERK_BY_ID[id];
}
