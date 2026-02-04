# TICKET-140 — HUD + Pause + GameOver + Restart Loop

## Summary

Implemented complete user-facing game loop with HUD overlay, pause functionality, and game over/restart flow.

## Implementation Details

### 1. HUD Overlay (`src/ui/Hud.ts`)
Created a new HUD module that displays:
- HP: `player.hp / player.hpMax` (top-left)
- Score: rounded score value (top-center)
- Weapon name: current weapon (top-right)
- Pause overlay: "PAUSED" text centered with semi-transparent background
- Debug info: enemy and projectile counts (bottom-right, optional)

The HUD is independent of game state and only reads from `SimState`. All UI elements are pinned to the camera using `setScrollFactor(0)`.

### 2. Pause Behavior
Modified input handling in `src/sim/systems/input.ts`:
- Toggle phase between `Playing` and `Paused` when pause key is pressed
- ESC and P keys trigger pause toggle
- Sim stepping stops when phase is not `Playing` (already in `Sim.step()`)

Added ESC key to `PhaserInputAdapter` (`src/adapters/phaser/input.ts`).

### 3. GameOver Scene (`src/scenes/GameOverScene.ts`)
Created a new scene that displays:
- "GAME OVER" title
- Final score
- Time alive (in seconds)
- Restart button (starts game with same seed)
- Back to Title button
- Keyboard shortcuts (Enter for restart, ESC for title)

Buttons have hover effects using color changes.

### 4. Scene Transitions
Modified `GameScene.ts`:
- Added `wasGameOver` flag to detect phase change
- Added `checkGameOverTransition()` method
- When sim enters `GameOver` phase, transitions to GameOverScene with:
  - `score`: final score
  - `timeAlive`: time survived
  - `seed`: current seed for replay

### 5. Registration
Updated `src/main.ts` to include `GameOverScene` in the scene list.

## Testing Results

### Manual Testing
- HUD displays correctly with live HP and score updates
- Pause toggle works with both ESC and P keys
- Pause overlay shows correctly and sim stepping stops
- GameOver scene appears when player dies
- Restart button correctly restarts game with same seed
- Back to Title button correctly returns to title screen
- Keyboard shortcuts (Enter/ESC) work on GameOver screen

### Known Issues
- None

## Files Changed

### New Files
- `src/ui/Hud.ts` — HUD overlay implementation
- `src/scenes/GameOverScene.ts` — Game over scene
- `docs/progress/TICKET-140.md` — This document

### Modified Files
- `src/sim/systems/input.ts` — Added pause toggle logic
- `src/adapters/phaser/input.ts` — Added ESC key mapping
- `src/scenes/GameScene.ts` — Integrated HUD and game over transition
- `src/main.ts` — Registered GameOverScene
- `docs/porting/ui.md` — Updated workbook with implemented features

## Acceptance Criteria

- [x] HUD updates live and never shows NaN/undefined
- [x] Pause toggle works and actually freezes sim
- [x] Game over → restart works without needing page refresh
- [x] Back to title works

## Future Work

- Implement perk selection UI when `phase === 'PerkSelect'`
- Add visual flair to HUD (health bar instead of text, weapon icons)
- Add sound effects to button interactions
- Implement main menu with options
