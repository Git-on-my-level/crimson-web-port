# TICKET-300 — Menus + Mode Selection + Basic UI Surfaces

## Status
**Completed**

## Implementation Summary

### Created Files
- `src/ui/style.ts` — Centralized UI style constants
- `src/ui/Menu.ts` — Generic menu component with keyboard and mouse support
- `src/scenes/OptionsScene.ts` — Stub options scene
- `src/scenes/HighscoresScene.ts` — Stub highscores scene
- `src/scenes/QuestStubScene.ts` — Stub quest mode scene
- `docs/progress/TICKET-300.md` — This file

### Modified Files
- `src/scenes/TitleScene.ts` — Updated to use Menu component with 4 menu items
- `src/scenes/GameScene.ts` — Added mode parameter to init data
- `src/main.ts` — Added new scenes to Phaser config
- `docs/porting/ui.md` — Updated with new menu flows and implementation status

## Features Implemented

### Menu Component (`src/ui/Menu.ts`)
- Vertical list of menu items
- Mouse navigation (hover effects, click to activate)
- Keyboard navigation (UP/DOWN to select, ENTER/SPACE to activate)
- Visual feedback for selected item (highlight color)
- Support for disabled items (dimmed color, no activation)
- Clean destroy method for proper cleanup

### UI Style Constants (`src/ui/style.ts`)
- Font family: Atkinson Hyperlegible, Trebuchet MS
- Button dimensions: 240x48 pixels
- Color palette:
  - Primary: #1e40af (blue)
  - Primary hover: #2563eb (lighter blue)
  - Text: #f8fafc (off-white)
  - Text secondary: #94a3b8 (gray)
  - Background: #0b0d12 (dark)
- Text styles for title, subtitle, and button

### Scenes

#### TitleScene
- Main menu with 4 buttons:
  1. Survival — starts game in survival mode
  2. Quest — navigates to QuestStubScene
  3. Options — navigates to OptionsScene
  4. Highscores — navigates to HighscoresScene
- Title and subtitle text
- Proper cleanup in shutdown method

#### OptionsScene (stub)
- "Options" title
- "Coming soon..." subtitle
- Back to Title button

#### HighscoresScene (stub)
- "Highscores" title
- "Coming soon..." subtitle
- Back to Title button

#### QuestStubScene (stub)
- "Quest Mode" title
- "Coming soon in TICKET-310..." subtitle
- Back to Title button

#### GameScene
- Added init data support: `{ mode?: 'survival' | 'quest', seed?: number }`
- Mode is passed to Sim state on game start
- Survival mode is the default

## Acceptance Criteria

- [x] You can navigate menus with keyboard and mouse
- [x] Starting Survival from menu works
- [x] Quest button leads to a stub "Coming soon" screen

## Verification

Manual testing performed:
1. Navigated all menu items with UP/DOWN keys and mouse
2. Started Survival mode from menu — game started correctly
3. Clicked Quest button — stub screen displayed
4. Clicked Options button — stub screen displayed
5. Clicked Highscores button — stub screen displayed
6. Used Back to Title buttons from all stub scenes
7. Used ENTER key to activate menu items
8. Used mouse hover to see button highlighting
9. Confirmed no duplicate scene instances running

## Review Checklist

- [x] No duplicate scene instances running simultaneously
- [x] Mode selection is passed cleanly into sim initialization
- [x] Keyboard navigation works correctly
- [x] Mouse navigation works correctly
- [x] Visual feedback for selected items is clear
- [x] Proper cleanup on scene shutdown

## Notes

- Menu component is reusable and can be used for future menus
- Options scene is a stub pending TICKET-400
- Highscores scene is a stub pending TICKET-340
- Quest mode is a stub pending TICKET-310
- UI style constants are centralized for easy theming
