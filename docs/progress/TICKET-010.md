# TICKET-010 Progress

Generated: 2026-02-04T06:54:29.265Z

## What was generated

### Tool script
- `src/tools/extract_ref_map.ts` — Extracts function metadata from ref/*.c files

### Reference docs (auto-generated)
- `docs/ref/ref-symbols.json` — Machine-readable symbol list
- `docs/ref/ref-summary.md` — Human-readable summary

### Porting workbook (auto-generated skeleton)
- `docs/porting/index.md` — Overview with subsystem links
- `docs/porting/misc.md` — misc subsystem checklist
- `docs/porting/audio.md` — audio subsystem checklist
- `docs/porting/bonus.md` — bonus subsystem checklist
- `docs/porting/camera.md` — camera subsystem checklist
- `docs/porting/config.md` — config subsystem checklist
- `docs/porting/console.md` — console subsystem checklist
- `docs/porting/creature.md` — creature subsystem checklist
- `docs/porting/creatures.md` — creatures subsystem checklist
- `docs/porting/game.md` — game subsystem checklist
- `docs/porting/gameplay.md` — gameplay subsystem checklist
- `docs/porting/highscore.md` — highscore subsystem checklist
- `docs/porting/input.md` — input subsystem checklist
- `docs/porting/load.md` — load subsystem checklist
- `docs/porting/math.md` — math subsystem checklist
- `docs/porting/mod.md` — mod subsystem checklist
- `docs/porting/music.md` — music subsystem checklist
- `docs/porting/perk.md` — perk subsystem checklist
- `docs/porting/perks.md` — perks subsystem checklist
- `docs/porting/player.md` — player subsystem checklist
- `docs/porting/projectile.md` — projectile subsystem checklist
- `docs/porting/quest.md` — quest subsystem checklist
- `docs/porting/sfx.md` — sfx subsystem checklist
- `docs/porting/terrain.md` — terrain subsystem checklist
- `docs/porting/texture.md` — texture subsystem checklist
- `docs/porting/ui.md` — ui subsystem checklist
- `docs/porting/weapon.md` — weapon subsystem checklist

## How to use this workbook

### Automatic updates
Run `npm run tools:extract-ref` to regenerate all files from ref/*.c.
**Warning:** This overwrites manual edits in docs/porting/*.md.

### Manual workflow (recommended)
1. The `docs/porting/*.md` files are generated initially as a checklist template.
2. After porting a function, update its entry to mark complete and add notes:
   ```
   - [x] player_update — ported to src/sim/player.ts (notes: simplified physics)
   ```
3. If you need to regenerate (e.g., new ref files), preserve your manual edits or merge them.

## Subsystem breakdown

| Subsystem | Count |
|-----------|-------|
| misc | 467 |
| audio | 8 |
| bonus | 12 |
| camera | 1 |
| config | 5 |
| console | 43 |
| creature | 16 |
| creatures | 2 |
| game | 14 |
| gameplay | 3 |
| highscore | 16 |
| input | 5 |
| load | 1 |
| math | 4 |
| mod | 37 |
| music | 7 |
| perk | 6 |
| perks | 4 |
| player | 8 |
| projectile | 4 |
| quest | 61 |
| sfx | 20 |
| terrain | 3 |
| texture | 2 |
| ui | 37 |
| weapon | 5 |

**Total tracked functions:** 1731
