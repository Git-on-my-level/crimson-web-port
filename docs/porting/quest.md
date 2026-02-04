# Quest Subsystem

Functions: 61

## Runtime Status

- Quest runtime model implemented in `src/sim/systems/mode_quest.ts` (timeline stepping, objectives, status transitions).
- Spawn timeline is represented as ordered events with a `nextTimelineIndex` cursor.
- Quest results/failed phases are represented in sim (`QuestResults`, `QuestFailed`).
- Quest catalog implemented in `src/content/quests/catalog.ts` with 20 quests from reference.

## Implemented Quests (TICKET-320)

- [x] `quest_build_nagolipoli` — Implemented in catalog.ts (ref: crimsonland:00434480)
  - Translation: Ring spawn patterns simplified to `ring` pattern with creature kind mapping (0x40→tank, 0x1c→grunt, 0xb→runner)
  - Approximation: Complex position-based spawns converted to ring/edge patterns; ms-to-tick conversion (16.67ms/tick)
  - Notes: Original uses absolute positions (512, 512 center), converted to relative patterns around player

- [x] `quest_build_monster_blues` — Implemented in catalog.ts (ref: crimsonland:00434860)
  - Translation: Linear edge spawns with creature kind mapping (0x4→runner, 0x6→tank, 0x3→grunt)
  - Approximation: Original uses fixed Y positions based on terrain height, converted to `edge` pattern

- [x] `quest_build_the_gathering` — Implemented in catalog.ts (ref: crimsonland:004349c0)
  - Translation: Sequential position spawns with creature kind mapping (0x1→runner, 0x3a→tank, 0x0→grunt, 0x3c→runner)
  - Approximation: Original spawns at fixed positions (256/512, 768/512), converted to edge pattern

- [x] `quest_build_army_of_three` — Implemented in catalog.ts (ref: crimsonland:00434ca0)
  - Translation: Three creature types in sequence (0x15→tank, 0x17→runner, 0x16→grunt)
  - Approximation: Position-based spawns (left edge at various Y) converted to edge pattern

- [x] `quest_build_knee_deep_in_the_dead` — Implemented in catalog.ts (ref: crimsonland:00434f00)
  - Translation: Wave-based zombie spawns (0x43→tank, 0x41→runner, 0x42→grunt)
  - Approximation: Original has complex conditional logic with offset Y positions, simplified to wave pattern with edge spawns
  - Notes: 60 waves total (every ~500ms), heavily truncated for gameplay pacing

## Implemented Quests (TICKET-500)

- [x] `quest_build_land_hostile` — Implemented in catalog.ts (ref: crimsonland:00435bd0)
  - Translation: Absolute edge/corner positions mapped to world anchors; fixed-point spawns
  - Notes: Includes bonus collection objective to validate new quest objective tracking

- [x] `quest_build_minor_alien_breach` — Implemented in catalog.ts (ref: crimsonland:00435cc0)
  - Translation: Position-based spawns with periodic edge reinforcements; brute cameo at mid-point

- [x] `quest_build_target_practice` — Implemented in catalog.ts (ref: crimsonland:00437a00)
  - Translation: Orbiter spawns approximated via ring stream around map center

- [x] `quest_build_frontline_assault` — Implemented in catalog.ts (ref: crimsonland:00437e10)
  - Translation: Multi-front stream spawns from bottom and top corners

- [x] `quest_build_alien_dens` — Implemented in catalog.ts (ref: crimsonland:00436720)
  - Translation: Fixed-point spawner placement (center + diagonals)

- [x] `quest_build_the_random_factor` — Implemented in catalog.ts (ref: crimsonland:00436350)
  - Translation: Timed edge streams + brute punctuations

- [x] `quest_build_spider_wave_syndrome` — Implemented in catalog.ts (ref: crimsonland:00436440)
  - Translation: Streamed spider waves from the left edge

- [x] `quest_build_alien_squads` — Implemented in catalog.ts (ref: crimsonland:00435ea0)
  - Translation: Ring formations centered on offscreen anchors + fixed dual-corner streams

- [x] `quest_build_nesting_grounds` — Implemented in catalog.ts (ref: crimsonland:004364a0)
  - Translation: Spawner cadence + escalating alien waves

- [x] `quest_build_8_legged_terror` — Implemented in catalog.ts (ref: crimsonland:00436120)
  - Translation: Boss spawn + repeating corner brood spawns

- [x] `quest_build_everred_pastures` — Implemented in catalog.ts (ref: crimsonland:004375a0)
  - Translation: Wave ladder on all four edges

- [x] `quest_build_spider_spawns` — Implemented in catalog.ts (ref: crimsonland:00436d70)
  - Translation: Fixed spawner points + timed reinforcements

- [x] `quest_build_two_fronts` — Implemented in catalog.ts (ref: crimsonland:00436ee0)
  - Translation: Dual edge streams + mid-quest spawner inserts

- [x] `quest_build_sweep_stakes` — Implemented in catalog.ts (ref: crimsonland:00437810)
  - Translation: Ring stream around center + bonus collection objective

