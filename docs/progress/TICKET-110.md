# TICKET-110 Progress

Date: 2026-02-04

## Summary
- Added a minimal weapon data table with a pistol entry in `src/content/weapons.ts`.
- Implemented firing logic with tick-based cooldown, deterministic spread, and projectile spawning.
- Implemented projectile movement, lifetime, bounds culling, and array compaction.
- Marked weapon/projectile functions as implemented in the porting workbook.

## Checklist Results
- Weapon config added: pass
- Firing logic added: pass
- Projectile update added: pass
- Adapter rendering already supports projectiles: pass
- Porting docs updated: pass
- Tests: not run (added projectile spawn test)

## Known Issues / Warnings
- Projectile bounds are hard-coded to the temporary world box; revisit once map sizing lands.
