# TICKET-240 — Survival mode director (spawn pacing + difficulty ramp)

## Summary

Added a deterministic survival director that ramps spawn pacing over time, shifts creature mix by tier, and enforces a soft cap on concurrent enemies. Expanded creature definitions to include runner/tank variants with per-type score values and added a long-run sim test for spawn determinism and cap enforcement.

## Step 1 — Mode State

- Added `modeState` to `SimState` as a tagged union for survival vs quest.
- Survival state tracks `elapsedTicks`, `spawnBudget`, `difficultyLevel`, and `maxCreaturesSoftCap`.

## Step 2 — Director Algorithm

Implemented in `src/sim/systems/mode_survival.ts`:
- Spawn budget accrues each tick using tier-specific `spawnRatePerSecond`.
- When budget is sufficient and under cap, spawn a weighted creature and deduct its cost.
- Tier selection advances every 30 seconds via `minSeconds` thresholds.

## Step 3 — Creature Types

Expanded `src/content/creatures.ts` with:
- `runner` (fast, low HP)
- `tank` (slow, high HP)

## Step 4 — Survival Scoring

Moved score values into creature defs (`scoreValue`) and applied them on kill.

## Step 5 — Sim Update Order

`Sim.step()` now runs survival/quest mode updates before creature movement to keep spawns deterministic and in the same tick.

## Step 6 — Workbook + Docs

- Added `docs/porting/survival.md` and linked it in `docs/porting/index.md`.
- Added this progress report with tuning constants.

## Tuning Notes

Survival tiers (min seconds → spawn rate per second, cap, weights):
- 0s → 0.5, cap 6, grunt only
- 30s → 0.8, cap 8, grunt/runner
- 60s → 1.1, cap 10, grunt/runner
- 90s → 1.4, cap 12, grunt/runner/tank
- 120s → 1.8, cap 14, grunt/runner/tank
- 180s → 2.3, cap 16, grunt/runner/tank

Creature costs:
- grunt 1.0
- runner 1.4
- tank 3.0

## Testing

Added `tests/sim_survival_director.test.ts` to run 10k ticks with idle input and assert:
- Soft cap never exceeded
- Deterministic spawn sequence for identical seeds
- Difficulty tier ramps by ~3 minutes

## Files Modified/Created

### Created
- `src/sim/systems/mode_survival.ts` (updated)
- `docs/porting/survival.md`
- `docs/progress/TICKET-240.md`
- `tests/sim_survival_director.test.ts`

### Modified
- `src/sim/sim.ts`
- `src/sim/state.ts`
- `src/sim/systems/creatures.ts`
- `src/sim/systems/collision.ts`
- `src/sim/systems/mode_quest.ts`
- `src/content/creatures.ts`
- `docs/porting/index.md`
- `tests/sim_determinism.test.ts`
- `tests/sim_smoke.test.ts`
- `tests/sim_perks.test.ts`
