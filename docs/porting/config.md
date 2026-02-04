# Config Subsystem

Functions: 5

## Function Checklist

- [ ] `config_apply_detail_preset` — TODO (ref: crimsonland:00447580)
- [ ] `config_ensure_file` — TODO (ref: crimsonland:0041f130)
- [ ] `config_init_defaults` — TODO (ref: crimsonland:004028f0)
- [ ] `config_load_presets` — TODO (ref: crimsonland:0041f1a0)
- [ ] `config_sync_from_grim` — TODO (ref: crimsonland:0041ec60)

## Implementation Notes

Implemented settings persistence system in `src/persistence/settings.ts`:

**Implemented Features:**
- Keybind remapping for movement, fire, reload, weapon switch, pause
- Volume controls (master, sfx, music)
- localStorage persistence with versioning
- Options scene UI for configuration

**Files:**
- `src/persistence/settings.ts` - Settings model and persistence layer
- `src/scenes/OptionsScene.ts` - Options UI with keybind remap and volume sliders
- `src/adapters/phaser/input.ts` - Uses configurable keybinds from settings
- `src/adapters/phaser/audio.ts` - Audio adapter with volume support (stub)

**See Also:**
- TICKET-400 documentation: `docs/progress/TICKET-400.md`