- [x] `quest_build_evil_zombies_at_large` — Implemented in catalog.ts (ref: crimsonland:004374a0)
  - Translation: Escalating zombie wave counts from all edges

## Function Checklist

- [x] `quest_build_8_legged_terror` — IMPLEMENTED (ref: crimsonland:00436120)
- [x] `quest_build_alien_dens` — IMPLEMENTED (ref: crimsonland:00436720)
- [x] `quest_build_alien_squads` — IMPLEMENTED (ref: crimsonland:00435ea0)
- [ ] `quest_build_arachnoid_farm` — TODO (ref: crimsonland:00436820)
- [ ] `quest_build_cross_fire` — TODO (ref: crimsonland:00435480)
- [ ] `quest_build_deja_vu` — TODO (ref: crimsonland:00437920)
- [x] `quest_build_everred_pastures` — IMPLEMENTED (ref: crimsonland:004375a0)
- [x] `quest_build_evil_zombies_at_large` — IMPLEMENTED (ref: crimsonland:004374a0)
- [ ] `quest_build_fallback` — TODO (ref: crimsonland:004343e0)
- [x] `quest_build_frontline_assault` — IMPLEMENTED (ref: crimsonland:00437e10)
- [ ] `quest_build_gauntlet` — TODO (ref: crimsonland:004369a0)
- [ ] `quest_build_ghost_patrols` — TODO (ref: crimsonland:00436200)
- [ ] `quest_build_hidden_evil` — TODO (ref: crimsonland:00435a30)
- [x] `quest_build_land_hostile` — IMPLEMENTED (ref: crimsonland:00435bd0)
- [ ] `quest_build_land_of_lizards` — TODO (ref: crimsonland:00437ba0)
- [ ] `quest_build_lizard_kings` — TODO (ref: crimsonland:00437710)
- [ ] `quest_build_lizard_raze` — TODO (ref: crimsonland:00438840)
- [ ] `quest_build_lizard_zombie_pact` — TODO (ref: crimsonland:00438700)
- [ ] `quest_build_major_alien_breach` — TODO (ref: crimsonland:00437af0)
- [x] `quest_build_minor_alien_breach` — IMPLEMENTED (ref: crimsonland:00435cc0)
- [x] `quest_build_nesting_grounds` — IMPLEMENTED (ref: crimsonland:004364a0)
- [x] `quest_build_spider_spawns` — IMPLEMENTED (ref: crimsonland:00436d70)
- [x] `quest_build_spider_wave_syndrome` — IMPLEMENTED (ref: crimsonland:00436440)
- [ ] `quest_build_spideroids` — TODO (ref: crimsonland:004373c0)
- [ ] `quest_build_spiders_inc` — TODO (ref: crimsonland:004390d0)
- [ ] `quest_build_surrounded_by_reptiles` — TODO (ref: crimsonland:00438940)
- [ ] `quest_build_survival_of_the_fastest` — TODO (ref: crimsonland:00437060)
- [x] `quest_build_sweep_stakes` — IMPLEMENTED (ref: crimsonland:00437810)
- [ ] `quest_build_syntax_terror` — TODO (ref: crimsonland:00436c10)
- [x] `quest_build_target_practice` — IMPLEMENTED (ref: crimsonland:00437a00)
- [ ] `quest_build_the_annihilation` — TODO (ref: crimsonland:004382c0)
- [ ] `quest_build_the_beating` — TODO (ref: crimsonland:00435610)
- [ ] `quest_build_the_blighting` — TODO (ref: crimsonland:00438050)
- [ ] `quest_build_the_collaboration` — TODO (ref: crimsonland:00437f30)
- [ ] `quest_build_the_end_of_all` — TODO (ref: crimsonland:00438e10)
- [ ] `quest_build_the_fortress` — TODO (ref: crimsonland:004352d0)
- [ ] `quest_build_the_gang_wars` — TODO (ref: crimsonland:00435120)
- [ ] `quest_build_the_killing` — TODO (ref: crimsonland:004384a0)
- [ ] `quest_build_the_lizquidation` — TODO (ref: crimsonland:00437c70)
- [ ] `quest_build_the_massacre` — TODO (ref: crimsonland:004383e0)
- [x] `quest_build_the_random_factor` — IMPLEMENTED (ref: crimsonland:00436350)
- [ ] `quest_build_the_spanking_of_the_dead` — TODO (ref: crimsonland:004358a0)
- [ ] `quest_build_the_unblitzkrieg` — TODO (ref: crimsonland:00438a40)
- [x] `quest_build_two_fronts` — IMPLEMENTED (ref: crimsonland:00436ee0)
- [ ] `quest_build_zombie_masters` — TODO (ref: crimsonland:004360a0)
- [ ] `quest_build_zombie_time` — TODO (ref: crimsonland:00437d70)
- [ ] `quest_database_advance_slot` — TODO (ref: crimsonland:004343c0)
- [ ] `quest_database_init` — TODO (ref: crimsonland:00439230)
- [ ] `quest_meta_init` — TODO (ref: crimsonland:00412190)
- [ ] `quest_meta_init_entry` — TODO (ref: crimsonland:00430a20)
- [x] `quest_mode_update` — PARTIAL (ref: crimsonland:004070e0; TS: `src/sim/systems/mode_quest.ts`)
- [x] `quest_results_screen_update` — IMPLEMENTED (ref: crimsonland:00410d20; TS: `src/scenes/QuestResultsScene.ts`)
- [x] `quest_spawn_table_empty` — PARTIAL (ref: crimsonland:00434220; cursor-based timeline with no pending events)
- [x] `quest_spawn_timeline_update` — PARTIAL (ref: crimsonland:00434250; deterministic timeline events)
- [x] `quest_failed_screen_update` — IMPLEMENTED (ref: crimsonland:004107e0; TS: `src/scenes/QuestFailedScene.ts`)
- [ ] `quest_start_selected` — TODO (ref: crimsonland:0043a790)

