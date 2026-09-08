# Goal

Continue `age-of-war-3d/` from the finished Stone Age MVP to full five-age parity
with the original `age-of-war/` 2D game: Castle Age → Renaissance → Modern Age →
Future Age. Each age needs its own terrain mood, environment set, unit rigs,
base, turrets, and visual effects, all running through the existing BattleSim,
which already supports every age's balance numbers.

Stone Age is done and playable (see Starting State). Do not regress it.

# Starting State (read first)

- `ARCHITECTURE.md` — world model, module contracts, budgets. Update it when
  contracts change; it is the law.
- `docs/STATUS.json` — per-module scores and open issues. Every iteration
  resumes from the weakest module, never from scratch.
- `PROMPT.md` — the original gauntlet this file extends. Where the two
  conflict, this file wins.
- Key code: `src/simulation/battle.js` (all ages' logic works),
  `src/demo-battle/battle-view.js` (`applyBattleAction`, mesh sync),
  `src/main.js`, `src/hud/hud.js`, `tools/screenshot.mjs` (`--strict`),
  `tools/probe.mjs` (drive the live game), `tools/battle-smoke.mjs` (23 checks),
  `tools/sim-smoke.mjs`.
- Known visual debt (auto-fail until fixed, applies to every new age too):
  menhirs read as concrete pillars, flags are flat quads, mesas read as
  industrial silos, pines are stacked cones.

# The Loop Invariant (unchanged)

1. **Architecture first.** Any contract change lands in `ARCHITECTURE.md`
   before code.
2. **Verification loop before game.** Every module ships `showcase.js`
   (`runShowcase(game)`). No claim without a screenshot you looked at.
   `npm run shot -- --showcase <m> --strict` must be error-free; budgets hold
   (≥50fps, ≤1500 draw calls, one 2048px shadow map).
3. **Fan out in waves per age**: (a) terrain mood + lighting + environment,
   (b) units + bases + turrets + projectiles, (c) age FX + integration.
   One builder per folder; only the integrator touches `src/core/`.
4. **Gauntlet every module** (Section: Critic Protocol). Builder iterates on
   the ranked issue list, up to 4 rounds.
5. **Dual verification every iteration**: original `age-of-war/` loads and
   plays, score ≥9/10, `npm test -w age-of-war` 156/156; 3D variant scored
   per the rubric below.
6. **Persist** scores and open issues to `docs/STATUS.json` before committing.
7. **Commit often**, concise messages. Keep the dev server loadable at all
   times; other agents are screenshotting it.

# Raised Visual Standard (new, binding)

The Stone Age loop passed "good indie" (7/10). From here the bar is
**Clash Royale / Clash of Clans at a glance**: a blind judge shown our
screenshot beside a CR/CoC frame must hesitate. Score each axis 0–10, then
overall. Pass = overall **≥8.5 with zero console/app errors**.

Axes: silhouette readability at gameplay distance; material richness (PBR,
no flat unmodulated color); light and shadow (grounded entities, no pure
black faces, no blown highlights); animation life (locomotion, anticipation,
impact, idle motion on structures); effect density (every hit flashes,
bursts, and floats a number; specials telegraph then pay off); scene
composition (foreground/mid/background layers, fog matched to sky, no
empty voids at any camera).

**Visual veto (auto-fail, no score averaging out of it):**

- Any mesh that reads as an unmodified primitive (cylinder tower, cone
  tree, box building, sphere rock). Every mesh needs at least two of:
  vertex-noise breakup, bevel/chamfer, secondary detail, accessory/prop.
- Flat-quad flags, banners, or cloth. Cloth ripples or it does not ship.
- `MeshBasicMaterial`/`MeshLambertMaterial` on anything but FX glows.
- Visible texture tiling, stretched UVs, or texel-density jumps.
- Entities floating, clipping through ground, or casting no shadow.
- Dead screen space: any of the close/wide/side framings may not show bare
  ground, bare sky, or fog that does not match the sky.

**Reference discipline:** the critic names the exact CR/CoC reference frame
compared against (game, what is on screen, why it is the right comp) and
screenshots our closest equivalent angle. "Looks good" without a named
reference is a failed review.

# Critic Protocol (sub-agent benchmarking)

Roles: **regression** (original game health, runs first, can halt all 3D
work), **builder** (one folder, writes code), **critic** (writes no code,
takes own screenshots at close/wide/side + gameplay cam, scores per-axis
against named references, returns a ranked issue list with screenshot
filenames), **integrator** (seams, `core/`, final full-pass screenshots).

- Critics never reuse builder screenshots; they drive the bridge themselves
  (`tools/screenshot.mjs`, `tools/probe.mjs`).
- Scores are never inflated: report failed rounds, what is missing, and the
  exact reference gap. A 7 with a clear list beats a dishonest 9.
- Blind A/B final gate per age: pairs labelled A/B only (ours vs reference,
  order shuffled); judge picks the better-looking one and says why. Two
  consecutive judge picks of ours (or "cannot tell") passes the age.
- Batches: critic may fail fast on the first veto item; builder fixes vetoes
  before any other polish.

# Environment & Tools

- Host bridge: Chrome CDP `127.0.0.1:9222`, 2D game `:8081/age-of-war/`,
  3D Vite `:3001/`. Never start servers from the sandbox; if the bridge is
  down, ask the user to run `game-bridge start` from a non-sandbox shell.
- `npm run shot -- --showcase <module> --out shots/<n>.png --wait <ms>
  --strict` (PNG + JSON log with errors/fps/draw calls).
- `node tools/probe.mjs --wait <ms> --until "<js>" --shot <png> --expr "<js>"`
  drives the live game (click buttons, assert sim state, catch overlays).
- `node tools/battle-smoke.mjs`, `node tools/sim-smoke.mjs`,
  `npm test -w age-of-war`, `npm test -w age-of-war-3d`.

# Rules

- Never edit `age-of-war/`. Balance numbers are read from it, never written.
- Never edit another module's folder. Core changes go through the integrator.
- `npm test -w age-of-war` (156) and `npm test -w age-of-war-3d` (11) must
  pass before every commit.
- Make routine decisions yourself, state assumptions, keep going. Do not
  ask the user questions; the loop is the authority.
- Never inflate scores. Real numbers, failed rounds, missing pieces.

Start with Castle Age, wave (a). Resume-from-weakest per `docs/STATUS.json`.
