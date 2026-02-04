# Projectile Subsystem

Functions: 4

## Function Checklist

- [x] `projectile_render` — Implemented (adapter circle render with sprite pooling) (ref: crimsonland:00422c70)
- [x] `projectile_reset_pools` — Implemented (ObjectPool with free list, capacity 1000) (ref: crimsonland:004205d0)
- [x] `projectile_spawn` — Implemented (sim spawn on fire using pool.alloc) (ref: crimsonland:00420440)
- [x] `projectile_update` — Implemented (sim move + lifetime + bounds using forEachActive) (ref: crimsonland:00420b90)

## Implementation Notes

### Pooling (TICKET-210)

- Sim layer: `ObjectPool<ProjectileState>` in `state.projectilePool`
  - Slot array with free list for O(1) alloc/release
  - Pre-allocated 50 slots, max 1000
  - `spawnProjectile()` allocates from pool
  - `despawnProjectile()` returns to pool
  - `syncProjectilesArray()` rebuilds projectiles array for compatibility

- Render layer: Sprite pools in `PhaserRenderAdapter`
  - `projectileSpritePool`, `creatureSpritePool`, `bonusSpritePool`
  - Reuse hidden sprites instead of destroy/create
  - `syncEntities()` manages pool lifecycle

### Performance

- Hot loop optimization in weapons.ts: no temporary `{x,y}` allocations
- Debug overlay shows pool utilization and step time
- See `docs/progress/TICKET-210.md` for details

### Firing Patterns

- Standard: single pellets with optional spread (shotgun)
- Spiral: `fireSpiralPattern()` in weapons.ts for rotating patterns

### Projectile Archetypes (TICKET-460)

- Data-driven profiles in `src/content/projectiles.ts` (default, piercing, explosive)
- Weapon defs reference `projectileProfileId` for per-weapon behavior
- Projectile state tracks `pierceRemaining`, `explosionRadius`, `explosionDamage`

### Collision Nuance (TICKET-460)

- Piercing projectiles can hit multiple creatures before despawning
- Explosive projectiles apply AoE damage on impact
- Impact events emitted for VFX hooks (`projectileImpact`)
