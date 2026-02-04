# Survival Mode Subsystem

Functions: 3

## Function Checklist

- [x] `survival_update` — Implemented in `src/sim/systems/mode_survival.ts` (data-driven spawn budget + tiers).
- [x] `survival_spawn_creature` — Implemented via `spawnCreatureAtEdge()` in `src/sim/systems/creatures.ts`.
- [x] `survival_gameplay_update_and_render` — Implemented by `Sim.step()` mode branching in `src/sim/sim.ts`.

## Notes
- Survival pacing uses a spawn budget that increases per tick based on tiered rates.
- Difficulty ramps every 30 seconds, altering spawn weights and soft caps.
- The sim remains deterministic by routing all randomness through `state.rng`.
