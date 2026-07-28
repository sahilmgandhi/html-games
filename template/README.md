# __GAME_NAME__

## How to Run

From the repo root:

```bash
npm run serve
```

Open http://localhost:8081/__GAME_SLUG__/ in your browser.

## Tests

```bash
npm test          # from this directory, or `npm test -w __GAME_SLUG__` from the root
```

Runs the headless harness (`test-runner.js`), which loads the real game files listed in
`index.html` and drives simulated frames — no browser required.

## Layout

| Path | Purpose |
|---|---|
| `index.html` | Script load order — the harness reads it, so a new JS file needs a tag here |
| `js/config.js` | Every tunable number |
| `js/utils.js` | Pure helpers |
| `js/game.js` | `Game`: state, `update(dt)`, `render()` |
| `js/main.js` | Browser entry (`data-entry`, excluded from tests) |
| `tests/harness.js` | DOM stubs, source loading, `makeGame`/`runFrames` |
| `tests/*.test.js` | Arrays of `{ name, run(t) }` blocks |

The skeleton is a playable click-to-chase game. Replace the contents, keep the shape: state on
`this`, `update(dt)` free of drawing, `render()` free of state changes — that split is what lets
the headless harness drive real frames.
