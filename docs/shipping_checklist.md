# Shipping Checklist (M5.5)

## Required Automated Checks
1. `npm run test`
2. `npm run check:types`
3. `npm run check:build`
4. `npm run build`

## Manual Playtest Matrix

### Survival
1. From title, start Survival.
2. Confirm HUD updates (HP, score, weapon, XP).
3. Pause with `Esc` or `P` and verify pause menu options work.
4. Verify Resume returns to play.
5. Verify Controls overlay opens and closes with `Esc`/`H`.
6. Verify Options opens and back returns to the paused game.
7. Verify Restart restarts the run.
8. Verify Quit to Title returns to title.
9. Collect a bonus and confirm pickup SFX and big-pickup flash for rare bonuses.
10. Take damage and confirm screen shake/flash.
11. Play until Game Over and verify results screen + restart/title shortcuts.

### Quest
1. From title, start Quest and select a quest.
2. Verify quest objectives display and progress.
3. Complete a quest and confirm Quest Results screen.
4. Fail a quest and confirm Quest Failed screen.
5. Ensure `Esc` returns to title from both results screens.

### Options
1. From title, open Options.
2. Remap a keybind and confirm it applies in-game after returning.
3. Reset keybinds to defaults.
4. Adjust master/sfx/music volumes and confirm immediate changes.
5. Reload the page and confirm settings persist.

### Highscores
1. Complete a Survival run and confirm it appears in Highscores.
2. Complete a Quest run and confirm quest highscores update.
3. Switch between Survival and Quest tabs.

## Performance Sanity Steps
1. Launch with `?debug=1` in the URL.
2. Press `F2` to spawn a burst; confirm no frame collapse.
3. Press `F3` to boost fire rate; confirm projectiles render correctly.
4. Press `F4` to toggle collision debug; ensure no visual corruption.
5. Leave a Survival run running for 3+ minutes; verify stable FPS.
