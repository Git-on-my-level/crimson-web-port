# TICKET-400: Options — Controls + Audio Volume + Persistence

## Summary
Implemented a complete options/settings system with keybind remapping, volume controls, and localStorage persistence.

## Implementation Details

### 1. Settings Model (`src/persistence/settings.ts`)
- Created comprehensive `Settings` interface with:
  - `Keybinds` interface for all game actions
  - `VolumeSettings` interface for master, sfx, and music volume
- Implemented localStorage persistence with safety checks (follows pattern from `highscores.ts`)
- Provided utility functions:
  - `loadSettings()` - Load from localStorage with defaults
  - `saveSettings()` - Save to localStorage
  - `updateVolumeSettings()` - Partial update of volume
  - `updateKeybindSetting()` - Update individual keybind
  - `resetKeybindsToDefaults()` - Reset all keybinds
  - `resetVolumeToDefaults()` - Reset all volumes

Default keybinds:
- Movement: W/A/S/D
- Fire: Space
- Reload: R
- Weapon Switch: 1-5
- Pause: P

### 2. Input Adapter Updates (`src/adapters/phaser/input.ts`)
- Added `keybinds` property to store current keybindings
- Added `reloadKeybinds()` method to reload settings without restart
- Added `isKeybindDown()` helper method
- Updated `readInput()` to use keybinds from settings
- Updated `readWeaponSwitch()` to use configurable keybinds
- Maintains backward compatibility with arrow keys and Escape for pause

### 3. Options Scene (`src/scenes/OptionsScene.ts`)
Implemented full-featured options UI with tabbed interface:

**Tabs:**
- Controls tab for keybind remapping
- Volume tab for audio settings

**Keybind Remapping:**
- Visual list of all configurable actions
- Click-to-bind interface
- Remapping overlay with instruction text
- Escape to cancel remapping
- Reset to Defaults button

**Volume Controls:**
- Interactive sliders for Master, SFX, and Music
- Real-time percentage display
- Drag and click interaction
- Reset to Defaults button

### 4. Audio Adapter (`src/adapters/phaser/audio.ts`)
- Created stub audio adapter that respects volume settings
- Implements logging-based SFX/music playback (placeholder for future audio)
- Volume methods for programmatic control
- Reload settings support for hot-reload of volume changes

## Technical Decisions

### Keybind Storage
- Uses string codes (W, SPACE, ONE, etc.) for consistency
- Maps to Phaser.Input.Keyboard.Key codes
- Supports both letter keys and special keys (Space, Arrow keys, Escape)

### Volume System
- 0.0-1.0 range for all volume controls
- Effective volume calculation: `master * sfx` or `master * music`
- When SFX or music is at 0%, sounds are not played
- Updates apply immediately via localStorage

### Persistence Strategy
- Storage key: `crimson_port.settings.v1`
- Versioned storage for future migration
- Graceful fallback to defaults if storage unavailable
- Partial updates supported (e.g., just volume changes)

## Files Created/Modified

**Created:**
- `src/persistence/settings.ts` - Settings model and persistence
- `src/adapters/phaser/audio.ts` - Audio adapter with volume support

**Modified:**
- `src/adapters/phaser/input.ts` - Added keybind support
- `src/scenes/OptionsScene.ts` - Complete rewrite with options UI

## Testing

### Manual Testing Checklist
- [x] Keybind remapping works for all actions
- [x] Remapped keys apply immediately in gameplay
- [x] Volume sliders update display and persist
- [x] Settings persist across page reloads
- [x] Reset to Defaults buttons work correctly
- [x] Options scene navigates cleanly to/from title

### Known Limitations
- Audio adapter is a stub (logs to console)
- No actual audio assets integrated yet
- No duplicate keybind prevention (user can bind same key to multiple actions)
- No validation of keybind conflicts

## Future Enhancements
- Integrate actual SFX/music assets when available
- Add keybind conflict detection and resolution
- Add more configurable actions (perk shortcuts, etc.)
- Add graphics quality settings
- Add screen shake/vibration toggles

## References
- Highscores persistence pattern: `src/persistence/highscores.ts`
- Input system: `src/adapters/phaser/input.ts`, `src/sim/systems/input.ts`
- Menu system: `src/ui/Menu.ts`
