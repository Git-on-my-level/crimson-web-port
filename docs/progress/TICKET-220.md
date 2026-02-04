# TICKET-220 — Bonuses (pickups): spawn on kill + apply effects + basic UI

## Summary

Implemented the complete bonus/pickup system including content definitions, spawning logic, collision detection, effect application, and UI feedback.

## Step 1 — Bonus Content Table

### Implementation

Created `src/content/bonuses.ts` with:

- `BonusId` type: 'medkit', 'ammo', 'score', 'damage_boost', 'fire_rate_boost', 'speed_boost'
- `BonusDef` interface: id, name, kind ('instant' | 'timed'), durationTicks, rarityWeight, color
- `BONUSES` array: 6 bonus definitions with balanced weights
- `pickRandomBonusType()`: Weighted random selection using rarityWeight
- `getBonusDef()`: Lookup helper

### Bonus Definitions

1. **Medkit** - Instant heal 30 HP, green, weight 100
2. **Ammo** - Instant refill ammo, blue, weight 80
3. **Score Bonus** - Instant +50 points, yellow, weight 60
4. **Damage Boost** - 10s 1.5x damage, red, weight 40
5. **Fire Rate Boost** - 10s 1.5x fire rate, orange, weight 40
6. **Speed Boost** - 10s 1.5x speed, light blue, weight 40

## Step 2 — Bonus Entity State

### Updates to `src/sim/state.ts`

Extended `BonusState`:
- Added `radius: number` (collision/render radius)
- Added `lifeTicksRemaining: number` (despawn countdown)
- Changed `kind` type from `string` to `BonusId`

Extended `PlayerState`:
- Added `baseSpeed: number` (base speed before bonuses)
- Added `activeEffects: Partial<Record<BonusId, number>>` (timed effect tracking)

## Step 3 — Drop Logic

### Implementation in `src/sim/systems/bonuses.ts`

Created `trySpawnBonusOnKill()`:
- 25% drop chance (BONUS_DROP_CHANCE)
- If spawn succeeds, calls `pickRandomBonusType()` for weighted random selection
- Creates bonus entity at creature position
- Emits `spawnBonus` event

### Integration

Modified `src/sim/systems/collision.ts`:
- Calls `trySpawnBonusOnKill()` when creature dies
- Passes creature position for spawn location

## Step 4 — Pickup Logic

### Collision Detection

Created `checkBonusPickup()` in `src/sim/systems/bonuses.ts`:
- Checks player vs bonus circle collision
- Pickup radius larger than visual radius (1.5 vs 0.8)
- Calls `applyBonus()` on pickup
- Deactivates bonus entity

### Effect Application

Created `applyBonus()` handling:
- **Medkit**: Heals up to 30 HP (capped at hpMax)
- **Ammo**: Refills current weapon ammo to max
- **Score**: Adds 50 points, emits score event
- **Damage Boost**: Adds 600 ticks (10s) to activeEffects
- **Fire Rate Boost**: Adds 600 ticks to activeEffects
- **Speed Boost**: Adds 600 ticks to activeEffects

### Effect Tracking

Created `updateBonusEffects()`:
- Ticks down all active effects each sim step
- Removes expired effects from player.activeEffects
- Multipliers computed in respective systems:
  - `getDamageMultiplier()` called in weapons.ts
  - `getFireRateMultiplier()` called in weapons.ts
  - `getPlayerMaxSpeed()` called in player.ts

## Step 5 — Render + UI

### Rendering Updates

Modified `src/adapters/phaser/render.ts`:
- Added `syncBonuses()` method
- Each bonus type renders with its own color (from BonusDef)
- Uses existing sprite pool system
- 6px radius circles on screen

### HUD Updates

Modified `src/ui/Hud.ts`:
- Added `activeBonusesText` display
- Shows active timed bonuses with remaining time (e.g., "Damage Boost (8s) | Speed Boost (5s)")
- Empty string when no active bonuses
- Positioned below HP text

## Step 6 — Workbook Updates

Updated `docs/porting/bonuses.md`:
- Marked all 12 bonus functions as implemented
- Added implementation notes for each function
- Documented integration points
- Added state management details

## Key Design Decisions

### 25% Drop Chance
Balances reward frequency with gameplay pacing. Enough bonuses to feel rewarding, not so many they become trivial.

### 10-Second Duration
Long enough to feel impactful, short enough to require strategic timing. 600 ticks at 60Hz.

### 1.5x Multipliers
Noticeable but not game-breaking. Combining all three bonuses is powerful but fair.

### Visual Distinction
Each bonus type has unique color:
- Green: Healing (medkit)
- Blue: Utility (ammo, speed)
- Yellow: Scoring
- Red/Orange: Combat boosts (damage, fire rate)

### Weighted Randomization
Common bonuses (medkit, ammo, score) have higher weights. Rarer combat boosts are more valuable.

## Testing

### Manual Testing
- Kill 30+ enemies and observe:
  - Various bonus types spawning
  - Different colored circles on ground
  - Pickup working on collision
  - Instant effects triggering (heal, ammo refill, score)
  - Timed effects showing in HUD
  - Multipliers applying visibly (faster fire, more damage, faster movement)
  - Timed effects expiring and disappearing from HUD

### Verification Criteria Met
- ✅ Bonuses drop sometimes from kills
- ✅ Picking up a bonus changes gameplay (heal, faster fire, etc.)
- ✅ Timed bonuses expire correctly
- ✅ UI shows active timed bonuses

## Integration Points

### Collision System
- Creature death → trySpawnBonusOnKill()
- Player-bonus collision → checkBonusPickup() → applyBonus()

### Weapon System
- Applies damage multiplier from activeEffects['damage_boost']
- Applies fire rate multiplier from activeEffects['fire_rate_boost']

### Player System
- Applies speed multiplier from activeEffects['speed_boost']
- baseSpeed added to PlayerState for clean multiplier computation

### Sim Loop
- updateBonuses() called each step
- Handles effect countdown and bonus lifetime

### Rendering
- Colored circles per bonus type
- Pooled sprites for performance

### UI
- Active bonuses displayed with countdown
- Clean formatting: "Name (seconds)"

## Files Modified/Created

### Created
- `src/content/bonuses.ts` - Bonus definitions and helpers
- `docs/progress/TICKET-220.md` - This file

### Modified
- `src/sim/state.ts` - Extended BonusState and PlayerState
- `src/sim/types.ts` - Added spawnBonus event type
- `src/sim/systems/bonuses.ts` - Complete bonus system implementation
- `src/sim/systems/collision.ts` - Added bonus spawn on kill
- `src/sim/systems/player.ts` - Added baseSpeed and speed boost support
- `src/sim/systems/weapons.ts` - Added damage and fire rate multipliers
- `src/adapters/phaser/render.ts` - Added bonus rendering with colors
- `src/ui/Hud.ts` - Added active bonuses display
- `docs/porting/bonuses.md` - Updated with implementation status

## Observations

- Bonus spawning adds positive reinforcement loop to kill rewards
- Timed effects create tactical depth (use boosts when swarmed)
- Visual color coding helps players quickly identify bonus types
- HUD display helps players time their engagements around active boosts
- Multipliers stack for powerful but brief moments

## Future Enhancements

- Add visual particles when bonus spawns/is picked up
- Add sound effects for spawn and pickup
- Consider bonus rarity tiers with stronger effects
- Add "bonus magnet" effect at higher score tiers
- Consider combo bonuses (e.g., damage + fire rate together)
- Add perk synergy (future perks could boost bonus effects)
