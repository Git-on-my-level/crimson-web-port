# Survival Mode Subsystem

Functions: 3

## Function Checklist

- [x] `survival_update` — Implemented in `src/sim/systems/mode_survival.ts` (original-style cooldown/interval pacing + template weights).
- [x] `survival_spawn_creature` — Implemented via `spawnCreatureAtEdge()` in `src/sim/systems/creatures.ts`.
- [x] `survival_gameplay_update_and_render` — Implemented by `Sim.step()` mode branching in `src/sim/sim.ts`.

## Notes
- Survival pacing now follows the original cooldown/interval curve (500ms baseline, decaying over time with extra spawns once the interval goes negative).
- Spawns are pulled from template weights with per-kind caps, and still remain deterministic via `state.rng`.
- Kill totals are tracked in survival mode state for highscores/UX.
