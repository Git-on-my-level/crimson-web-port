# Terrain Subsystem

Functions: 3

## Function Checklist

- [x] `terrain_generate` — Deterministic terrain grid generated from seed in `src/sim/terrain.ts`. (ref: crimsonland:00417b80)
- [x] `terrain_generate_random` — RNG-driven obstacle layout with smoothing + clear zones in `src/sim/terrain.ts`. (ref: crimsonland:004181b0)
- [x] `terrain_render` — Procedural tile background + obstacle overlay in Phaser. (ref: crimsonland:004188a0)

## Notes
- Terrain is represented as a low-res collision grid (`TERRAIN_CELL_SIZE = 8`) with smoothing passes for blob-like obstacles.
- Center radius and edge margins are cleared to ensure consistent spawn and player start space.
- Movement uses a simple clamp-or-slide response against blocked cells; projectiles despawn on blocked terrain.
- Spawn selection uses terrain avoidance; spawns are adjusted to nearest open space if needed.
- Differences vs original: no authored terrain variants yet, obstacle resolution is coarser, and rendering uses a flat obstacle overlay instead of original tiles.
