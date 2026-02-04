# Input Subsystem

Functions: 5

## Function Checklist

- [ ] `input_any_key_pressed` — TODO (ref: crimsonland:00446000)
- [ ] `input_key_name` — TODO (ref: crimsonland:004036d0)
- [ ] `input_primary_is_down` — TODO (ref: crimsonland:004460f0)
- [ ] `input_primary_just_pressed` — TODO (ref: crimsonland:00446030)
- [ ] `input_scheme_label` — TODO (ref: crimsonland:00447cf0)

## Implementation Notes

**Implemented Features:**
- Configurable keybinds via settings system
- Support for movement (WASD/Arrows), fire (Space), reload (R), weapon switch (1-5), pause (P)
- Input adapter reads from `src/sim/systems/input.ts` and settings
- Mouse aiming via pointer position

**Files:**
- `src/adapters/phaser/input.ts` - Phaser keyboard/mouse → InputFrame adapter
- `src/sim/systems/input.ts` - Input application to sim state
- `src/persistence/settings.ts` - Keybind configuration storage

**See Also:**
- TICKET-400 documentation: `docs/progress/TICKET-400.md`
- Config subsystem: `docs/porting/config.md`
