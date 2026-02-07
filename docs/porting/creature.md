# Creature Subsystem

Functions: 16

## Function Checklist

- [ ] `creature_alloc_slot` — TODO (ref: crimsonland:00428140)
- [x] `creature_apply_damage` — Implemented (basic HP + score in `src/sim/systems/collision.ts`).
- [ ] `creature_find_by_name` — TODO (ref: crimsonland:00445590)
- [ ] `creature_find_in_radius` — TODO (ref: crimsonland:004206a0)
- [ ] `creature_find_nearest` — TODO (ref: crimsonland:00420040)
- [x] `creature_handle_death` — Implemented (marks dead + score in `src/sim/systems/collision.ts`).
- [ ] `creature_is_name_unique` — TODO (ref: crimsonland:00445310)
- [ ] `creature_name_assign_random` — TODO (ref: crimsonland:00445380)
- [x] `creature_name_draw_labels` — Implemented (high-signal enemy labels via `assignCreatureLabel` in `src/sim/systems/creatures.ts` and render adapter sync in `src/adapters/phaser/render.ts`).
- [ ] `creature_render_all` — TODO (ref: crimsonland:00419680)
- [ ] `creature_render_type` — TODO (ref: crimsonland:00418b60)
- [x] `creature_spawn` — Implemented (basic edge spawn in `src/sim/systems/creatures.ts`).
- [ ] `creature_spawn_slot_alloc` — TODO (ref: crimsonland:00430ad0)
- [x] `creature_spawn_template` — Implemented (data-driven template list in `src/content/creatures.ts` used by survival director).
- [ ] `creature_spawn_tinted` — TODO (ref: crimsonland:00444810)
- [x] `creature_update_all` — Implemented (basic seek AI in `src/sim/systems/creatures.ts`).

## Notes
- Added template metadata (`CREATURE_TEMPLATES`) to drive survival spawn selection.
- Added behavior variants (strafe/burst) for select creature kinds to reduce "seek-only" feel.
- Added high-signal enemy labels (ELITE/BOSS) displayed above creature sprites with deterministic assignment and lifecycle management.
