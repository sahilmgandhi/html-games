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
- `lighting.createLighting(scene)` → `{ update(dt), dispose() }`
- `environment.createEnvironment(scene, ageIndex)` → `{ group, setAge(i), dispose() }`
- `units.UnitMesh(entity, ageIndex)` → `{ mesh, update(dt, entity), dispose() }`
- `bases.BaseMesh(side, ageIndex)` → `{ mesh, setHp(frac), dispose() }`
- `turrets.TurretMesh(turret, ageIndex)` → `{ mesh, aimAt(x,y,z), dispose() }`
- `buildings.BuildingMesh(building)` → `{ mesh, dispose() }`
- `projectiles.ProjectileMesh(kind)` → `{ mesh, update(dt), dispose() }`
- `particles.ParticleSystem3D(scene)` → `{ damageNumber(), goldNumber(), burst(), update(dt) }`
- `hud.HUD(root, game)` → `{ update(state), on(action), dispose() }`
- `audio.AudioManager` → `{ play(name), startMusic(age), updateMusicAge(age) }`
- `simulation.*` → pure classes, importable in Node for tests.
- `demo-battle.runDemoBattle(game)` → drives a scripted Stone Age battle.

Core (`src/core/`) is touched only by the integrator. Builders request core changes instead of making them.

## Data flow

Simulation holds all state as plain objects (`units[]`, `turrets[]`, `buildings[]`, projectile pool). Rendering meshes are keyed by entity `id` and synced each frame (position, facing, pose). Simulation never imports Three.js; rendering never mutates game state.

Entity fields: `id, x, z, side ('player'|'enemy'), type, ageIndex, hp, maxHp, damage, speed, range, attackSpeed, attackCooldown, alive, dying, walkPhase, hitFlash`.

## Events (via `game.events`)

`entity:spawn`, `entity:death`, `projectile:fire`, `projectile:hit`, `gold:change`, `xp:change`, `age:evolve`, `special:activate`, `game:over`. Payload is the entity or a small state object.

## Determinism

Seeded PRNG (`simulation/rng.js`, mulberry32) for AI and gameplay. No `Math.random()` in simulation. Rendering-only cosmetics (particle jitter) may use `Math.random()`.

## Performance budget

≥50 fps at 1080p on a mid-range GPU. ≤1500 draw calls. Projectile/particle meshes pooled. Shadows: one 2048px PCF-soft directional map, main entities only.

## Asset policy

Procedural Three.js geometry + `MeshStandardMaterial` (metallic-roughness PBR) only. No external model files. Runtime Canvas2D textures allowed for ground detail and face decals.

## Failure isolation

Each module's `update` is wrapped so an exception disables that module (and logs once) without stopping the loop. The app must stay loadable at all times for screenshot agents.
