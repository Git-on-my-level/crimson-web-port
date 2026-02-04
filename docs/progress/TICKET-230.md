# TICKET-230 — XP/level + perks database + perk selection UI (deterministic)

## Summary

Implemented deterministic XP progression with level-ups, a data-driven perk database, perk availability rules, and a Phaser overlay that pauses gameplay and lets the player pick from three perks. Perk effects are recomputed into derived stats and applied consistently across weapons, movement, damage, and bonus handling.

## Step 1 — Progression Model in Sim

### Updates to `src/sim/state.ts`

Extended `PlayerState` with:
- `level`, `xp`, `xpToNext`
- `perks: Record<PerkId, number>`
- `perkStats` (derived modifiers)
- `baseHpMax` for deterministic max-HP recomputation

Extended `SimState` with:
- `perkChoices: PerkId[] | null`

### Progression System (`src/sim/systems/progression.ts`)

- `grantXp()` adds XP and triggers a level-up when thresholds are met.
- `updateProgression()` handles time-based XP gain and perk-based regeneration.
- `updatePerkSelection()` reads input and applies selected perks.
- `choosePerk()` updates stacks and recomputes derived stats.

## Step 2 — Perk Database

Created `src/content/perks.ts`:
- 12 perks across offense/defense/mobility/utility
- `PerkDef` includes `maxStacks`, `exclusiveTag`, and stat modifiers
- `getPerkDef()` helper for UI and HUD display

## Step 3 — Offer Rules

Created `src/sim/perks.ts`:
- `perkCanOffer()` enforces max stacks and exclusivity
- `generatePerkChoices()` uses sim RNG for deterministic 3-perk draws
- `perkCountGet()` helper for stack checks
- `recomputePerkStats()` aggregates all perk modifiers

## Step 4 — Level Up Trigger

`grantXp()` sets `phase = 'PerkSelect'` and stores `perkChoices` when XP crosses the threshold. Level-ups emit `perkOffered` and `levelUp` events for UI/telemetry use.

## Step 5 — Perk Effects

Derived stats affect gameplay immediately:
- Damage, fire rate, and projectile speed multipliers
- Movement speed multiplier
- Max HP bonus
- Damage reduction
- Health regen
- Bonus drop rate and pickup range

## Step 6 — UI Overlay

Created `src/ui/PerkPickerOverlay.ts`:
- Modal overlay with three cards
- Click or press 1/2/3 to select
- Uses `PerkSelect` phase to show/hide

Wired in `src/scenes/GameScene.ts` with a queued perk choice, fed into sim input for deterministic selection.

## Step 7 — HUD Updates

Updated `src/ui/Hud.ts` to display:
- Level
- XP progress
- Current perks and stacks

## Step 8 — Workbook + Docs

Updated:
- `docs/porting/perk.md`
- `docs/porting/perks.md`
- `docs/porting/ui.md`

## Testing

Added `tests/sim_perks.test.ts`:
- Deterministic perk choices for a fixed seed
- Selection resumes gameplay and applies stacks

## Files Modified/Created

### Created
- `src/content/perks.ts`
- `src/sim/perks.ts`
- `src/sim/systems/progression.ts`
- `src/ui/PerkPickerOverlay.ts`
- `tests/sim_perks.test.ts`
- `docs/progress/TICKET-230.md`

### Modified
- `src/sim/state.ts`
- `src/sim/sim.ts`
- `src/sim/types.ts`
- `src/sim/systems/input.ts`
- `src/sim/systems/bonuses.ts`
- `src/sim/systems/player.ts`
- `src/sim/systems/weapons.ts`
- `src/sim/systems/collision.ts`
- `src/content/creatures.ts`
- `src/adapters/phaser/input.ts`
- `src/scenes/GameScene.ts`
- `src/ui/Hud.ts`
- `docs/porting/perk.md`
- `docs/porting/perks.md`
- `docs/porting/ui.md`

## Notes

- Perk choices are deterministic based on seed and action sequence.
- Perk selection pauses sim updates until a choice is made.
