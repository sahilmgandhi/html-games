# html-games

Games that are purely html — no build step, no runtime dependencies, no framework. Open the folder
in a browser and it runs.

## Games

| Game | Directory | Status | Play | Test |
|---|---|---|---|---|
| Age of War | [`age-of-war/`](age-of-war/) | Complete | `localhost:8081/age-of-war/` | `npm test -w age-of-war` |

## Running

```bash
npm install          # once, hoists dev dependencies for every game
npm run serve        # serves the repo root on :8081
npm test             # runs every game's suite
```

## Conventions

Every game in this repo follows the same shape, so what you learn in one transfers to the next:

- **No build step.** Plain `<script>` tags with globals, listed in `index.html` in dependency
  order. No ES modules, no bundler, no transpile.
- **No runtime dependencies.** Dev dependencies (sprite generation, tooling) are fine; anything
  the browser needs at runtime is checked in.
- **All tunable numbers in one `CONFIG` object** (`js/config.js`). Balance changes never require
  touching game logic, and docs can be generated from it.
- **Procedural canvas sprites with a PNG cache.** Art is drawn in code, then baked to `sprites/`
  so the game doesn't redraw it every frame.
- **Headless Node test harness.** `test-runner.js` stubs the DOM, loads the real game files listed
  in `index.html`, and drives real game frames — no browser, no test framework dependency.

## Adding a game

```bash
npm run new-game <slug> "<Display Name>"
```

Copies `template/` — a runnable title-screen-to-win-loop skeleton with tests — substitutes the
name, and registers the slug as an npm workspace. Then add a row to the table above and run
`npm install`.
