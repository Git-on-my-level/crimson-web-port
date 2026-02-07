# Survival Mode Subsystem

Functions: 3

## Function Checklist

- [x] `survival_update` — Implemented in `src/sim/systems/mode_survival.ts` (original-style cooldown/interval pacing + template weights).
- [x] `survival_spawn_creature` — Implemented via `spawnCreatureAtEdge()` in `src/sim/systems/creatures.ts`.
- [x] `survival_gameplay_update_and_render` — Implemented by `Sim.step()` mode branching in `src/sim/sim.ts`.
- [x] `survival_hazards` — Implemented in `src/sim/systems/hazards.ts` with deterministic spawn, damage, and lifecycle management.

## Notes
- Survival pacing now follows the original cooldown/interval curve (500ms baseline, decaying over time with extra spawns once the interval goes negative).
- Spawns are pulled from template weights with per-kind caps, and still remain deterministic via `state.rng`.
- Kill totals are tracked in survival mode state for highscores/UX.
- Deterministic boss/elite wave milestones implemented with `SURVIVAL_WAVE_MILESTONES` config in `src/content/creatures.ts`.
- Wave milestones trigger at fixed time intervals, spawning elite/boss creatures with randomized delays using seeded RNG.
- Wave events are emitted via `waveMilestone` SimEvent type for UI integration.

## Hazards
- Hazards are environmental dangers that spawn, persist, damage the player on contact, and despawn after a configurable lifetime.
- Hazard definitions are in `src/content/hazards.ts` with configurable radius, damage, damage cooldown, and color.
- Hazard state includes position, kind, radius, damage, damage cooldown tracking, and lifetime tracking.
- Hazard update loop processes spawn queue from survival mode state, updates lifetimes, and manages damage cooldowns.
- Hazard-player collision is handled in `src/sim/systems/collision.ts` with damage applied per-cooldown tick.
- Hazards are rendered via `PhaserRenderAdapter` in `src/adapters/phaser/render.ts` with filled circles that fade as lifetime decreases.
- All hazard behavior is deterministic via `state.rng` for spawn positioning and timing.
