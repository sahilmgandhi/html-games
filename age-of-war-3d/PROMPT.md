# Goal
Build a Clash Royale / Clash of Clans–class 3D lane-battle game in Three.js (latest release) + Vite, plain ES modules, from an empty `age-of-war-3d/` directory. The bar is AAA: photographic PBR materials, physically plausible sun/sky/shadows, atmospheric depth, stylized 3D units with personality, believable projectile trails and impact effects. Never programmer art.

The original `age-of-war/` Canvas 2D game must NEVER be modified or broken. Sub-agents verify it every iteration.

# How to work

## 1. Architecture first
Before any feature code, write `ARCHITECTURE.md`: one folder per subsystem, a shared world data model, the public API each module must expose, the events it emits, units (metres, +Y up), determinism (seeded RNG only), a performance budget (≥50 fps at 1080p, ≤1500 draw calls) and an asset policy (procedural Three.js geometry with PBR materials, no external model files). Isolate module failures so one broken module never takes the game down.

**Modules (one folder each):**
- `terrain/` — 3D ground plane, sky dome, atmospheric fog per age
- `environment/` — Age-specific scenery (trees, rocks, ruins, buildings in background parallax)
- `units/` — 3D unit meshes (procedural geometry), walk/attack/death animations, pathfinding along lane
- `bases/` — Player and enemy base structures, HP bars, damage states
- `turrets/` — 3D turret meshes, rotation, auto-targeting, firing
- `buildings/` — Gold mine and barracks 3D meshes, placement, effects
- `projectiles/` — 3D projectile models, trails, impact particles, splash
- `particles/` — Damage numbers, gold indicators, explosions, special attack VFX
- `lighting/` — Sun position, shadow maps, ambient occlusion, time-of-day cycle
- `hud/` — 3D or HTML overlay HUD (unit cards, gold, XP, evolve button, special attack)
- `audio/` — Reuse or enhance Web Audio from original
- `simulation/` — Game logic ported from original as ES modules (entities, AI, balance, config)
- `demo-battle/` — Showcase mode: auto-play a Stone Age battle for screenshots

**Shared world data model:** Import `CONFIG` values from the original game (balance numbers are authoritative there). The 3D variant reads them but never writes them.

## 2. Build the verification loop before the game
A headless-Chrome screenshot tool that loads the Vite dev server, waits until ready, sets a camera preset, and writes PNG + a JSON log (console errors, fps, draw calls). Every module also ships a "showcase" mode that stages a representative scene of just that module. No agent may claim anything it hasn't screenshotted and looked at.

**Dual verification:**
- **Original game regression:** Load `localhost:8081/age-of-war/`, run through title → start → spawn units → verify canvas renders. Score 1–10. Must stay ≥9 every iteration.
- **3D variant quality:** Load the Vite dev server, screenshot at multiple camera angles and times of day. Score 1–10 against Clash Royale / Clash of Clans reference. Must reach ≥8 to pass.

## 3. Fan out
Use multi-agent orchestration. One builder agent per module, each owning only its folder. Run in waves ordered by dependency:

**Wave 1** (foundation): terrain, lighting, simulation, hud, audio, particles
**Wave 2** (gameplay): units, bases, turrets, buildings, projectiles, environment
**Wave 3** (polish): demo-battle, integration, final effects

Between waves, one integrator agent (the only one allowed to touch `core/`) applies builders' core-change requests and fixes the seams.

## 4. Gauntlet every module
After each builder round, a separate critic agent (a brutal AAA art director who writes no code) takes its own screenshots at several camera angles and times of day, checks the API contract, console errors and perf, and scores 0–10 against Clash Royale / Clash of Clans reference screenshots: 10 = indistinguishable, 8.5 = AAA with nits, 7 = good indie, 5 = programmer art. Pass = ≥8.5 with zero errors. Below that, the builder gets the ranked issue list and goes again, up to 4 rounds.

## 5. Final gate
A whole-game critic scores the demo battle. Then blind judges get pairs of screenshots labelled only A and B (ours vs. Clash Royale, order shuffled) and say which looks better and why.

## 6. /loop until every critic passes
Persist scores and open issues to `docs/STATUS.json` so each iteration resumes from the weakest module, not from scratch.

**Original game check every iteration:** Before any 3D work begins in a round, a sub-agent loads the original `age-of-war/` game and verifies it still works. Score must be ≥9. If it drops, stop all 3D work and fix the regression first.

# Rules
- Never inflate scores. Report real numbers, failed rounds and what is still missing.
- Never edit the `age-of-war/` directory. Game logic is imported/copied to `age-of-war-3d/simulation/` only.
- Never edit another module's folder. Core changes go through the integrator.
- Keep the dev server running and the app loadable at all times; other agents are screenshotting it.
- Keep the original game's test suite passing: `npm test -w age-of-war` must always pass.
- Do not ask me questions. Make routine decisions yourself, state assumptions, keep going.

Start now.
