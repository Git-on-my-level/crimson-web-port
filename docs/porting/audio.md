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
- Phaser audio adapter wired to the global sound manager
- Real SFX + music playback with master/SFX/music volume control
- Sim events (`playSfx`, `pickup`, `perkOffered`, `perkChosen`) routed to audio
- UI click sounds on menu interactions
- Volume persistence via settings system with live volume updates
- Basic SFX de-dupe cooldown to prevent spam

**Files:**
- `src/adapters/phaser/audio.ts` - Phaser audio adapter with playback + volume control
- `src/audio/sfx.ts` - Sim SFX name mapping + preload keys
- `src/scenes/GameScene.ts` - Sim event routing to audio
- `src/scenes/TitleScene.ts` / `OptionsScene.ts` - UI click SFX + music start
- `src/persistence/settings.ts` - Volume configuration storage
- `src/sim/types.ts` - `playSfx` SimEvent type

**See Also:**
- TICKET-400 documentation: `docs/progress/TICKET-400.md`
- Config subsystem: `docs/porting/config.md`
