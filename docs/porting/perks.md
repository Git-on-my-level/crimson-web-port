# Perks Subsystem

Functions: 4

## Function Checklist

- [x] `perks_generate_choices` — Implemented via `generatePerkChoices()` (rng-driven, deterministic weighted draw order)
- [x] `perks_init_database` — Implemented via `src/content/perks.ts` static perk table
- [x] `perks_rebuild_available` — Implemented via `perkCanOffer()` filtering + exclusive tags
- [x] `perks_update_effects` — Implemented via `recomputePerkStats()` and per-tick regen in progression system

## Notes

- Perk availability respects max stacks, prerequisite chains, and exclusive groups (e.g. mutually exclusive styles).
- Offer selection uses rarity-based weights while remaining deterministic per seed.
- Effects are recomputed deterministically on selection and stored in `player.perkStats`.
