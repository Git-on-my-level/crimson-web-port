# Porting Workbook

This workbook tracks progress porting functions from the Crimsonland decompiled C reference to TypeScript.

## Subsystem Status

| Subsystem | Functions |
|-----------|-----------|
| [misc](./misc.md) | 467 |
| [audio](./audio.md) | 8 |
| [bonus](./bonus.md) | 12 |
| [camera](./camera.md) | 1 |
| [config](./config.md) | 5 |
| [console](./console.md) | 43 |
| [creature](./creature.md) | 16 |
| [creatures](./creatures.md) | 2 |
| [game](./game.md) | 14 |
| [gameplay](./gameplay.md) | 3 |
| [highscore](./highscore.md) | 16 |
| [input](./input.md) | 5 |
| [load](./load.md) | 1 |
| [math](./math.md) | 4 |
| [mod](./mod.md) | 37 |
| [music](./music.md) | 7 |
| [perk](./perk.md) | 6 |
| [perks](./perks.md) | 4 |
| [player](./player.md) | 8 |
| [projectile](./projectile.md) | 4 |
| [quest](./quest.md) | 61 |
| [sfx](./sfx.md) | 20 |
| [survival](./survival.md) | 3 |
| [terrain](./terrain.md) | 3 |
| [texture](./texture.md) | 2 |
| [ui](./ui.md) | 37 |
| [weapon](./weapon.md) | 5 |

## Survival Parity (M2)

Implemented reference functions (name parity):
- `survival_update`
- `survival_spawn_creature`
- `survival_gameplay_update_and_render`
- `creature_spawn`
- `creature_update_all`
- `creature_apply_damage`
- `creature_handle_death`
- `player_update`
- `player_fire_weapon`
- `player_start_reload`
- `player_take_damage`
- `weapon_table_init`
- `weapon_assign_player`
- `weapon_pick_random_available`
- `projectile_spawn`
- `projectile_update`
- `bonus_update`
- `bonus_apply`
- `bonus_try_spawn_on_kill`
- `perks_generate_choices`
- `perk_apply`
- `perks_update_effects`

Intentionally skipped for now:
- Survival boss/elite wave logic and scripted wave banners.
- Arena hazards, map modifiers, and timed events beyond the spawn-budget ramp.
- Meta-progression, unlock tables, and leaderboard persistence.
- Full Crimsonland UI chrome (wave cards, streak trackers, announcers).

## Quest Parity (M3)

Framework implemented:
- Quest mode state machine (`Playing` → `Success`/`Failed`) with phase transitions.
- Timeline events: spawn (`edge`, `ring`, `random`), message, grant bonus.
- Objective evaluators: survive (duration), kill count (total or per creature), score.
- Quest kill tracking and success/fail status events.

Quest count implemented:
- 2 quests in `src/content/quests/index.ts` (`quest_training_grounds`, `quest_test_short`).

Missing objectives/quests:
- All remaining original quest definitions beyond the two placeholders.
- Any objective types not covered by `survive`, `killCount`, or `score`.

## Options/Settings Parity (M4)

Implemented features:
- Settings persistence via localStorage (keybinds + volume)
- Keybind remapping for all game actions (movement, fire, reload, weapon switch, pause)
- Volume controls for master, SFX, and music
- Options scene with tabbed UI (controls, volume)
- Settings reload without game restart

Files implemented:
- `src/persistence/settings.ts` - Settings model and persistence
- `src/scenes/OptionsScene.ts` - Options UI implementation
- `src/adapters/phaser/input.ts` - Configurable keybind support
- `src/adapters/phaser/audio.ts` - Audio adapter with volume (stub)

See TICKET-400 documentation for details: `docs/progress/TICKET-400.md`

## High-Signal Prefixes

| Prefix | Count |
|--------|-------|
| crt_ | 65 |
| grim_pixel_format_ctor_ | 36 |
| __ | 14 |
| quest_build_the_ | 10 |
| console_ | 8 |
| console_cmd_ | 5 |
| grim_load_image_ | 5 |
| mod_api_gfx_ | 5 |
| demo_setup_variant_ | 4 |
| grim_get_joystick_ | 4 |
| grim_get_mouse_ | 4 |
| grim_set_ | 4 |
| png_ | 4 |
| quest_build_ | 4 |
| vorbis_mem_ | 4 |
| bonus_ | 3 |
| buffer_reader_ | 3 |
| console_command_ | 3 |
| console_cvar_ | 3 |
| console_input_ | 3 |

*Total high-signal functions: 791*

> Note: High-signal excludes FUN_*, CRT_*, thunk_*, and unprefixed functions.
