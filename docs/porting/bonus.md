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
1. **Points** (instant) - Adds 500 or 1000 score (8% chance for 1000), and grants the same amount of XP
2. **Energizer** (timed, 8s) - Timed effect placeholder (no behavior yet)
3. **Weapon** (instant) - Grants a random available weapon
4. **Weapon Power Up** (timed, 10s) - 1.5x fire rate multiplier
5. **Nuke** (instant) - Large AoE damage pulse
6. **Double XP** (timed, 10s) - Doubles XP gain
7. **Shock Chain** (instant) - Damages nearby creatures
8. **Fireblast** (instant) - Radial AoE damage
9. **Reflex Boost** (timed, 3s) - Timed effect placeholder (no behavior yet)
10. **Shield** (timed, 7s) - Timed effect placeholder (no behavior yet)
11. **Freeze** (timed, 5s) - Timed effect placeholder (no behavior yet)
12. **MediKit** (instant) - Heals 10 HP
13. **Speed** (timed, 8s) - 1.5x speed multiplier
14. **Fire Bullets** (timed, 4s) - 1.25x damage multiplier

### Key Implementation Details

- **Drop chance**: 1/9 base chance on creature death, with perk multiplier overage adding an extra roll
- **Despawn time**: 15 seconds (900 ticks at 60Hz)
- **Effect tracking**: PlayerState.activeEffects tracks timed bonus effects
- **Multipliers**: Fire rate via `weapon_power_up`, damage via `fire_bullets`, speed via `speed`
- **Stacking**: `double_xp` stacks duration; others refresh to max duration
- **Collision detection**: Handled in bonuses.ts checkBonusPickup()

### Integration Points

- **Creature death**: collision.ts calls trySpawnBonusOnKill()
- **Weapon system**: weapons.ts uses getDamageMultiplier() and getFireRateMultiplier()
- **Player movement**: player.ts uses getPlayerMaxSpeed() which respects speed boost
- **UI**: Hud.ts displays active timed bonuses with remaining time
- **Rendering**: render.ts syncBonuses() shows bonus sprites by atlas frame

### State Management

- BonusState includes: id, pos, active, kind (BonusId), radius, lifeTicksRemaining
- PlayerState includes: baseSpeed, activeEffects (Partial<Record<BonusId, number>>)
- Timed effects tick down each sim step in updateBonusEffects()

### Parity Notes

- Reroll gates exist for Freeze/Shield/Shock Chain while active; quest-mode gates not yet implemented.
- Several timed bonuses are tracked but do not yet implement their full original behavior (Energizer/Reflex/Shield/Freeze/Fire Bullets projectile override).
- Ref-test ports for `test_nuke_bonus.py` and `test_bonus_pistol_rules.py` are marked skipped pending full bonus spawn rules + nuke projectile parity (TICKET-470).
