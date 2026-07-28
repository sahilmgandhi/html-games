# age-of-war — invariants

Things that are easy to break and that nothing else will catch for you. See
[`docs/architecture.md`](docs/architecture.md) for the wider picture.

1. **`index.html` is the script manifest.** A new JS file needs a `<script>` tag there, in
   dependency order — the test harness discovers the load list by parsing that file, so a missing
   tag means the file is absent in tests too. Browser-only entry points are marked `data-entry` and
   skipped by the harness (today that is only `js/main.js`, which runs side effects on load).

2. **HUD geometry is shared.** `CONFIG.HUD_HEIGHT`, `CONFIG.UNIT_START_X`, and
   `CONFIG.UNIT_SPACING` are used by `js/renderer/hud.js` to draw and by `js/input.js` to hit-test.
   Hardcoding either side desynchronizes clicks from buttons with no error.

3. **The debug panel has two halves.** `drawDebugScreen` (`js/renderer/overlays.js`) draws it;
   `game.handleDebugClick` hit-tests it. Change one layout and you must change the other.

4. **Balance numbers live only in `js/config.js`.** After changing any of them run `npm run docs` —
   `tests/docs.test.js` compares `docs/balance.md` against a fresh render and fails on drift.

5. **`Renderer` is one class across `js/renderer/*.js`.** `core.js` declares it; the rest extend it
   with `Object.assign(Renderer.prototype, { ... })`. `core.js` must load first.

6. **No runtime dependencies, no build step, no ES modules.** `canvas` is a dev-only dependency for
   `tools/generate-sprites.js`.
