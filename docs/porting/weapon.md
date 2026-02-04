# Weapon Subsystem

Functions: 5

## Function Checklist

- [x] `weapon_assign_player` — Implemented (player weapon state + switching) (ref: crimsonland:00452d40)
- [x] `weapon_pick_random_available` — Implemented (`pickRandomWeapon` in sim weapon table) (ref: crimsonland:00452cd0)
- [ ] `weapon_refresh_available` — TODO (unlock/perk availability rules) (ref: crimsonland:00452e40)
- [x] `weapon_table_entry` — Implemented (data-driven `WeaponDef` entries) (ref: crimsonland:0041fc60)
- [x] `weapon_table_init` — Implemented (weapon table + ordering) (ref: crimsonland:004519b0)

## Notes

- Weapon selection uses ordered slots (1-5) backed by `WEAPON_ORDER`.
- Ammo/reload is simplified to per-weapon `ammoMax` + `reloadTicks`.
