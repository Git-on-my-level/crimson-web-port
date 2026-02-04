# Perk Subsystem

Functions: 6

## Function Checklist

- [x] `perk_apply` — Implemented in `choosePerk()` + `recomputePerkStats()`
- [x] `perk_can_offer` — Implemented in `perkCanOffer()` (max stacks + prerequisites + exclusivity groups)
- [x] `perk_count_get` — Implemented in `perkCountGet()`
- [x] `perk_prompt_update_and_render` — Implemented via `PerkPickerOverlay`
- [x] `perk_select_random` — Implemented via `generatePerkChoices()` using sim RNG
- [x] `perk_selection_screen_update` — Implemented via sim `PerkSelect` phase handling

## Notes

- Perk choices are presented in a modal overlay and selected via keys 1-3 or click.
- Perk gating now includes prerequisite chains and exclusive-group blocking (see `src/content/perks.ts`).