## Quest Catalog Structure

Implemented in TICKET-320:

- `src/tools/extract_quest_names.ts` — Extracts quest builder function names from reference C file
- `docs/ref/quest-list.md` — Ordered list of all 51 quests with addresses
- `src/content/quests/quest_ids.ts` — Generated quest ID constants and titles
- `src/content/quests/catalog.ts` — Quest definitions with 20 implemented quests
- `src/scenes/QuestSelectScene.ts` — UI for quest selection

## Translation Notes

The reference C code uses `quest_spawn_entry_t` structures with:
- `pos_x`, `pos_y` — Absolute world positions (1024x1024 world)
- `template_id` — Creature type identifier (hex values 0x00-0x43+)
- `trigger_time_ms` — Spawn time in milliseconds
- `count` — Number of creatures to spawn
- `heading` — Initial facing direction

Our TypeScript implementation simplifies this to:
- `QuestTimelineEvent` with `atTick` (60fps ticks)
- `creatureKind` — String identifier mapped from template_id
- `pattern` — Spawn pattern (edge, ring, random, fixed)
- `count` — Number to spawn
- `radius` — Ring radius (for ring pattern)
- `center` — Optional center point for ring spawns
- `positions` — Absolute spawn points (mapped from 1024x1024 reference space)

### Creature Kind Mapping (Approximation)

Based on visual analysis of template properties (health, speed, size):

| template_id | Approx. kind | Notes |
|-------------|--------------|-------|
| 0x00, 0x01 | grunt | Basic creature |
| 0x03, 0x04 | runner | Fast, low HP |
| 0x0b | runner | Fast variant |
| 0x0c, 0x0d | grunt | Medium speed |
| 0x10 | grunt | Basic variant |
| 0x15, 0x16, 0x17 | tank/runner/grunt | Three types (army_of_three) |
| 0x1c, 0x1d | grunt | Medium creatures |
| 0x31, 0x32, 0x33 | grunt | Various grunt types |
| 0x3a, 0x3c | tank | Larger creatures |
| 0x40, 0x41, 0x42, 0x43 | runner/grunt/tank | Fast/medium/heavy variants |

This mapping is approximate; the original game has ~68 creature types and we only have 3.

## Missing Objective Types

Currently implemented:
- `survive` — Survive for a duration
- `killCount` — Kill specific number of creatures
- `score` — Achieve a score target
- `bonusCollect` — Collect a bonus (any or specific)

Not yet needed but may be required for future quests:
- Collection objectives (non-bonus)
- Position-based objectives
- Time-based completion (reach before time)

## Manual Playtest Protocol

### Quest Mode Verification

To manually verify quest mode works correctly:

1. **Load the test quest**:
   - Start the game in quest mode with `questId: 'quest_test_short'`
   - Observe that the quest loads successfully without falling back to the default quest

2. **Verify survival objective**:
   - Watch the elapsed timer in the HUD
   - Confirm victory triggers at tick 120 (2000ms)
   - Verify the quest status changes from "Playing" to "Success"

3. **Verify spawn events**:
   - First spawn should occur at tick 60 (1000ms)
   - Second spawn should occur at tick 90 (1500ms)
   - Confirm creatures appear at expected times and positions

4. **Verify quest completion flow**:
   - After reaching tick 120, the QuestResultsScene should appear
   - Verify the results screen shows success status and elapsed time

5. **Key scenarios to test**:
   - **Survival victory**: Complete the objective duration without dying
   - **Spawn timing**: All timeline events fire at correct ticks
   - **Status transitions**: Playing → Success (or Failed if player dies)
   - **Fallback behavior**: Invalid questId should fall back to first quest

6. **Additional validation**:
   - Check browser console for any errors or warnings
   - Verify `playSfx` and other sim events are emitted during quest
   - Confirm no creatures spawn after the quest completes

### Automated Test Coverage

The automated test in `tests/sim_quest_mode.test.ts` validates:
- Spawn events fire during quest execution
- Quest status changes to Success at the correct tick
- Exactly one status change event is emitted
- The quest completes within the expected tick count (120)
