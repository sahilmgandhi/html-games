# Age of War — Architecture

No build step, no runtime dependencies, no ES modules. `index.html` loads every file as a plain
`<script>` in dependency order; each file defines globals the later ones use.

## File Structure

```
age-of-war/
├── index.html              # Script load order — the single source of truth for it
├── package.json            # `npm test`, `npm run docs`; canvas is a dev-only dep
├── css/style.css           # Canvas centering, dark background
├── js/
│   ├── config.js           # CONFIG: every tunable number in the game
│   ├── utils.js            # clamp, lerp, dist, rand*, pointInRect, weightedRandom
│   ├── sprites.js          # SpriteManager: procedural sprites + PNG cache
│   ├── entities.js         # Base, Unit, Turret, Building, Projectile
│   ├── renderer/
│   │   ├── core.js         # class Renderer — camera, shake, color helpers (loads first)
│   │   ├── terrain.js      # Sky/ground caches, parallax, age crossfade
│   │   ├── entities.js     # Bases, units, turrets, buildings, projectiles, slots
│   │   ├── hud.js          # Bottom HUD bar, tooltips, pause button
│   │   └── overlays.js     # Pause, password prompt, debug panel
│   ├── input.js            # Mouse/keyboard, camera scroll, HUD hit-testing
│   ├── ai.js               # Enemy decision loop
│   ├── particles.js        # Particles and floating damage/gold numbers
│   ├── audio.js            # Web Audio synth (SFX + music)
│   ├── minimap.js          # Minimap strip overlay
│   ├── achievements.js     # Unlock tracking, persisted to localStorage
│   ├── balance.js          # In-memory match telemetry for tuning
│   ├── game.js             # Game: state, update, render, save/load, debug
│   └── main.js             # Browser entry — canvas setup, title screen, rAF loop
├── sprites/                # Baked PNG sprite cache
├── tools/
│   ├── generate-sprites.js # Rebakes sprites/ using node-canvas
│   └── gen-docs.js         # Generates docs/balance.md from CONFIG
├── tests/
│   ├── harness.js          # DOM stubs, source loading, makeGame/runFrames
│   └── *.test.js           # One file per theme
├── test-runner.js          # Discovers and runs tests/*.test.js
└── docs/
    ├── game-design.md      # Mechanics and design intent (no numbers)
    ├── architecture.md     # This document
    └── balance.md          # GENERATED from config.js — do not hand-edit
```

## Module Responsibilities

Signatures are in the code; this section covers what each module owns and what breaks if you ignore
it.

### config.js

The only place a tunable number may live. Nothing else in the codebase should contain a balance
constant. `docs/balance.md` is generated from this file and a test enforces that the two agree.

### utils.js

Pure math helpers. No game state, no canvas.

### sprites.js

`SpriteManager` renders each `(type, ageIndex, side)` once into an offscreen canvas at 256px and
reuses it, preferring a baked PNG from `sprites/` when one has loaded. Team colour appears only as
an accent (sash, cape, shield face) so the age's palette stays readable. Mounted units skip leg
drawing via `opt.noLegs`.

### entities.js

Combat data and behaviour, with no drawing. `Unit` owns target acquisition (nearest enemy unit, then
turret, then base), movement, attack timing, and splash. `Turret` and `Building` are damageable and
can die — anything that applies damage must handle all three.

### renderer/

**One class, `Renderer`, split across five files.** `core.js` declares `class Renderer`; every other
file does `Object.assign(Renderer.prototype, { ... })`. This means **`core.js` must load first**, in
`index.html` and therefore in the test harness. All state lives on `this`; no file has module-level
side effects.

The HUD module and `input.js` hit-test the same rectangles from opposite sides. Both derive them
from `CONFIG.HUD_HEIGHT`, `CONFIG.UNIT_START_X`, and `CONFIG.UNIT_SPACING` — hardcoding either side
silently desynchronizes clicks from what is drawn.

### input.js

Owns mouse position, keyboard state, edge scrolling, and mapping clicks onto HUD controls. Canvas
clicks are scaled by the canvas's CSS-to-backing-store ratio before hit-testing, so a resized window
does not offset every button.

### ai.js

Runs on a think timer scaled by difficulty. Evaluates evolution, then special attack, then a
weighted random unit spawn, biasing toward melee when the player fields a large army.

### particles.js / audio.js / minimap.js / achievements.js / balance.js

Self-contained side systems. `audio.js` synthesizes everything with oscillators — no audio assets.
`balance.js` accumulates per-match telemetry in memory for tuning; `achievements.js` persists
unlocks to `localStorage`.

### game.js

The orchestrator, and the only module that mutates match state. Owns the update order, kill rewards,
evolution, specials, buildings, win/lose detection, save/load, and the debug panel's click handling
(`handleDebugClick`, which must mirror `drawDebugScreen`'s layout).

### main.js

Browser-only entry point. It runs immediate side effects at load — canvas lookup, `fitCanvas()`,
`new SpriteManager()` — so it is marked `data-entry` in `index.html` and excluded by the test
harness, which provides its own `spriteManager`.

## Update Order

`Game.update(dt)` runs a fixed sequence each frame; combat correctness depends on it:

1. Input (camera scroll)
2. Passive income and building production
3. AI think tick
4. Units — move, acquire target, attack
5. Turrets — acquire, fire
6. Projectiles — move, hit, splash
7. Cleanup of dead units/projectiles/turrets/buildings, paying out kill rewards
8. Win/lose check
9. Particles

Render then draws terrain → bases → turrets/buildings → units → projectiles → particles → HUD →
minimap → overlays.

## Coordinate System

World coordinates run 0–`CONFIG.WORLD.WIDTH` horizontally; the screen is `CONFIG.VIEWPORT.WIDTH`
wide. `screenX = worldX - camera.x`, via `renderer.worldToScreen()`. Ground level is
`CONFIG.GROUND_Y`, and units are positioned by their feet.
