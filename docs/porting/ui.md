# Ui Subsystem

Functions: 37

## Implemented UI Flows

### TICKET-140 — HUD + Pause + GameOver + Restart Loop

#### HUD Overlay (`src/ui/Hud.ts`)
- HP display: `player.hp / player.hpMax`
- Score display
- Weapon name display
- Pause overlay ("PAUSED" text)
- Optional debug info (entity counts)

#### Pause Behavior
- Toggle with ESC or P key
- Toggles sim phase between `Playing` and `Paused`
- Sim stepping stops when paused
- Shows overlay text when paused

#### GameOver Scene (`src/scenes/GameOverScene.ts`)
- Shows "GAME OVER" text
- Displays final score
- Displays time alive
- Restart button (starts game with same seed)
- Back to Title button
- Keyboard shortcuts (Enter for restart, ESC for title)

#### Scene Transitions
- When sim enters `GameOver` phase:
  - GameScene stops update loop
  - Transitions to GameOverScene with score, timeAlive, seed

### TICKET-300 — Menus + Mode Selection + Basic UI Surfaces

#### Menu Component (`src/ui/Menu.ts`)
- Generic menu component with vertical list of items
- Supports mouse navigation (hover/click)
- Supports keyboard navigation (UP/DOWN/ENTER/SPACE)
- Visual feedback for selected item
- Each item has label + action callback
- Configurable enabled/disabled state per item

#### UI Style Constants (`src/ui/style.ts`)
- Centralized style definitions
- Font family (Atkinson Hyperlegible, Trebuchet MS)
- Button dimensions
- Color palette (primary, hover, text, background)
- Text styles (title, subtitle, button)

#### TitleScene (`src/scenes/TitleScene.ts`)
- Main menu with 4 options:
  - Survival (starts game in survival mode)
  - Quest (shows stub scene, TODO in TICKET-310)
  - Options (navigates to OptionsScene)
  - Highscores (navigates to HighscoresScene)
- Uses generic Menu component
- Title and subtitle text

#### OptionsScene (`src/scenes/OptionsScene.ts`)
- Stub scene for options
- "Coming soon..." subtitle
- Back to Title button

#### HighscoresScene (`src/scenes/HighscoresScene.ts`)
- Stub scene for highscores
- "Coming soon..." subtitle
- Back to Title button

#### QuestStubScene (`src/scenes/QuestStubScene.ts`)
- Stub scene for quest mode
- "Coming soon in TICKET-310..." subtitle
- Back to Title button

#### GameScene Mode Selection
- GameScene now accepts init data: `{ mode?: 'survival' | 'quest', seed?: number }`
- Mode is passed to Sim state before game starts
- Survival is default mode

## Function Checklist

- [x] `ui_render_hud` — Implemented as `src/ui/Hud.ts` (simplified HUD with HP, score, weapon name, pause overlay)
- [x] `ui_button_update` — Implemented as `src/ui/Menu.ts` (generic menu with hover/keyboard support)
- [ ] `ui_checkbox_update` — TODO (ref: crimsonland:0043dc80)
- [ ] `ui_cursor_render` — TODO (ref: crimsonland:0041a040)
- [ ] `ui_draw_clock_gauge` — TODO (ref: crimsonland:004061e0)
- [ ] `ui_draw_clock_gauge_at` — TODO (ref: crimsonland:0040a4c0)
- [ ] `ui_draw_progress_bar` — TODO (ref: crimsonland:0041a6d0)
- [ ] `ui_draw_textured_quad` — TODO (ref: crimsonland:00417ae0)
- [ ] `ui_element_layout_calc` — TODO (ref: crimsonland:0044fb50)
- [ ] `ui_element_load` — TODO (ref: crimsonland:00419d00)
- [ ] `ui_element_render` — TODO (ref: crimsonland:00446c40)
- [ ] `ui_element_set_rect` — TODO (ref: crimsonland:00419ba0)
- [ ] `ui_element_update` — TODO (ref: crimsonland:00446900)
- [ ] `ui_elements_max_timeline` — TODO (ref: crimsonland:00446190)
- [ ] `ui_elements_reset_state` — TODO (ref: crimsonland:00446170)
- [ ] `ui_elements_update_and_render` — TODO (ref: crimsonland:0041a530)
- [ ] `ui_focus_draw` — TODO (ref: crimsonland:0043d940)
- [ ] `ui_focus_set` — TODO (ref: crimsonland:0043d7e0)
- [ ] `ui_focus_update` — TODO (ref: crimsonland:0043d830)
- [ ] `ui_get_element_index` — TODO (ref: crimsonland:00446150)
- [ ] `ui_list_widget_update` — Implemented as `src/ui/Menu.ts` (vertical list widget with keyboard support)
- [ ] `ui_menu_assets_init` — N/A (no assets needed for web port)
- [x] `ui_menu_item_update` — Implemented as `src/ui/Menu.ts` (menu item with hover/click actions)
- [ ] `ui_menu_layout_init` — Implemented as `src/ui/Menu.ts` (simple vertical layout)
- [x] `ui_menu_main_click_options` — Implemented (Options button in TitleScene)
- [x] `ui_menu_main_click_play_game` — Implemented (Survival button in TitleScene)
- [ ] `ui_menu_main_click_quit` — TODO (Quit button, if needed for web)
- [ ] `ui_mouse_inside_rect` — Implemented via Phaser input events in Menu component
- [ ] `ui_profile_menu_update` — TODO (ref: crimsonland:004443c0)
- [ ] `ui_render_aim_enhancement` — TODO (ref: crimsonland:0041a320)
- [ ] `ui_render_aim_indicators` — TODO (ref: crimsonland:0040a510)
- [ ] `ui_render_keybind_help` — TODO (ref: crimsonland:00405160)
- [ ] `ui_render_loading` — TODO (ref: crimsonland:00402d50)
- [ ] `ui_scrollbar_update` — TODO (ref: crimsonland:0043def0)
- [ ] `ui_text_input_render` — TODO (ref: crimsonland:004413a0)
- [ ] `ui_text_input_update` — TODO (ref: crimsonland:0043ecf0)
- [ ] `ui_update_notice_update` — TODO (ref: crimsonland:00442150)

## Notes on Remaining Work
- Options UI (volume, controls) - slated for TICKET-400
- Highscores persistence - slated for TICKET-340
- Quest mode UI - slated for TICKET-310
- Perk selection UI implemented for `phase === 'PerkSelect'` (overlay with 3 choices)
