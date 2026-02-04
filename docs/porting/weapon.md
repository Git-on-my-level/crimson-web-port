# Weapon Subsystem

Functions: 5

## Function Checklist

- [x] `weapon_assign_player` — Implemented (player weapon state + switching) (ref: crimsonland:00452d40)
- [x] `weapon_pick_random_available` — Implemented (`pickRandomWeapon` in sim weapon table) (ref: crimsonland:00452cd0)
- [x] `weapon_refresh_available` — Implemented (level gating + unlock set; refresh on level up/weapon pickup) (ref: crimsonland:00452e40)
- [x] `weapon_table_entry` — Implemented (data-driven `WeaponDef` entries) (ref: crimsonland:0041fc60)
- [x] `weapon_table_init` — Implemented (weapon table + ordering) (ref: crimsonland:004519b0)

## Notes

- Weapon selection uses ordered slots (1-5) backed by `WEAPON_ORDER`.
- Availability now uses per-weapon `unlockLevel` plus `player.unlockedWeapons` (weapon drops), refreshed on level up.
- Ammo/reload is simplified to per-weapon `ammoMax` + `reloadTicks`.
