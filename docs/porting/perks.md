# Perks Subsystem

Functions: 4

## Function Checklist

- [x] `perks_generate_choices` — Implemented via `generatePerkChoices()` (rng-driven, deterministic draw order)
- [x] `perks_init_database` — Implemented via `src/content/perks.ts` static perk table
- [x] `perks_rebuild_available` — Implemented via `perkCanOffer()` filtering + exclusive tags
- [x] `perks_update_effects` — Implemented via `recomputePerkStats()` and per-tick regen in progression system

## Notes

- Perk availability respects max stacks and exclusive tags (e.g. mutually exclusive styles).
- Effects are recomputed deterministically on selection and stored in `player.perkStats`.
