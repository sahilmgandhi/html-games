# html-games

This repo holds small browser games. Players need only a browser.

## Games

| Game | Directory | Status | Play | Test |
|---|---|---|---|---|
| Age of War | [`age-of-war/`](age-of-war/) | Complete | `localhost:8081/age-of-war/` | `npm test -w age-of-war` |
| Age of War 3D | [`age-of-war-3d/`](age-of-war-3d/) | Complete | `localhost:8081/age-of-war-3d/` | `npm test -w age-of-war-3d` |

## Start

Do these steps from the root:

```bash
npm install    # install once, links all games
npm run serve  # serves the root on port 8081
```

Then open a game in your browser. Use `localhost:8081/age-of-war/`. Use `localhost:8081/age-of-war-3d/` for the 3D game.

## Test

```bash
npm test  # runs tests for all games
```

To test one game only, use `npm test -w age-of-war`. Use `npm test -w age-of-war-3d` for the 3D game.

## Rules

Each game follows the same rules. These rules keep games simple.

- No build step for 2D games. The browser loads plain scripts.
- No runtime libraries for 2D games. All code is checked in.
- All game numbers live in one `CONFIG` object.
- Art is drawn in code where possible.
- Tests run in Node with no browser. Tests load real game files.

Age of War 3D is different. It uses Three.js for 3D views. It vendors Three.js in the repo. It can use Vite for local work.

## Add a Game

```bash
npm run new-game <slug> "<Display Name>"
```

This command copies `template/`. It registers the new game. Then add a row to the Games table. Then run `npm install`.
