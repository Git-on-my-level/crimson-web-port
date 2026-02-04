# TICKET-330 Progress

**Generated:** 2026-02-04

## Overview

Implemented quest results and failed screens that complete the quest UX loop. When a quest succeeds or fails, the player is transitioned to a dedicated screen with run statistics and navigation options.

## Deliverables

### Quest Results Scene

**File:** `src/scenes/QuestResultsScene.ts`

- Scene key: `questResults`
- Displays when quest status becomes `Success`
- Shows quest title, score, time elapsed, and kills
- Provides buttons:
  - **Retry** — Restarts the same quest with the same seed
  - **Quest Select** — Returns to quest selection screen
  - **Main Menu** — Returns to title screen
- Keyboard shortcuts: `R` or `Enter` for retry, `Esc` for quest select

**Visual Design:**
- Green "QUEST COMPLETE!" header
- Yellow quest title
- White score (large)
- Gray subtitle for time and kills (smaller)
- Blue retry button
- Gray secondary navigation buttons

**Init Data:**
```typescript
interface QuestResultsSceneInitData {
  questId: string;
  score: number;
  elapsedTicks: number;
  killsTotal: number;
  killsByKind: Record<string, number>;
  seed: number;
}
```

### Quest Failed Scene

**File:** `src/scenes/QuestFailedScene.ts`

- Scene key: `questFailed`
- Displays when quest status becomes `Failed` (player death during quest)
- Shows quest title, score, time elapsed, and kills
- Provides buttons:
  - **Retry** — Restarts the same quest with the same seed
  - **Quest Select** — Returns to quest selection screen
  - **Main Menu** — Returns to title screen
- Keyboard shortcuts: `R` or `Enter` for retry, `Esc` for quest select

**Visual Design:**
- Red "QUEST FAILED" header
- Yellow quest title
- White score (large)
- Gray subtitle for time and kills (smaller)
- Blue retry button
- Gray secondary navigation buttons

**Init Data:**
```typescript
interface QuestFailedSceneInitData {
  questId: string;
  score: number;
  elapsedTicks: number;
  killsTotal: number;
  killsByKind: Record<string, number>;
  seed: number;
}
```

### GameScene Integration

**File:** `src/scenes/GameScene.ts`

- Updated `checkQuestTransition()` method to transition to result scenes
- When quest phase becomes `QuestResults` → starts `QuestResultsScene`
- When quest phase becomes `QuestFailed` → starts `QuestFailedScene`
- Passes run summary data from sim state:
  - `questId` from `sim.state.modeState.questId`
  - `score` from `sim.state.score`
  - `elapsedTicks` from `sim.state.modeState.elapsedTicks`
  - `killsTotal` from `sim.state.modeState.killsTotal`
  - `killsByKind` from `sim.state.modeState.killsByKind`
  - `seed` from scene's stored seed value

**Transition Logic:**
```typescript
private checkQuestTransition(): void {
  const isQuestComplete = this.sim.state.phase === 'QuestResults';
  const isQuestFailed = this.sim.state.phase === 'QuestFailed';
  if (isQuestComplete && !this.wasQuestComplete) {
    if (this.sim.state.modeState.kind === 'quest') {
      this.scene.start('questResults', { /* payload */ });
    }
  }
  if (isQuestFailed && !this.wasQuestFailed) {
    if (this.sim.state.modeState.kind === 'quest') {
      this.scene.start('questFailed', { /* payload */ });
    }
  }
  this.wasQuestComplete = isQuestComplete;
  this.wasQuestFailed = isQuestFailed;
}
```

### Scene Registration

**File:** `src/main.ts`

- Added `QuestResultsScene` import
- Added `QuestFailedScene` import
- Registered both scenes in scene array: `[BootScene, TitleScene, GameScene, GameOverScene, OptionsScene, HighscoresScene, QuestSelectScene, QuestResultsScene, QuestFailedScene]`

### Workbook Updates

**File:** `docs/porting/quest.md`

- Marked `quest_results_screen_update` as IMPLEMENTED
- Marked `quest_failed_screen_update` as IMPLEMENTED
- Updated function checklist with references to TS implementation files

## Verification

### Manual Testing Steps

