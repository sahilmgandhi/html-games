# __GAME_NAME__

This is a new game from `template/`. It is a simple chase game. Replace it with your game. Keep the same shape.

## Start

Do these steps from the repo root:

```bash
npm run serve
```

Then open `http://localhost:8081/__GAME_SLUG__/` in your browser.

## Test

```bash
npm test  # from this folder
```

Or from the root, use `npm test -w __GAME_SLUG__`. Tests run in Node. No browser is needed.

## Layout

| Path | Use |
|---|---|
| `index.html` | Load order for scripts |
| `js/config.js` | All game numbers |
| `js/utils.js` | Small helpers |
| `js/game.js` | Game state and rules |
| `js/main.js` | Browser start only |
| `tests/` | Test files |

Rules for code:
- Put state on `this`.
- Keep drawing out of `update(dt)`.
- Keep state changes out of `render()`.
- Add each new script to `index.html`.
