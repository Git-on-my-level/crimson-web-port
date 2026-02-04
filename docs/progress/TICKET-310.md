# TICKET-310 — Quest mode runtime model (objectives + timeline spawner)

## Status
**Completed**

## Reference Notes (crimsonland.exe_decompiled.c)

### `quest_mode_update` (004070e0)
- Quest timeline (`quest_spawn_timeline`) advances when no creatures are active **or** when the spawn table has no pending entries.
- After advancing time, `quest_spawn_timeline_update` is called every frame.
- When no creatures are active and the spawn table is empty, a transition timer drives quest completion and unlock flow.
- Demo mode enforces a time limit check against `quest_spawn_timeline`.

### `quest_spawn_table_empty` (00434220)
- Iterates the quest spawn table in reverse and returns true only if all entries have `count <= 0`.

### `quest_spawn_timeline_update` (00434250)
- Tracks a secondary timer (`DAT_004c3654`) that increases when creatures are active.
- Each quest spawn entry contains:
  - `trigger_time_ms`
  - `count`
  - `pos_x`, `pos_y`
  - `template_id`, `heading`
- Spawns fire when `trigger_time_ms < quest_spawn_timeline` **or** if creatures have been active for > 3000ms and timeline > 0x6a4.
- When an entry triggers, it spawns `count` creatures in a pattern around the given position, then clears the count to zero.
- Entries with the same trigger time are processed together.

## Implementation Summary

### Created Files
- `src/content/quests/types.ts` — Quest data model types
- `src/content/quests/index.ts` — Quest catalog + default quest
- `docs/progress/TICKET-310.md` — This file
- `tests/sim_quest_mode.test.ts` — Quest mode timeline/objective test

### Modified Files
- `src/sim/state.ts` — Quest mode state, phases, selected quest id
- `src/sim/sim.ts` — Mode/quest-aware reset/constructor
- `src/sim/systems/mode_quest.ts` — Quest runtime update, timeline spawner, objective evaluation
- `src/sim/systems/creatures.ts` — Spawn helper for arbitrary positions
- `src/sim/systems/collision.ts` — Quest kill tracking + quest failure on player death
- `src/sim/world.ts` — Random world position helper
- `src/sim/types.ts` — Quest status/message events
- `src/scenes/GameScene.ts` — Quest overlay placeholders for results/failed
- `src/scenes/TitleScene.ts` — Quest entry starts quest mode
- `src/scenes/QuestStubScene.ts` — Updated copy + start quest action
- `docs/porting/quest.md` — Updated runtime checklist notes

## Features Implemented
- Quest data model (objectives + timeline event list)
- Quest runtime state machine (Playing → Success/Failed → QuestResults/QuestFailed phases)
- Deterministic timeline spawner with O(events) stepping
- Objective evaluation for survive, killCount, and score
- Quest-specific failure handling on player death
- Placeholder UI overlay for quest results/failure

## Acceptance Criteria
- [x] Quest mode can run with a small hardcoded QuestDef
- [x] Timeline spawns trigger at correct ticks
- [x] Objectives can succeed/fail deterministically
- [x] No survival director runs during quest mode

## Verification

Manual suggestion:
1. Start quest mode from Title.
2. Survive for ~30 seconds; observe quest completion overlay.

Automated:
- `tests/sim_quest_mode.test.ts` validates timeline spawns and success transition for a short quest.

## Notes
- Quest timeline behavior is simplified vs. original C reference (no active-creature delay gating yet).
- Quest results/failed scenes remain placeholders until TICKET-330.
