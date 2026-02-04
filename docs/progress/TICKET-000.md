# TICKET-000 Progress

## Summary
- Bootstrapped Vite + TypeScript + Phaser app.
- Added Boot/Title/Game scenes with keyboard movement.
- Added CI and Pages workflows.

## How to run locally
- `npm ci`
- `npm run dev`
- `npm run build`

## Notes
- Pages build sets `BASE_PATH` to `/<repo-name>/` in the workflow.
- Reference C files are present in `ref/`.
- `npm run build` passes locally (2026-02-04); Vite reports a large bundle warning (~1.2 MB) which can be addressed later if needed. Re-ran successfully again on 2026-02-04.
- Downgraded Vite to the 5.x line to avoid `crypto.hash is not a function` on older Node runtimes; this restores `npm run dev` compatibility and keeps builds reproducible (2026-02-04).
- Added Husky `pre-commit` hook to require `npm run build` before commits; `prepare` now installs hooks (2026-02-04).
