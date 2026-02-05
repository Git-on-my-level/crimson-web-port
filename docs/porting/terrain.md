# Terrain Subsystem

Functions: 2

## Function Checklist

- [x] `terrain_generate` — Deterministic terrain grid generated from seed in `src/sim/terrain.ts`. (ref: crimsonland:00417b80)
- [x] `terrain_generate_random` — RNG-driven obstacle layout with smoothing + clear zones in `src/sim/terrain.ts`. (ref: crimsonland:004181b0)
- [x] `terrain_render` — Procedural tile background in Phaser. (ref: crimsonland:004188a0)

## Notes
- Terrain is background-only with no obstacle collisions. The `blocked` grid is maintained for compatibility but always contains zeros.
- Movement is clamped to world bounds only; there is no sliding against terrain obstacles.
- Projectiles despawn only when they exit world bounds or reach lifetime, not on terrain cells.
- Spawn selection does not use terrain avoidance; positions are simply clamped to world bounds.
- Differences vs original: no authored terrain variants yet, and rendering uses procedural background generation instead of original tiles.
