# Goal

Push `age-of-war-3d/` from shipped five-age stylized (7–8/10) toward the photoreal bar (GTA/COD/Witcher at 10/10), keeping CR/CoC-at-a-glance readability as the floor. Priority order: visual polish first, then gameplay features, performance, audio. This file extends `PROMPT.md`; where the two conflict, this file wins.

# Starting State (read first)

All five ages are complete and playable with feature parity (parity score 9). Do not regress them.

- `ARCHITECTURE.md` — world model, module contracts, budgets. Update it when
  contracts change; it is the law.
- `docs/STATUS.json` — per-module scores and open issues. Every iteration
  resumes from the weakest module, never from scratch.
- `PROMPT.md` — the origin law this file extends (photoreal bar, CC0 +
  procedural asset policy, gauntlet, gates).
- Key code: `src/simulation/battle.js` (all ages' logic),
  `src/demo-battle/battle-view.js` (`applyBattleAction`, mesh sync),
  `src/main.js`, `src/hud/hud.js`, `src/gallery/` (orbit showcase),
  `tools/screenshot.mjs` (`--strict`), `tools/probe.mjs` (drive the live game),
  `tools/videocap.mjs` (motion verdicts), `tools/battle-smoke.mjs` (23 checks),
  `tools/sim-smoke.mjs`.
- Shipped casts (Quaternius CC0, `License.txt` vendored; procedural hand props
  on bones; procedural fallback rigs intact): Stone (Viking/Goblin/Wizard/raptor
  + rider), Castle (knights, elf archers, horse mounts, paladin), Renaissance
  (pirate Barbarossa/Mako/Henry/Anne + crew-served cannon), Modern (toon
  shooters with AKs, animated tank, hazmat commander + cap/baton/trim), Future
  (mechs, robot + energy blade, alien + gun).
- Shipped graphics passes: AAA1–15 (grit albedo, attack/muzzle/death juice,
  keep/cannon/palazzo/bunker/citadel/turret/infantry/hero/building/projectile
  detail), ground speckle + cracks, segmented HP sprites, team rings, per-age
  rim/fill, painted banner emblems, camera shake, blood-mist vs spark vs debris
  hit FX, scorch decals, spectate BOT.
- Old visual debt retired: menhirs are dark basalt with strata, flags ripple
  via shared `makeCloth`, mesas are jittered strata rock, pines are tiered
  conifers with tint jitter.
- Current weakest items (gauntlet10 open issues, the resume-from-here list):
  walk-fluidity motion verdicts via videocap per age (simDt fix is
  test-proven; sheets show no slide), transient hit-flash blowout on night
  stills (0.1s, kept as feel; revisit if it reads in motion), night-battle
  readability at Castle/Future (Castle 7, Future 7 vs Stone 8).

# The Loop Invariant (unchanged)

1. **Architecture first.** Any contract change lands in `ARCHITECTURE.md`
   before code.
2. **Verification loop before polish.** Every module ships `showcase.js`
   (`runShowcase(game)`). No claim without a screenshot or video you looked
   at. `npm run shot -- --showcase <m> --strict` must be error-free; budgets
   hold (≥50fps, ≤1500 draw calls, one 2048px shadow map). Motion claims need
   `tools/videocap.mjs` (mp4 + contact sheet), not stills.
3. **Fan out in waves per polish target**: (a) weakest-module geometry and
   materials, (b) animation life and hit FX, (c) lighting/integration. One
   builder per folder; only the integrator touches `src/core/`.
4. **Gauntlet every module** (Section: Critic Protocol). Builder iterates on
   the ranked issue list, up to 4 rounds.
5. **Dual verification every iteration**: original `age-of-war/` loads and
   plays, score ≥9/10, `npm test -w age-of-war` 156/156; 3D variant scored
   per the rubric below, `npm test -w age-of-war-3d` 419/419 asserts.
6. **Persist** scores and open issues to `docs/STATUS.json` (mirror to root
   `STATUS.json`) before committing.
7. **Commit often**, concise messages. Keep the dev server loadable at all
   times; other agents are screenshotting it.

# Raised Visual Standard (binding)

The bar is **photoreal at 10/10 with CR/CoC readability at a glance**: a blind
judge shown our screenshot beside a CR/CoC frame must hesitate, and a judge
shown our close-up must read material truth (skin, steel, cloth, rock). Score
each axis 0–10, then overall. Pass = overall **≥8.5 with zero console/app
errors**. Track the photoreal score separately and honestly; it stands at 4
and moves only on evidence.

Axes: silhouette readability at gameplay distance; material richness (PBR,
no flat unmodulated color); light and shadow (grounded entities, no pure
black faces, no blown highlights); animation life (locomotion, anticipation,
impact, idle motion on structures); effect density (every hit flashes,
bursts, and floats a number; specials telegraph then pay off); scene
composition (foreground/mid/background layers, fog matched to sky, no
empty voids at any camera).

**Visual veto (auto-fail, no score averaging out of it):**

- Any mesh that reads as an unmodified primitive (cylinder tower, cone
  tree, box building, sphere rock). Every procedural mesh needs at least two
  of: vertex-noise breakup, bevel/chamfer, secondary detail, accessory/prop.
  Shipped CC0 casts are authored assets, not primitives, but they fail if
  they ship raw: each cast needs material integration (nightPrep lifts,
  team ring, HP bar, hand prop where armed).
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
takes own screenshots and video at close/wide/side + gameplay cam, scores
per-axis against named references, returns a ranked issue list with
screenshot filenames), **integrator** (seams, `core/`, final full-pass
screenshots).

- Critics never reuse builder screenshots; they drive the bridge themselves
  (`tools/screenshot.mjs`, `tools/probe.mjs`, `tools/videocap.mjs`).
- Scores are never inflated: report failed rounds, what is missing, and the
  exact reference gap. A 7 with a clear list beats a dishonest 9.
- Blind A/B final gate per target: pairs labelled A/B only (ours vs
  reference, order shuffled); judge picks the better-looking one and says
  why. Two consecutive judge picks of ours (or "cannot tell") passes.
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
- `node tools/videocap.mjs` records motion (mp4 + contact sheet) for
  animation verdicts; stills alone never prove motion.
- `node tools/battle-smoke.mjs`, `node tools/sim-smoke.mjs`,
  `npm test -w age-of-war`, `npm test -w age-of-war-3d`.

# Rules

- Never edit `age-of-war/`. Balance numbers are read from it, never written.
- Never edit another module's folder. Core changes go through the integrator.
- `npm test -w age-of-war` (156) and `npm test -w age-of-war-3d` (419 asserts)
  must pass before every commit.
- Decide routine matters yourself, state assumptions, keep going. Ask the user
  only on big forks (bar, scope, asset sources); the loop is the authority
  otherwise.
- Never inflate scores. Real numbers, failed rounds, missing pieces.

Resume from the weakest item in `docs/STATUS.json`: walk-fluidity video
verdicts per age, then night-battle readability.
