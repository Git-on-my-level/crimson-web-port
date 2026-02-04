# TICKET-200 — Weapon table (data-driven) + weapon switching + random weapon pick

## Summary

Expanded the weapon system to a data-driven table with five distinct weapons, added player weapon state (ammo/reload), implemented deterministic random weapon selection, and wired hotkey switching (1-5). HUD now reflects weapon name and ammo.

## Implementation Details

### 1. Weapon Table (`src/content/weapons.ts`)
- Added `WeaponId` + `WeaponDef` schema with fire modes, pellets, spread, and reload data.
- Seeded five distinct weapons (pistol, shotgun, smg, rifle, plasma).
- Added `WEAPON_ORDER` and `WEAPON_BY_ID` for fast lookup and slot ordering.

### 2. Weapon Table Helpers (`src/sim/weapons/weaponTable.ts`)
- `weaponTableInit()` returns the full table.
- `getWeaponById()` for fast lookup.
- `getWeaponOrder()` for slot ordering.
- `pickRandomWeapon()` uses sim RNG with optional allowed set.

### 3. Weapon System (`src/sim/systems/weapons.ts`)
- Player state now includes `weaponId`, `ammo`, `reloadTicksRemaining`, and `fireCooldownTicks`.
- Firing logic supports pellet spreads and data-driven projectile stats.
- Reloading blocks firing and refills ammo when complete.
- Weapon switching via hotkeys updates weapon state and ammo.

### 4. Input + HUD (`src/adapters/phaser/input.ts`, `src/ui/Hud.ts`)
- Added hotkeys 1-5 for weapon switching.
- HUD displays weapon name and ammo/reload state.

### 5. Workbook Update (`docs/porting/weapon.md`)
- Marked weapon table and random pick helpers implemented.
- Documented remaining availability logic gap.

## Testing Results

- `npm test`

## Files Changed

### New Files
- `src/sim/weapons/weaponTable.ts` — Weapon table helpers
- `docs/progress/TICKET-200.md` — This document

### Modified Files
- `src/content/weapons.ts` — Expanded weapon definitions
- `src/sim/state.ts` — Player weapon/ammo state
- `src/sim/systems/weapons.ts` — Data-driven firing + reload + switching
- `src/sim/types.ts` — Added weapon switch input
- `src/adapters/phaser/input.ts` — Weapon hotkeys
- `src/ui/Hud.ts` — Weapon display
- `tests/sim_determinism.test.ts` — Updated input shape
- `tests/sim_smoke.test.ts` — Updated input shape
- `docs/porting/weapon.md` — Workbook updates

## Acceptance Criteria

- [x] 5 weapons exist and feel distinct
- [x] Switching works (hotkeys)
- [x] Shotgun spreads; SMG has higher ROF; etc.
- [x] No firing during reload
- [x] Determinism remains intact

## Future Work

- Persist per-weapon ammo when switching
- Add availability rules (perks/unlocks)
