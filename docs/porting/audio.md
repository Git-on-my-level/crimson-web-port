# Audio Subsystem

Functions: 8

## Function Checklist

- [x] `audio_init_music` — DONE (ref: crimsonland:0043c9c0)
- [x] `audio_init_sfx` — DONE (ref: crimsonland:0043caa0)
- [x] `audio_resume_all` — DONE (ref: crimsonland:0042a5f0)
- [x] `audio_resume_channels` — DONE (ref: crimsonland:0043d770)
- [x] `audio_shutdown_all` — DONE (ref: crimsonland:0043d110)
- [x] `audio_suspend_all` — DONE (ref: crimsonland:0042a630)
- [x] `audio_suspend_channels` — DONE (ref: crimsonland:0043d730)
- [x] `audio_update` — DONE (ref: crimsonland:0043d3f0)

## Implementation Notes

**Implemented Features:**
- Core audio lifecycle functions (init/update/suspend/resume/shutdown)
- Phaser audio adapter wired to the global sound manager
- Real SFX + music playback with master/SFX/music volume control
- Sim events (`playSfx`, `pickup`, `perkOffered`, `perkChosen`) routed to audio
- UI click sounds on menu interactions
- Volume persistence via settings system with live volume updates
- Basic SFX de-dupe cooldown to prevent spam
- Pause/resume handling for game state transitions

**Files:**
- `src/adapters/phaser/audio.ts` - Phaser audio adapter with lifecycle + playback + volume control
- `src/audio/sfx.ts` - Sim SFX name mapping + preload keys
- `src/scenes/BootScene.ts` - Audio initialization on game startup
- `src/scenes/GameScene.ts` - Audio lifecycle (update/pause/resume/shutdown) + event routing
- `src/scenes/TitleScene.ts` / `OptionsScene.ts` - UI click SFX + music start
- `src/persistence/settings.ts` - Volume configuration storage
- `src/sim/types.ts` - `playSfx` SimEvent type

**See Also:**
- TICKET-400 documentation: `docs/progress/TICKET-400.md`
- Config subsystem: `docs/porting/config.md`
