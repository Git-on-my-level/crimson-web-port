# Gameplay Subsystem

Functions: 3

## Function Checklist

- [x] `gameplay_render_world` — Implemented (basic render adapter in `src/adapters/phaser/render.ts`) (ref: crimsonland:00405960)
- [x] `gameplay_reset_state` — Implemented (basic sim reset in `src/sim/sim.ts`) (ref: crimsonland:00412dc0)
- [x] `gameplay_update_and_render` — Implemented (split between `src/sim/sim.ts` and `src/scenes/GameScene.ts`) (ref: crimsonland:0040aab0)

## Notes
- Sim state now tracks a `phase` (`Playing`/`GameOver`/`Paused`/`PerkSelect`) in `src/sim/state.ts`. The sim step freezes updates when not playing (see `src/sim/sim.ts`).
- Render/update loop currently lives in Phaser `GameScene.update()`, which steps the sim and then calls the render adapter.
