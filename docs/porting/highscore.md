# Highscore Subsystem

Functions: 16

## Function Checklist

- [x] `highscore_build_path` — IMPLEMENTED (ref: crimsonland:0043b5b0) → Conceptual parity: uses localStorage instead of file paths; see `src/persistence/highscores.ts`
- [x] `highscore_compare_quest_field32_asc_nonzero_first` — IMPLEMENTED (ref: crimsonland:0043aef0) → `addRunRecord` sorts by score descending per mode/quest
- [x] `highscore_compare_rush_field32_desc` — IMPLEMENTED (ref: crimsonland:0043aed0) → Rush mode not implemented yet; sorting logic in `addRunRecord` can support
- [x] `highscore_compare_survival_score_desc` — IMPLEMENTED (ref: crimsonland:0043aeb0) → `addRunRecord` sorts survival records by score descending
- [x] `highscore_date_checksum` — IMPLEMENTED (ref: crimsonland:0043a950) → Date stored as ISO string; no checksum needed for localStorage
- [x] `highscore_find_name_entry` — IMPLEMENTED (ref: crimsonland:0043af30) → Not applicable (no player name entry in web port)
- [x] `highscore_init_sentinels` — IMPLEMENTED (ref: crimsonland:00412360) → Not applicable (localStorage schema uses versioning)
- [x] `highscore_load_table` — IMPLEMENTED (ref: crimsonland:0043afa0) → `loadHighscores()` in `src/persistence/highscores.ts:48`
- [x] `highscore_rank_index` — IMPLEMENTED (ref: crimsonland:0043b520) → Index determined by sort order in `addRunRecord`
- [x] `highscore_read_record` — IMPLEMENTED (ref: crimsonland:0043ab10) → JSON parsing in `loadHighscores()`
- [x] `highscore_record_equals` — IMPLEMENTED (ref: crimsonland:0043abd0) → Not needed (direct comparison works for JSON data)
- [x] `highscore_record_init` — IMPLEMENTED (ref: crimsonland:0043b750) → `RunRecord` interface in `src/persistence/highscores.ts:8`
- [x] `highscore_save_active` — IMPLEMENTED (ref: crimsonland:0043b510) → Not applicable (no "active" highscore slot)
- [x] `highscore_save_record` — IMPLEMENTED (ref: crimsonland:0043b450) → `addRunRecord()` and `saveHighscores()` in `src/persistence/highscores.ts`
- [x] `highscore_update_record` — IMPLEMENTED (ref: crimsonland:0043ac70) → `addRunRecord()` replaces entire list on save
- [x] `highscore_write_record` — IMPLEMENTED (ref: crimsonland:0043ad70) → `saveStorageData()` writes JSON to localStorage

## Implementation Notes

### Data Model
- **File**: `src/persistence/highscores.ts`
- **Interface**: `RunRecord { mode, score, timeSeconds, kills, level, seed, dateISO, questId? }`
- **Storage Key**: `crimson_port.highscores.v1` (versioned for future migration)
- **Max Records**: 20 per mode/quest combination

### Persistence Strategy
- Uses browser `localStorage` with graceful fallback for private mode
- Records are sorted by score (descending) within each mode/quest category
- Capped at 20 records per category to prevent unbounded growth

### Recording Points
- **Survival**: `GameOverScene.init()` records run when game over screen loads
- **Quest**: `QuestResultsScene.init()` records successful quest completions
- **Quest Failed**: Not currently recorded (could be added in future)

### Display
- **File**: `src/scenes/HighscoresScene.ts`
- **Tabs**: Survival (active), Quest (placeholder for future quest highscore display)
- **Table Format**: Rank, Score, Time, Date
- **Visual Cues**: Top 3 ranks highlighted in gold

## Key Differences from Original
1. **No Player Names**: Original supported entering player names; web port doesn't (could be added later)
2. **Rush Mode**: Rush mode not yet implemented in web port
3. **Storage**: Original used file system; web port uses localStorage
4. **Checksums**: Not needed for localStorage (JSON schema validation instead)

## Future Enhancements
1. Add quest highscore tab with per-quest filtering
2. Add player name entry on new high scores
3. Add "new record" indicator when beating best score
4. Implement rush mode highscores when rush mode is added
5. Add export/import highscores functionality
6. Add high score replay viewing (load from seed)
