# Survival Mode Subsystem

Functions: 3

## Function Checklist

- [x] `survival_update` — Implemented in `src/sim/systems/mode_survival.ts` (data-driven spawn budget + tiers).
- [x] `survival_spawn_creature` — Implemented via `spawnCreatureAtEdge()` in `src/sim/systems/creatures.ts`.
- [x] `survival_gameplay_update_and_render` — Implemented by `Sim.step()` mode branching in `src/sim/sim.ts`.

## Notes
- Survival pacing now uses phase-based escalation with template-driven weights + per-kind caps.
- Special wave queue injects timed bursts (ring/edge/near spawns) while remaining deterministic.
- Kill totals are tracked in survival mode state for highscores/UX.
- The sim remains deterministic by routing all randomness through `state.rng`.
