# Player Subsystem

Functions: 8

## Function Checklist

- [x] `player_apply_move_with_spawn_avoidance` — Implemented analog via spawn-avoidance helper in `src/sim/world.ts` used by creature/bonus spawns. (ref: crimsonland:0041e290)
- [ ] `player_find_in_radius` — TODO (ref: crimsonland:00420730)
- [x] `player_fire_weapon` — Implemented (basic fire flow in `src/sim/systems/weapons.ts`) (ref: crimsonland:00444980)
- [ ] `player_render_overlays` — TODO (ref: crimsonland:00428390)
- [ ] `player_reset_all` — TODO (ref: crimsonland:0041fc80)
- [ ] `player_start_reload` — TODO (ref: crimsonland:00413430)
- [x] `player_take_damage` — Implemented (basic HP + game over in `src/sim/systems/collision.ts`).
- [x] `player_update` — Implemented (ref: crimsonland:004136b0)

## Notes
- Current `player_update` handles movement acceleration, damping, aim direction/angle, and world bounds.
- Spawn avoidance exists as a world helper for spawns, not as a player movement routine.
- Missing from reference parity: reload flow, overlay rendering, and any remaining weapon/fire behavior.