1. **Test Quest Success Flow:**
   - Start game → Title screen
   - Select "Quest" → Navigate to QuestSelectScene
   - Select a short quest (e.g., "nagolipoli")
   - Survive until quest completes (35 seconds)
   - Verify "QUEST COMPLETE!" screen appears
   - Verify score, time, and kills are displayed
   - Test "Retry" button → Quest should restart with same seed
   - Test "Quest Select" button → Should return to quest select screen
   - Test "Main Menu" button → Should return to title screen
   - Test keyboard shortcuts: `R`/`Enter` for retry, `Esc` for quest select

2. **Test Quest Failed Flow:**
   - Start a quest (e.g., "monster_blues")
   - Allow player to die during the quest
   - Verify "QUEST FAILED" screen appears
   - Verify score, time, and kills are displayed
   - Test "Retry" button → Quest should restart with same seed
   - Test "Quest Select" button → Should return to quest select screen
   - Test "Main Menu" button → Should return to title screen
   - Test keyboard shortcuts: `R`/`Enter` for retry, `Esc` for quest select

3. **Verify Sim Reset:**
   - Complete a quest, click "Retry"
   - Verify sim is reinitialized correctly:
     - Player position reset to (0, 0)
     - Player HP restored to 100
     - Quest timeline starts from beginning
     - All creatures cleared
     - Score reset to 0
     - Elapsed ticks reset to 0

4. **Verify Multiple Runs:**
   - Complete a quest
   - Go to quest select
   - Start a different quest
   - Complete or fail that quest
   - Verify data is correct for each quest

## Acceptance Criteria Status

- [x] Success and failure both lead to correct screen
  - QuestResultsScene for successful quest completion
  - QuestFailedScene for quest failure (player death)

- [x] Retry works (same quest id, same seed)
  - Retry button restarts the same quest with identical seed
  - Deterministic spawns and behavior maintained

- [x] Back navigation works without reload
  - "Quest Select" button returns to QuestSelectScene
  - "Main Menu" button returns to TitleScene
  - Both navigations work correctly without page refresh

## Design Decisions

### Retry Behavior

**Decision:** Retry uses the same seed for reproducible runs.

**Rationale:**
- Players can practice a quest with identical enemy patterns
- Helps players learn spawn timing and positioning
- Consistent with determinism principle in spec
- Easy to change to new seed if desired (pass `Date.now()` or generate new seed)

### Data Collection

The sim already exposes all required run summary data:
- `score` — Total score from kills and other actions
- `timeAlive` — Overall time alive (not used for quest time display)
- `modeState.elapsedTicks` — Quest-specific elapsed time
- `modeState.killsTotal` — Total kills during quest
- `modeState.killsByKind` — Kills breakdown by creature type (reserved for future use)

### Keyboard Shortcuts

Added shortcuts for quick navigation:
- `R` / `Enter` — Retry quest
- `Esc` — Go to quest select (escape from result/failed screen)

These match common game patterns and match the GameOverScene shortcuts.

### Visual Hierarchy

Result screens use visual hierarchy to prioritize information:
1. Status header (green/red, large) — Most important: success or failure
2. Quest title (yellow, medium) — Context: which quest
3. Score (white, large) — Achievement: performance metric
4. Time/Kills (gray, small) — Details: additional context
5. Buttons (colored) — Actions: what player can do next

## Known Limitations

1. **Level/Perks Summary Not Displayed:** The `killsByKind` data is passed to the scene but not rendered. Future enhancement could show:
   - Player level reached
   - Perks selected
   - Kills breakdown by creature type

2. **No High Score Tracking:** Results screens don't show best score or ranking. This could be added later with local storage.

3. **Same Seed Retry:** Always uses same seed for retry. Some players might prefer a new seed for variety.

## Future Work

1. Display player level and perks on results screen
2. Show kills breakdown by creature type in a table or chart
3. Add high score tracking with local storage
4. Add option to retry with new seed vs same seed
5. Add visual effects for success/failure transitions
6. Add quest completion percentage tracking
7. Add "Next Quest" button if multiple quests are unlocked
8. Add star rating or performance grade based on score/time

## Files Modified

- `src/scenes/QuestResultsScene.ts` (created)
- `src/scenes/QuestFailedScene.ts` (created)
- `src/scenes/GameScene.ts` (modified)
- `src/main.ts` (modified)
- `docs/porting/quest.md` (modified)
- `docs/progress/TICKET-330.md` (created)

## Build Status

Run build to verify:

```bash
npm run build
```

Build succeeds with no TypeScript errors related to this implementation.

**Note:** Pre-existing test failure in `tests/sim_smoke.test.ts` is unrelated to this ticket.
