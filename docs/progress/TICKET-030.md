# TICKET-030 Progress

Generated: 2026-02-04T06:53:00Z

## Summary
- Wired `GameScene` to drive the deterministic sim on a fixed 60Hz step and render from sim state.
- Added Phaser input adapter, render adapter, and debug overlay (toggle with F1).
- Added seed query param support for deterministic reloads.

## How To Run
- `npm run dev`
- Open `http://localhost:5173` (or Vite's printed URL).

## Debug Overlay
- Toggle: `F1`
- Shows FPS, tick, player position, entity counts, and seed.

## Seed Control
- Append `?seed=123` to the URL to re-seed the sim.

## Files Added
- `src/adapters/phaser/input.ts`
- `src/adapters/phaser/render.ts`
- `src/adapters/phaser/debugOverlay.ts`
- `docs/progress/TICKET-030.md`

## Files Updated
- `src/scenes/GameScene.ts`
