# TICKET-420 — Parity Audit Harness + Regression Scenarios (M5.0)

## Summary
- Added a deterministic sim trace tool (`src/tools/sim_trace.ts`) for seeded runs with snapshots + event summaries.
- Added parity golden tests under `tests/parity/` (weapons, bonuses, perks, survival spawn determinism).
- Added a parity scorecard to track gaps and ticket ownership (`docs/parity/scorecard.md`).
- Linked the harness + scorecard from `docs/porting/index.md` and `spec.md`.

## Files Added/Updated
- `src/tools/sim_trace.ts`
- `tests/parity/weapons_fire_rate.test.ts`
- `tests/parity/bonus_pickup_effects.test.ts`
- `tests/parity/perk_levelup_flow.test.ts`
- `tests/parity/survival_spawn_determinism.test.ts`
- `docs/parity/scorecard.md`
- `docs/porting/index.md`
- `.codex-autorunner/workspace/spec.md`

## Manual verification
- `npx tsx src/tools/sim_trace.ts --seed 1 --ticks 600 --snapshot 60 --pattern constant-fire`
- Re-run the command above and confirm identical output.
- Temporarily adjust a weapon stat and confirm a parity test fails.
