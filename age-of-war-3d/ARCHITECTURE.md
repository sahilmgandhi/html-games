# ARCHITECTURE.md — age-of-war-3d

3D lane-battle RTS (Three.js r185 + Vite, plain ES modules). Port of `age-of-war/` gameplay to a side-scrolling 3D battlefield. MVP: Stone Age only.

Balance numbers are authoritative in `../age-of-war/js/config.js`. This package copies them into `src/simulation/config.js` as an ES module and never writes them back.

## World model

- Units: metres, +Y up. 1 world unit = 1 metre.
- x = lane axis, 0 (player base) to 24 (enemy base). Ground plane at y = 0.
- z = lane depth, units spread across z in [-2, 2] for visual depth. Gameplay distances use x only.
- Camera: side view from z ≈ +20, slight downward tilt, follows midpoint of action.

Scale guide: units 1.5–3 m tall, turrets 4–6 m, bases 8–12 m.

## Layout

```
src/
  core/          Game3D (rAF loop), Renderer3D (Three.js setup), EventBus
  simulation/    Pure logic, no Three.js: config, entities, ai, balance, utils, rng
  terrain/       Ground plane, sky dome, fog per age
  lighting/      Sun + shadows + ambient
  environment/   Background scenery per age (parallax layer)
  units/         UnitMesh: procedural 3D mesh per unit, walk/attack/death pose
  bases/         BaseMesh: 3D base structure + HP bar
  turrets/       TurretMesh: 3D turret, yaw to target, muzzle flash hook
  buildings/     BuildingMesh: gold mine / barracks
  projectiles/   ProjectileMesh: 3D projectile + trail
  particles/     ParticleSystem3D: floating numbers, bursts, special-attack VFX
  hud/           HTML overlay: gold, XP, unit cards, evolve, special
  audio/         Web Audio synth SFX + music (adapted from original)
  demo-battle/   Auto-play Stone Age showcase for screenshots
```

## Module contracts

Each gameplay module owns only its folder and exposes one factory or class:

- `terrain.createTerrain(scene, ageIndex)` → `{ group, update(dt), setAge(i), dispose() }`
- `lighting.createLighting(scene)` → `{ sun, update(dt), setAge(i), dispose() }`
- `environment.createEnvironment(scene, ageIndex)` → `{ group, setAge(i), dispose() }`
- `units.UnitMesh(entity, ageIndex)` → `{ mesh, update(dt, entity), dispose() }`
- `bases.BaseMesh(side, ageIndex)` → `{ mesh, setHp(frac), update(dt), dispose() }`
- `turrets.TurretMesh(turret, ageIndex)` → `{ mesh, aimAt(x,y,z), dispose() }` (downsized ~0.55x, mounts onto shared side tower; see below)
- `turrets.TowerMesh(side, ageIndex)` → `{ mesh, mount(i), dispose() }` (one shared tower per side with 4 mounts on top; turrets seat on mounts, never free-standing in lane)
- `buildings.BuildingMesh(building)` → `{ mesh, dispose() }` (age-agnostic: mine/barracks look identical in every age, matching the original)
- `projectiles.ProjectileMesh(kind)` → `{ mesh, update(dt), dispose() }`
- `particles.ParticleSystem3D(scene)` → `{ damageNumber(), goldNumber(), burst(), update(dt) }`
- `hud.HUD(root, game)` → `{ update(state), on(action), dispose() }`
- `audio.AudioManager` → `{ play(name, at?), startMusic(age), updateMusicAge(age), setListener(x, z) }` (positional battle mix: `at` in world metres, camera-driven listener; UI/music calls stay global)
- `simulation.*` → pure classes, importable in Node for tests.
- `demo-battle.runShowcase(game)` → scripted Stone Age match; `demo-battle/castle/showcase.js` `runShowcase(game)` → scripted Castle Age match (both sides evolved to age 1). Future ages follow the same `demo-battle/<slug>/showcase.js` pattern; the `?showcase=` loader resolves `<folder>/showcase.js` unchanged.

Core (`src/core/`) is touched only by the integrator. Builders request core changes instead of making them.

## Age routing (Castle Age onwards; single-agent deviation noted in STATUS.json)

- `UnitMesh`/`TurretMesh`/`BaseMesh` branch builders on `ageIndex`: age 1 = Castle
  rigs (Swordsman/Archer/Knight/Paladin, stone keep, Catapult/Fire Catapult/Oil).
  Unknown ages fall back to the age-0 rig for the same `type`/`turretIndex`, so
  evolve never renders a missing mesh.
- Projectile kinds: `rock`, `egg`, `boulder` (Stone) plus `arrow`, `fireball`,
  `oil` (Castle). `simulation/entities.js` (ours, sim-side) maps unit/turret
  type+age to kind; render only builds the mesh. Kind strings flow sim→render
  through the existing projectile pool.
- `age:evolve` transitions live in `demo-battle/battle-view.js`: on evolve it
  calls `setAge` on the shared `window.__world` terrain/environment, rebuilds
  both `BaseMesh`es for the new ages, and calls `audio.updateMusicAge`.
  Special-attack FX dispatches per `ageIndex` there too (Meteor Shower for 0,
  Arrow Volley for 1).
- Shared `core/pbr.js` cloth helper: `makeCloth(w, h, segW, mat)` returns
  `{ mesh, update(t) }`, a double-sided rippling banner. Both Stone and Castle
  bases use it (Stone retrofit approved); veto on flat-quad cloth applies to
  every age.

## Data flow

Simulation holds all state as plain objects (`units[]`, `turrets[]`, `buildings[]`, projectile pool). Rendering meshes are keyed by entity `id` and synced each frame (position, facing, pose). Simulation never imports Three.js; rendering never mutates game state.

Entity fields: `id, x, z, side ('player'|'enemy'), type, ageIndex, hp, maxHp, damage, speed, range, attackSpeed, attackCooldown, alive, dying, walkPhase, hitFlash`.

Movement rule: units advance toward their target but clamp at firing-range edge (stop-only, no overshoot past `range`). Formations removed: single fixed spawn point, no `formationMode`.

## Events (via `game.events`)

`entity:spawn`, `entity:death`, `projectile:fire`, `projectile:hit`, `gold:change`, `xp:change`, `age:evolve`, `special:activate`, `game:over`. Payload is the entity or a small state object.

## Determinism

Seeded PRNG (`simulation/rng.js`, mulberry32) for AI and gameplay. No `Math.random()` in simulation. Rendering-only cosmetics (particle jitter) may use `Math.random()`.

## Performance budget

≥50 fps at 1080p on a mid-range GPU. ≤1500 draw calls. Projectile/particle meshes pooled. Shadows: one 2048px PCF-soft directional map, main entities only.

## Asset policy (photoreal target: GTA/COD/Witcher at 10/10)

External glTF + 4K PBR textures allowed alongside procedural fallback. Procedural-only rule lifted per user approval. Reference frames named per critic shot (character close-up first, then wide battlefield).

## Failure isolation

Each module's `update` is wrapped so an exception disables that module (and logs once) without stopping the loop. The app must stay loadable at all times for screenshot agents.
