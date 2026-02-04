# Audio Subsystem

Functions: 8

## Function Checklist

- [ ] `audio_init_music` — TODO (ref: crimsonland:0043c9c0)
- [ ] `audio_init_sfx` — TODO (ref: crimsonland:0043caa0)
- [ ] `audio_resume_all` — TODO (ref: crimsonland:0042a5f0)
- [ ] `audio_resume_channels` — TODO (ref: crimsonland:0043d770)
- [ ] `audio_shutdown_all` — TODO (ref: crimsonland:0043d110)
- [ ] `audio_suspend_all` — TODO (ref: crimsonland:0042a630)
- [ ] `audio_suspend_channels` — TODO (ref: crimsonland:0043d730)
- [ ] `audio_update` — TODO (ref: crimsonland:0043d3f0)

## Implementation Notes

**Implemented Features:**
- Audio adapter with volume control support (stub implementation)
- Master, SFX, and Music volume controls
- Volume persistence via settings system
- Sim emits `playSfx` events (currently logged to console)

**Files:**
- `src/adapters/phaser/audio.ts` - Audio adapter with volume controls (stub)
- `src/persistence/settings.ts` - Volume configuration storage
- `src/sim/types.ts` - `playSfx` SimEvent type

**See Also:**
- TICKET-400 documentation: `docs/progress/TICKET-400.md`
- Config subsystem: `docs/porting/config.md`
