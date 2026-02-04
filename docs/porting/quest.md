# Quest Subsystem

Functions: 61

## Runtime Status

- Quest runtime model implemented in `src/sim/systems/mode_quest.ts` (timeline stepping, objectives, status transitions).
- Spawn timeline is represented as ordered events with a `nextTimelineIndex` cursor.
- Quest results/failed phases are represented in sim (`QuestResults`, `QuestFailed`).
- Quest catalog implemented in `src/content/quests/catalog.ts` with 5 quests from reference.

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

## Function Checklist

- [ ] `quest_build_8_legged_terror` — TODO (ref: crimsonland:00436120)
- [ ] `quest_build_alien_dens` — TODO (ref: crimsonland:00436720)
- [ ] `quest_build_alien_squads` — TODO (ref: crimsonland:00435ea0)
- [ ] `quest_build_arachnoid_farm` — TODO (ref: crimsonland:00436820)
- [ ] `quest_build_cross_fire` — TODO (ref: crimsonland:00435480)
- [ ] `quest_build_deja_vu` — TODO (ref: crimsonland:00437920)
- [ ] `quest_build_everred_pastures` — TODO (ref: crimsonland:004375a0)
- [ ] `quest_build_evil_zombies_at_large` — TODO (ref: crimsonland:004374a0)
- [ ] `quest_build_fallback` — TODO (ref: crimsonland:004343e0)
- [ ] `quest_build_frontline_assault` — TODO (ref: crimsonland:00437e10)
- [ ] `quest_build_gauntlet` — TODO (ref: crimsonland:004369a0)
- [ ] `quest_build_ghost_patrols` — TODO (ref: crimsonland:00436200)
- [ ] `quest_build_hidden_evil` — TODO (ref: crimsonland:00435a30)
- [ ] `quest_build_land_hostile` — TODO (ref: crimsonland:00435bd0)
- [ ] `quest_build_land_of_lizards` — TODO (ref: crimsonland:00437ba0)
- [ ] `quest_build_lizard_kings` — TODO (ref: crimsonland:00437710)
- [ ] `quest_build_lizard_raze` — TODO (ref: crimsonland:00438840)
- [ ] `quest_build_lizard_zombie_pact` — TODO (ref: crimsonland:00438700)
- [ ] `quest_build_major_alien_breach` — TODO (ref: crimsonland:00437af0)
- [ ] `quest_build_minor_alien_breach` — TODO (ref: crimsonland:00435cc0)
- [ ] `quest_build_nesting_grounds` — TODO (ref: crimsonland:004364a0)
- [ ] `quest_build_spider_spawns` — TODO (ref: crimsonland:00436d70)
- [ ] `quest_build_spider_wave_syndrome` — TODO (ref: crimsonland:00436440)
- [ ] `quest_build_spideroids` — TODO (ref: crimsonland:004373c0)
- [ ] `quest_build_spiders_inc` — TODO (ref: crimsonland:004390d0)
- [ ] `quest_build_surrounded_by_reptiles` — TODO (ref: crimsonland:00438940)
- [ ] `quest_build_survival_of_the_fastest` — TODO (ref: crimsonland:00437060)
- [ ] `quest_build_sweep_stakes` — TODO (ref: crimsonland:00437810)
- [ ] `quest_build_syntax_terror` — TODO (ref: crimsonland:00436c10)
- [ ] `quest_build_target_practice` — TODO (ref: crimsonland:00437a00)
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
- [ ] `quest_build_the_random_factor` — TODO (ref: crimsonland:00436350)
- [ ] `quest_build_the_spanking_of_the_dead` — TODO (ref: crimsonland:004358a0)
- [ ] `quest_build_the_unblitzkrieg` — TODO (ref: crimsonland:00438a40)
- [ ] `quest_build_two_fronts` — TODO (ref: crimsonland:00436ee0)
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
- `src/content/quests/catalog.ts` — Quest definitions with 5 implemented quests
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
- `pattern` — Spawn pattern (edge, ring, random)
- `count` — Number to spawn
- `radius` — Ring radius (for ring pattern)

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

Not yet needed but may be required for future quests:
- Collection objectives
- Position-based objectives
- Time-based completion (reach before time)
- Bonus collection
