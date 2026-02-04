# TICKET-190 — M1 review gate + deterministic smoke test

## Summary

Locked down M1 playtest coverage, added a deterministic sim smoke test with scripted inputs, and updated the porting workbook to reflect implemented gameplay/player work.

## Implementation Details

### 1. M1 Playtest Checklist (`docs/playtest-checklist.md`)
Added the required M1 checks covering:
- Movement/aim/shooting
- Enemy spawn + chasing
- Score on kill
- Death → game over
- Restart from Game Over
- Pause toggle

### 2. Deterministic Sim Smoke Test (`tests/sim_smoke.test.ts`)
Created a scripted smoke test that:
- Uses a fixed seed (`2026`)
- Spawns two deterministic creatures
- Runs a 240-tick loop with a square movement pattern
- Fires at fixed intervals with a stable aim offset
- Asserts tick count, score, alive entity counts, player HP
- Captures a stable snapshot hash (`a781c8a7`) for quick regression detection

This test avoids Phaser and system time usage.

### 3. Porting Workbook Honesty (`docs/porting/*.md`)
Updated checklist items to reflect the current implementation:
- `player_fire_weapon` marked implemented (handled in weapons system)
- Gameplay render/update/reset marked implemented (split across sim + GameScene + render adapter)

## Testing Results

- `npm test` (run twice)

## Files Changed

### New Files
- `tests/sim_smoke.test.ts` — Deterministic smoke test
- `docs/progress/TICKET-190.md` — This document

### Modified Files
- `docs/playtest-checklist.md` — Added M1 checklist
- `docs/porting/player.md` — Marked player fire flow implemented
- `docs/porting/gameplay.md` — Marked gameplay update/render/reset implemented

## Acceptance Criteria

- [x] All M1 playtest steps documented
- [x] `npm test` includes meaningful sim smoke test and passes
- [x] No flaky tests (run twice locally)

## Future Work

- Add a second smoke test that leaves creature spawning enabled
- Expand snapshot to cover bonus spawns when those systems are added
