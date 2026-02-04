# TICKET-020 Progress

Generated: 2026-02-04T06:32:21Z

## Summary
- Added deterministic simulation core under `src/sim/` with fixed-step loop, seedable RNG, and event stream contract.
- Added scaffolded systems for input, player update, weapons, projectiles, creatures, collisions, bonuses, and modes.
- Added initial deterministic smoke tests using Vitest.
- Updated porting workbook entries for gameplay reset and vec2 helpers.

## Files Added
- `src/sim/types.ts`
- `src/sim/rng.ts`
- `src/sim/clock.ts`
- `src/sim/state.ts`
- `src/sim/sim.ts`
- `src/sim/systems/input.ts`
- `src/sim/systems/player.ts`
- `src/sim/systems/weapons.ts`
- `src/sim/systems/projectiles.ts`
- `src/sim/systems/creatures.ts`
- `src/sim/systems/collision.ts`
- `src/sim/systems/bonuses.ts`
- `src/sim/systems/mode_survival.ts`
- `src/sim/systems/mode_quest.ts`
- `tests/sim_determinism.test.ts`

## Files Updated
- `package.json`
- `package-lock.json`
- `docs/porting/index.md`
- `docs/porting/gameplay.md`
- `docs/porting/misc.md`
