# Decisions

## Stack
- TypeScript + Vite for build tooling
- Phaser 3 for rendering/runtime

## Deployment
- GitHub Pages via `.github/workflows/pages.yml`
- Vite `base` configured by `BASE_PATH` env var during CI build
