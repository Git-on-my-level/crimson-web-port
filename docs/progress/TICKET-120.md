# TICKET-120 Progress

Date: 2026-02-04

## Summary
- Added a minimal creature content table with a single grunt definition.
- Implemented creature spawning on map edges with deterministic RNG cooldowns.
- Implemented simple seek AI and bounds clamping for creatures.
- Updated the porting workbook to mark basic creature spawn/update as implemented.

## Checklist Results
- Creature config added: pass
- Spawn logic added: pass
- Seek AI added: pass
- Adapter rendering already supports creatures: pass
- Porting docs updated: pass
- Tests: not run (manual verification recommended)

## Known Issues / Warnings
- Creatures never despawn yet; collision/damage will handle removals in TICKET-130.
- Creature render radius is currently fixed in the Phaser adapter.
