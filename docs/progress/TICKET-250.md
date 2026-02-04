# TICKET-250 — Terrain/background + world bounds + spawn-avoidance safety

## Summary

Centralized world bounds in a new sim `world` module, added spawn-avoidance helpers for creature/bonus spawning, and introduced a lightweight procedural background renderer in Phaser. Updated spawn logic to keep enemies and pickups away from the player and added a sim test to enforce the spawn-distance rule.

## Step 1 — World Config

- Added `src/sim/world.ts` with `WORLD_BOUNDS`, `WORLD_WIDTH`, `WORLD_HEIGHT`, and `clampToWorld` helper.
- Updated player, creature, projectile, and bonus systems to use the shared bounds.

## Step 2 — Spawn Avoidance

- Added `findSpawnPosAwayFromPlayer` (deterministic, RNG-driven) with a fallback to the farthest candidate.
- Creature spawns now retry edge positions away from the player.
- Bonus drops jitter around the kill position and re-roll if too close to the player.

## Step 3 — Background Rendering

- Added `src/adapters/phaser/terrainBackground.ts` with a procedural tile texture (grid + noise).
- Game scene now renders the background using a tile sprite that follows camera scroll for subtle motion.

## Step 4 — Workbook + Docs

- Updated `docs/porting/terrain.md` and `docs/porting/player.md` with the new placeholder terrain + spawn avoidance notes.
- Added this progress report.

## Testing

Added `tests/sim_spawn_avoidance.test.ts` to ensure 100 creature spawns stay beyond the configured minimum distance from the player.

## Files Modified/Created

### Created
- `src/sim/world.ts`
- `src/adapters/phaser/terrainBackground.ts`
- `docs/progress/TICKET-250.md`
- `tests/sim_spawn_avoidance.test.ts`

### Modified
- `src/sim/systems/player.ts`
- `src/sim/systems/creatures.ts`
- `src/sim/systems/projectiles.ts`
- `src/sim/systems/bonuses.ts`
- `src/scenes/GameScene.ts`
- `docs/porting/terrain.md`
- `docs/porting/player.md`
