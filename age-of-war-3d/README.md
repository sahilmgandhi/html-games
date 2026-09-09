# Age of War 3D

This is the 3D version of Age of War. You defend your base. You destroy the enemy base. It uses Three.js for 3D views.

The game has five ages. Stone, Castle, Renaissance, Modern, and Future are all done. Game numbers come from the 2D game. Do not change them here.

## Start

Use one of these two ways.

Static way, from the repo root:

```bash
npm run serve
```

Then open `http://localhost:8081/age-of-war-3d/` in your browser. No build is needed. Three.js is in `vendor/`.

Dev way, from this folder:

```bash
npm install
npm run dev
```

Then open the Vite URL in your browser. It normally uses port 3001.

## Play

Play is the same as the 2D game. Spawn units to push the lane. Earn gold and XP from kills. Evolve through the ages. Win when the enemy base falls.

Camera follows the fight. You can move it. HUD shows gold, XP, and unit cards. Keys match the 2D game.

## Test

```bash
npm test  # from this folder
```

Or from the root, use `npm test -w age-of-war-3d`. Tests run in Node. No browser is needed.

To make a build, use `npm run build`. Build output goes to `dist/`.

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) describes the code layout.
- [`STATUS.json`](STATUS.json) lists done work and open issues.
