# Goal
Build a Clash Royale / Clash of Clans–class 3D lane-battle game in Three.js (latest release) + Vite, plain ES modules, in `age-of-war-3d/`. The bar is AAA: photographic PBR materials, physically plausible sun/sky/shadows, atmospheric depth, 3D units with personality, believable projectile trails and impact effects. Never programmer art. The photoreal target (GTA/COD/Witcher at 10/10) stands as the aspiration; the readability floor is CR/CoC at a glance.

Honest baseline (gauntlet 2026-09-09, never inflated): stylized 7–8/10 (stone day 8, castle night 7, future night 7, units close-up 7.5), photoreal 4/10. Every iteration moves those numbers, not the bar.

The original `age-of-war/` Canvas 2D game must NEVER be modified or broken. Sub-agents verify it every iteration.

# Starting state (this prompt supersedes the empty-directory scaffold)

`age-of-war-3d/` is a shipped five-age game, not a scaffold. Stone, Castle, Renaissance, Modern, and Future ages are playable with full feature parity (parity score 9): unit upgrades, turret slots, mine/barracks, speed/formation controls, heroes, specials, pause, game-over, restart. All four age-vs-age A/B gates PASS; all five live playthroughs PASS with zero errors.

- Units are Quaternius CC0 skeletal casts (one coherent cast per age) with procedural weapons/props seated on hand/head bones. Procedural-only rigs remain as fallback.
- Shared systems: `core/pbr.js` (grit albedo, cloth, team rings, metalness), shared side tower with 4 turret mounts, per-age `demo-battle/<slug>/showcase.js`, `gallery/` showcase (orbit, click-focus, all ages), spectate BOT button (competent in-sim policy, manual takeover), `tools/videocap.mjs` (CDP screencast to mp4 + contact sheets).
- Test suites: `npm test -w age-of-war` 156/156, `npm test -w age-of-war-3d` 419/419 asserts. Both must pass before every commit.

# How to work

## 1. Architecture first
`ARCHITECTURE.md` is the law: one folder per subsystem, a shared world data model, the public API each module must expose, the events it emits, units (metres, +Y up), determinism (seeded RNG only), a performance budget (≥50 fps at 1080p, ≤1500 draw calls, one 2048px shadow map) and the asset policy below. Update it before code when contracts change. Isolate module failures so one broken module never takes the game down.

**Modules (one folder each):**
- `terrain/` — 3D ground plane, sky dome, atmospheric fog per age
- `environment/` — Age-specific scenery (trees, rocks, ruins, buildings in background parallax)
- `units/` — Skeletal cast per age (CC0 glTF/FBX) + procedural hand props; walk/attack/death clips, pathfinding along lane
- `bases/` — Player and enemy base structures, HP bars, damage states
- `turrets/` — Shared side tower (`TowerMesh`, 4 mounts) + `TurretMesh` per slot: rotation, auto-targeting, firing
- `buildings/` — Gold mine and barracks 3D meshes, placement, effects
- `projectiles/` — 3D projectile models, trails, impact particles, splash
- `particles/` — Damage numbers, gold indicators, explosions, special attack VFX
- `lighting/` — Sun position, shadow maps, ambient occlusion, time-of-day cycle, per-age rim/fill
- `hud/` — HTML overlay HUD (unit cards, gold, XP, evolve button, special attack, BOT toggle)
- `audio/` — Web Audio synth SFX + music (adapted from original)
- `simulation/` — Game logic ported from original as ES modules (entities, AI, balance, config)
- `demo-battle/` — Scripted showcases: shared `stage.js`/`roster.js` helpers plus `<slug>/showcase.js` per age
- `gallery/` — All-ages orbit showcase with click-focus, clip cycling, labels

**Shared world data model:** Import `CONFIG` values from the original game (balance numbers are authoritative there). The 3D variant reads them but never writes them.

**Asset policy:** External CC0 glTF/FBX skeletal casts with `License.txt` vendored, plus procedural weapons/props/scenery and PBR materials. Procedural fallback rigs stay so evolve never renders a missing mesh. No paid or unverified-license assets.

## 2. Verification loop before game polish
Headless-Chrome screenshot and video tools drive the Vite dev server: PNG + JSON log (console errors, fps, draw calls) via `npm run shot -- --showcase <m> --strict`; motion verdicts via `tools/videocap.mjs` (mp4 + contact sheet). Every module ships a `showcase.js` (`runShowcase(game)`). No agent may claim anything it hasn't screenshotted or recorded and looked at.

**Dual verification:**
- **Original game regression:** Load `localhost:8081/age-of-war/`, run through title → start → spawn units → verify canvas renders. Score 1–10. Must stay ≥9 every iteration.
- **3D variant quality:** Screenshot at multiple camera angles and times of day; video for motion. Score 1–10 against CR/CoC reference (floor) with the photoreal aspiration noted. Pass = ≥8.5 with zero errors.

## 3. Fan out
Use multi-agent orchestration. One builder agent per module, each owning only its folder. Run in waves ordered by dependency; the integrator (the only one allowed to touch `core/`) applies builders' core-change requests and fixes the seams. Polish waves target the weakest module per `docs/STATUS.json`, never restart from scratch.

## 4. Gauntlet every module
After each builder round, a separate critic agent (a brutal AAA art director who writes no code) takes its own screenshots and video at several camera angles, checks the API contract, console errors and perf, and scores 0–10 against CR/CoC reference frames: 10 = indistinguishable, 8.5 = AAA with nits, 7 = good indie, 5 = programmer art. Pass = ≥8.5 with zero errors. Below that, the builder gets the ranked issue list and goes again, up to 4 rounds. Critics name the exact reference frame compared against; "looks good" without a named reference is a failed review.

## 5. Final gate
A whole-game critic scores the demo battle. Then blind judges get pairs of screenshots labelled only A and B (ours vs. reference, order shuffled) and say which looks better and why. Two consecutive judge picks of ours (or "cannot tell") passes.

## 6. Loop until every critic passes
Persist scores and open issues to `docs/STATUS.json` (mirror to root `STATUS.json`) so each iteration resumes from the weakest module, not from scratch.

**Original game check every iteration:** Before any 3D work begins in a round, a sub-agent loads the original `age-of-war/` game and verifies it still works. Score must be ≥9. If it drops, stop all 3D work and fix the regression first.

# Rules
- Never inflate scores. Report real numbers, failed rounds and what is still missing.
- Never edit the `age-of-war/` directory. Game logic lives in `age-of-war-3d/simulation/` only.
- Never edit another module's folder. Core changes go through the integrator.
- Keep the dev server running and the app loadable at all times; other agents are screenshotting it.
- Keep both test suites passing: `npm test -w age-of-war` (156) and `npm test -w age-of-war-3d` (419 asserts) must pass before every commit.
- Decide routine matters yourself, state assumptions, keep going. Ask the user only on big forks (bar changes, scope changes, asset-source changes); the loop is the authority otherwise.

Start now.
