# Bonus Subsystem

Functions: 12

## Function Checklist

- [x] `bonus_alloc_slot` — Implemented as part of state.bonuses array management (ref: crimsonland:0041f580)
- [x] `bonus_apply` — Implemented in `applyBonus()` in `src/sim/systems/bonuses.ts` (ref: crimsonland:00409890)
- [x] `bonus_hud_slot_update_and_render` — Simplified in `src/ui/Hud.ts` activeBonusesText (ref: crimsonland:0041a8b0)
- [x] `bonus_label_for_entry` — Simplified through BonusDef.name (ref: crimsonland:00429580)
- [x] `bonus_metadata_init` — Implemented in `src/content/bonuses.ts` (ref: crimsonland:00412660)
- [x] `bonus_pick_random_type` — Implemented in `pickRandomBonusType()` in `src/content/bonuses.ts` (ref: crimsonland:00412470)
- [x] `bonus_render` — Implemented in `src/adapters/phaser/render.ts` syncBonuses() (ref: crimsonland:004295f0)
- [x] `bonus_reset_availability` — Weighted random selection handles availability (ref: crimsonland:00412940)
- [x] `bonus_spawn_at` — Implemented as `spawnBonus()` in `src/sim/systems/bonuses.ts` (ref: crimsonland:0041f5b0)
- [x] `bonus_spawn_at_pos` — Same as spawn_bonus_at (ref: crimsonland:0041f790)
- [x] `bonus_try_spawn_on_kill` — Implemented in `src/sim/systems/collision.ts` calling trySpawnBonusOnKill() (ref: crimsonland:0041f8d0)
- [x] `bonus_update` — Implemented in `updateBonuses()` in `src/sim/systems/bonuses.ts` (ref: crimsonland:0040a320)

## Implementation Notes

### Bonus Types Implemented
1. **Medkit** (instant) - Heals 30 HP
2. **Ammo** (instant) - Refills current weapon ammo
3. **Score Bonus** (instant) - Adds 50 points
4. **Damage Boost** (timed, 10s) - 1.5x damage multiplier
5. **Fire Rate Boost** (timed, 10s) - 1.5x fire rate multiplier
6. **Speed Boost** (timed, 10s) - 1.5x speed multiplier

### Key Implementation Details

- **Drop chance**: 25% chance on creature death (configurable via `BONUS_DROP_CHANCE`)
- **Despawn time**: 15 seconds (900 ticks at 60Hz)
- **Effect tracking**: PlayerState.activeEffects tracks timed bonus effects
- **Multipliers**: Applied in weapons.ts for damage/fire rate, player.ts for speed
- **Collision detection**: Handled in bonuses.ts checkBonusPickup()

### Integration Points

- **Creature death**: collision.ts calls trySpawnBonusOnKill()
- **Weapon system**: weapons.ts uses getDamageMultiplier() and getFireRateMultiplier()
- **Player movement**: player.ts uses getPlayerMaxSpeed() which respects speed boost
- **UI**: Hud.ts displays active timed bonuses with remaining time
- **Rendering**: render.ts syncBonuses() shows colored circles per bonus type

### State Management

- BonusState includes: id, pos, active, kind (BonusId), radius, lifeTicksRemaining
- PlayerState includes: baseSpeed, activeEffects (Partial<Record<BonusId, number>>)
- Timed effects tick down each sim step in updateBonusEffects()
