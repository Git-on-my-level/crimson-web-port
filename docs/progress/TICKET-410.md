# TICKET-410 — Performance + stability pass

## Summary
- Added debug stress toggles (`F2`, `F3`, `F4`) and shutdown cleanup in `GameScene`.
- Added per-system profiling timings surfaced in the debug overlay.
- Added collision spatial hash grid to reduce projectile-vs-creature checks.
- Added dev-only sim invariants (finite values, HP range, unique IDs).
- Documented stress workflow in `docs/performance.md`.

## Manual verification notes
- Run with `?debug=1` to enable toggles.
- Exercise `F2` + `F3` and confirm no NaNs in the overlay.
- Restart scene multiple times and confirm no duplicate debug keys.
