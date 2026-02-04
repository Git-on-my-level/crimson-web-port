# Performance + Stability Notes

## Stress toggles (dev / debug)
Enable debug controls with `?debug=1` in the URL (or automatically in dev builds).

- `F2`: spawn 20 enemies instantly (random mix of grunts/runners/tanks)
- `F3`: high rate-of-fire stress mode (sets SMG + high fire rate multiplier)
- `F4`: toggle collision hit-circle rendering
- `F1`: toggle debug overlay

## Profiling overlay
The debug overlay includes averaged timing (ms) for each sim phase:
- input
- player
- weapons
- projectiles
- mode
- creatures
- collision
- bonuses
- progression
- total

Use these to spot the worst offender before optimizing.

## Known limits / notes
- Collision uses a spatial hash grid (cell size 6) to reduce projectile-vs-creature checks.
- Entity invariants (finite positions, HP range, unique IDs) are asserted in debug mode.
- Rendering debug circles can impact FPS; disable `F4` when not needed.

## Manual checks
1. Run `F2` repeatedly + `F3` and confirm input remains responsive.
2. Restart the game scene multiple times and confirm no duplicate input handlers.
3. Watch the debug overlay for `NaN` values or exploding step times.
