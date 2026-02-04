# TICKET-290 — M2 review gate (“Ship Survival”)

## Summary

Added a deterministic Survival smoke test, invariant checks for finite positions/HP clamps, and documented M2 playtest steps + survival parity notes. Survival tuning constants were verified and captured here for quick reference.

## Survival Smoke Test Notes

- Seeded survival run with scripted inputs, auto-selecting perks, and early close-range spawns to validate scoring/leveling deterministically.
- Expected snapshot after 1800 ticks:
  - Score: 30
  - Level: 2
  - Creatures array length: 8
  - Projectiles array length: 4

## Invariant Coverage

- Player/creature/projectile/bonus positions stay finite (no NaN/Infinity).
- HP is clamped at or below HPMax for player and creatures.

## Tuning Constants (current)

- Survival tiers: 0s/30s/60s/90s/120s/180s with spawn rates 0.5 → 2.3 per second and soft caps 6 → 16.
- Spawn budget uses creature costs: grunt 1, runner 1.4, tank 3.0; up to 4 spawns per tick.
- Bonus drops: 25% base chance, 15s despawn, pickup radius 1.5, medkit heal 30, score bonus 50.
- Progression: 1.5 XP/sec passive, XP-to-next grows by 1.25 per level, base XP-to-next 75.

## Files Touched

- `docs/playtest-checklist.md`
- `docs/porting/index.md`
- `tests/sim_survival_smoke.test.ts`
- `docs/progress/TICKET-290.md`
