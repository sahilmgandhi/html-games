// BattleView: syncs BattleSim state to Three.js meshes each frame.
// Meshes are keyed by sim entity id; meshes self-position from their entity
// (UnitMesh/TurretMesh update()), so this layer only creates, updates and
// disposes them, plus combat FX, camera follow and base HP.
//
// Contract: attachBattleView(game, sim, fx) -> { dispose() }
// Registers ONE game.onUpdate that steps the sim first, then syncs.
// Owns age transitions: on age:evolve it re-moods the shared world to the
// player's age, rebuilds the evolved side's base, and switches the music.

import * as THREE from 'three';
import { CONFIG, toMeters } from '../simulation/config.js';
import { Unit } from '../simulation/entities.js';
import { UnitMesh } from '../units/units.js';
import { BaseMesh } from '../bases/bases.js';
import { TurretMesh } from '../turrets/turrets.js';
import { BuildingMesh } from '../buildings/buildings.js';
import { ProjectileMesh } from '../projectiles/projectiles.js';

const PROJ_HEIGHT = 1.1;

function projHeight(p) {
  return (CONFIG.GROUND_Y - p.y) * 0.01 + PROJ_HEIGHT;
}

// Maps HUD actions onto a BattleSim. Ignores economy/pace actions while
// paused or over (pause toggle and restart always go through).
export function applyBattleAction(sim, action) {
  if (!sim || !action) return;
  const live = !sim.gameOver && !sim.paused;
  switch (action.type) {
    case 'spawn-unit': if (live) sim.spawnUnit(action.index); break;
    case 'upgrade-unit': if (live) sim.upgradeUnit(action.index); break;
    case 'spawn-hero': if (live) sim.spawnHero('player'); break;
    case 'evolve': if (live) sim.evolve(); break;
    case 'special': if (live) sim.useSpecial(); break;
    case 'buy-slot': if (live) sim.buySlot(); break;
    case 'spawn-turret': if (live) sim.spawnTurret(action.index); break;
    case 'sell-turret': if (live) sim.sellTurret(action.index); break;
    case 'buy-building': if (live) sim.buyBuilding(action.index); break;
    case 'set-speed': sim.gameSpeed = [1, 2, 3].includes(action.speed) ? action.speed : 1; break;
    case 'cycle-speed': sim.gameSpeed = sim.gameSpeed >= 3 ? 1 : sim.gameSpeed + 1; break;
    case 'cycle-formation': if (live) sim.formationMode = (sim.formationMode + 1) % 3; break;
    case 'toggle-pause': if (!sim.gameOver) sim.paused = !sim.paused; break;
    case 'restart': sim.restart(); break;
    default: break;
  }
}

export function attachBattleView(game, sim, fx) {
  const scene = game.scene;
  const units = new Map();
  const turrets = new Map();
  const buildings = new Map();
  const projectiles = new Map();

  let playerBase = BaseMesh('player', sim.currentAge);
  playerBase.mesh.position.set(toMeters(sim.playerBase.x), 0, 0);
  scene.add(playerBase.mesh);
  let enemyBase = BaseMesh('enemy', sim.enemyAge);
  enemyBase.mesh.position.set(toMeters(sim.enemyBase.x), 0, 0);
  scene.add(enemyBase.mesh);

  // Rebuild one side's base mesh for its new age (keep position, HP, damage).
  function rebuildBase(side) {
    const isPlayer = side === 'player';
    const old = isPlayer ? playerBase : enemyBase;
    const base = isPlayer ? sim.playerBase : sim.enemyBase;
    const age = isPlayer ? sim.currentAge : sim.enemyAge;
    scene.remove(old.mesh);
    old.dispose();
    const next = BaseMesh(side, age);
    next.mesh.position.set(toMeters(base.x), 0, 0);
    next.setHp(base.hp / base.maxHp);
    scene.add(next.mesh);
    if (isPlayer) playerBase = next;
    else enemyBase = next;
  }

  const camGoal = new THREE.Vector3(12, 7, 17);
  const lookGoal = new THREE.Vector3(12, 1.5, 0);
  let camInit = false;
  // Combat focus: recent hit/death positions pull the camera toward the
  // action; decays back to the unit-midpoint fallback when combat goes quiet.
  let focusX = CONFIG.WORLD.WIDTH / 2;
  let focusTtl = 0;
  // Screen shake + scorch decals: render-only combat feel.
  let shakeT = 0, shakeDur = 1, shakeAmp = 0;
  function shake(amp, dur) { shakeAmp = amp; shakeT = shakeDur = dur; }
  const scorchGeo = new THREE.CircleGeometry(1.1, 14);
  const scorches = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(scorchGeo, new THREE.MeshBasicMaterial({
      color: '#0a0a0a', transparent: true, opacity: 0,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.08;
    m.visible = false;
    m.renderOrder = 1;
    scene.add(m);
    scorches.push({ mesh: m, ttl: 0 });
  }
  let scorchCursor = 0;
  function scorchAt(px, z) {
    const sc = scorches[scorchCursor];
    scorchCursor = (scorchCursor + 1) % scorches.length;
    sc.mesh.position.x = toMeters(px);
    sc.mesh.position.z = z || 0;
    sc.mesh.visible = true;
    sc.mesh.material.opacity = 0.55;
    sc.ttl = 9;
  }

  function burstAt(px, z, color, count, label, labelColor) {
    const mx = toMeters(px);
    fx.burst(mx, 1.2, z || 0, { color, count });
    if (label !== undefined) fx.damageNumber(mx, 2.4, z || 0, String(label), labelColor || '#ffd34d');
  }

  // Sim emits with single-payload convention; EventBus passes it through.
  const bus = sim.events;
  const unsubs = [];
  if (bus && bus.on) {
    unsubs.push(bus.on('projectile:fire', (src) => {
      if (src && src.turretIndex !== undefined) {
        const tm = turrets.get(src.id);
        if (tm) tm.fire();
      }
    }));
    unsubs.push(bus.on('projectile:hit', (hit) => {
      if (hit && hit.entity) {
        focusX = hit.entity.x;
        focusTtl = Math.max(focusTtl, 1.2);
      }
      if (!hit || !hit.entity) return;
      const e = hit.entity;
      if (hit.melee) {
        // Melee clash: pale sparks instead of the side-colored ranged burst.
        burstAt(e.x, e.z || 0, '#ffe9a8', 6);
        return;
      }
      const color = e.side === 'player' ? '#5aa0ff' : '#ff6a5a';
      burstAt(e.x, e.z || 0, hit.special ? '#ff8800' : color, hit.special ? 30 : 10, hit.damage);
    }));
    unsubs.push(bus.on('entity:death', (e) => {
      if (!e) return;
      focusX = e.x;
      focusTtl = Math.max(focusTtl, 2.5);
      if (e.maxHp >= 1200) shake(0.22, 0.35); // heavy deaths thump
      const color = e.side === 'player' ? '#4a8af4' : '#f44a4a';
      burstAt(e.x, e.z || 0, color, 22);
      if (e instanceof Unit) burstAt(e.x, (e.z || 0) + 0.3, '#ffe98a', 6, `+${e.goldReward}`, '#ffe98a');
    }));
    // Special-attack FX per age: { volleys, count, colors, staggerMs }.
    // Future ages add one table row. Rendering-only; Math.random() allowed.
    const SPECIAL_FX = {
      4: { n: 20, count: 44, colors: ['#66ffff', '#ffffff'], stagger: 80 }, // Orbital Laser
      3: { n: 18, count: 40, colors: ['#ffffff', '#ffb347'], stagger: 90 }, // Airstrike
      2: { n: 16, count: 34, colors: ['#ff5500', '#ffaa33'], stagger: 110 }, // Artillery
      1: { n: 14, count: 16, colors: ['#fff2c0', '#ffd34d'], stagger: 120 }, // Arrow Volley
      0: { n: 10, count: 26, colors: ['#ff8800', '#ffcc66'], stagger: 130 }, // Meteor Shower
    };
    unsubs.push(bus.on('special:activate', ({ side, ageIndex }) => {
      const fx = SPECIAL_FX[ageIndex] || SPECIAL_FX[0];
      shake(0.45, 0.7);
      const enemyHalf = side === 'player';
      for (let i = 0; i < fx.n; i++) {
        const px = enemyHalf
          ? CONFIG.WORLD.WIDTH * (0.55 + Math.random() * 0.4)
          : CONFIG.WORLD.WIDTH * (0.05 + Math.random() * 0.4);
        setTimeout(() => {
          const pz = (Math.random() * 2 - 1) * 1.6;
          burstAt(px, pz, i % 2 ? fx.colors[0] : fx.colors[1], fx.count);
          scorchAt(px, pz);
        }, i * fx.stagger);
      }
    }));
    unsubs.push(bus.on('age:evolve', ({ side, ageIndex }) => {
      // World mood follows the player; each side's base rebuilds for its age.
      if (side === 'player') {
        const world = window.__world;
        world?.terrain?.setAge?.(ageIndex);
        world?.lighting?.setAge?.(ageIndex);
        world?.environment?.setAge?.(ageIndex);
        try { sim.audio?.updateMusicAge?.(ageIndex); } catch { /* cosmetic */ }
      }
      rebuildBase(side);
    }));
  }

  function syncMap(map, list, create) {
    const alive = new Set();
    for (const e of list) {
      alive.add(e.id);
      let w = map.get(e.id);
      if (!w) {
        w = create(e);
        map.set(e.id, w);
        scene.add(w.mesh);
      }
      w.ref = e;
    }
    for (const [id, w] of map) {
      if (!alive.has(id)) {
        scene.remove(w.mesh);
        w.dispose();
        map.delete(id);
      }
    }
  }

  function update(dt) {
    if (!sim.paused) sim.update(dt * (sim.gameSpeed || 1));

    syncMap(units, sim.units, (e) => {
      const um = UnitMesh(e, e.ageIndex);
      return { mesh: um.mesh, dispose: () => um.dispose(), update: (d) => um.update(d, e) };
    });
    syncMap(turrets, sim.turrets, (e) => {
      const tm = TurretMesh(e, e.ageIndex);
      return { mesh: tm.mesh, dispose: () => tm.dispose(), ref: e, tm,
        update: (d) => {
          // Track the nearest living enemy unit in range for the barrel yaw.
          let best = null;
          let bestD = Infinity;
          for (const u of sim.units) {
            if (!u.alive || u.side === e.side) continue;
            const dx = u.x - e.x;
            if (Math.abs(dx) < bestD && Math.abs(dx) <= e.range) { bestD = Math.abs(dx); best = u; }
          }
          if (best) tm.aimAt(toMeters(best.x), 1.4, best.z || 0);
          tm.update(d);
        },
        fire: () => tm.fire() };
    });
    syncMap(buildings, sim.buildings, (e) => {
      const bm = BuildingMesh(e);
      return { mesh: bm.mesh, dispose: () => bm.dispose(), update: (d) => bm.update(d) };
    });

    // Projectiles: sim pool objects are recycled, keyed by id which reallocs
    // on init, so stale meshes still age out via the alive-set pass.
    const aliveProj = new Set();
    for (const p of sim.projectilePool.active) {
      aliveProj.add(p.id);
      let w = projectiles.get(p.id);
      if (!w) {
        const pm = ProjectileMesh(p.kind || 'rock');
        w = { mesh: pm.mesh, dispose: () => pm.dispose(), update: (d) => pm.update(d) };
        projectiles.set(p.id, w);
        scene.add(w.mesh);
      }
      w.mesh.position.set(toMeters(p.x), projHeight(p), 0);
      w.update(dt);
    }
    for (const [id, w] of projectiles) {
      if (!aliveProj.has(id)) {
        scene.remove(w.mesh);
        w.dispose();
        projectiles.delete(id);
      }
    }

    for (const [, w] of units) w.update(dt);
    for (const [, w] of turrets) w.update(dt);
    for (const [, w] of buildings) w.update(dt);

    playerBase.setHp(sim.playerBase.hp / sim.playerBase.maxHp);
    enemyBase.setHp(sim.enemyBase.hp / sim.enemyBase.maxHp);
    playerBase.update(dt);
    enemyBase.update(dt);

    // Camera tracks combat: recent hits/deaths outweigh the unit midpoint,
    // which remains the fallback when combat goes quiet. Clamped to the lane.
    let minX = sim.playerBase.x;
    let maxX = sim.enemyBase.x;
    let seen = false;
    for (const u of sim.units) {
      if (!u.alive) continue;
      if (!seen) { minX = maxX = u.x; seen = true; }
      else {
        if (u.x < minX) minX = u.x;
        if (u.x > maxX) maxX = u.x;
      }
    }
    const midPx = seen ? (minX + maxX) / 2 : CONFIG.WORLD.WIDTH / 2;
    const spreadPx = seen ? (maxX - minX) : CONFIG.WORLD.WIDTH;
    focusTtl = Math.max(0, focusTtl - dt);
    const anchorPx = focusTtl > 0 ? focusX * 0.65 + midPx * 0.35 : midPx;
    const midM = toMeters(anchorPx);
    const dist = THREE.MathUtils.clamp(11 + toMeters(spreadPx) * 0.9, 13, 26);
    camGoal.set(
      THREE.MathUtils.clamp(midM, 5, 19),
      THREE.MathUtils.clamp(4.5 + toMeters(spreadPx) * 0.35, 5, 11),
      dist,
    );
    lookGoal.set(THREE.MathUtils.clamp(midM, 5, 19), 1.5, 0);
    const cam = game.camera;
    if (!camInit) {
      cam.position.copy(camGoal);
      cam.lookAt(lookGoal);
      camInit = true;
    } else if (Math.abs(camGoal.x - cam.position.x) > 9) {
      // Far jump (e.g. action flared on the other half): snap, don't pan.
      cam.position.copy(camGoal);
      cam.lookAt(lookGoal);
    } else {
      const k = Math.min(1, dt * (focusTtl > 0 ? 3.0 : 2.0));
      cam.position.lerp(camGoal, k);
      const cur = new THREE.Vector3();
      cam.getWorldDirection(cur);
      cur.multiplyScalar(10).add(cam.position);
      cur.lerp(lookGoal, k);
      cam.lookAt(cur);
    }
    // Screen shake: decayed offset on top of the follow position.
    if (shakeT > 0) {
      shakeT = Math.max(0, shakeT - dt);
      const s = shakeAmp * (shakeT / shakeDur);
      cam.position.x += (Math.random() * 2 - 1) * s;
      cam.position.y += (Math.random() * 2 - 1) * s * 0.6;
    }
    // Scorch decals fade over ~9s.
    for (const sc of scorches) {
      if (sc.ttl <= 0) continue;
      sc.ttl -= dt;
      if (sc.ttl <= 0) { sc.mesh.visible = false; continue; }
      sc.mesh.material.opacity = Math.min(0.55, sc.ttl * 0.12);
    }
  }

  game.onUpdate(update);

  return {
    dispose() {
      for (const u of unsubs) u();
      for (const [, w] of units) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of turrets) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of buildings) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of projectiles) { scene.remove(w.mesh); w.dispose(); }
      for (const sc of scorches) scene.remove(sc.mesh);
      scorchGeo.dispose();
      scene.remove(playerBase.mesh);
      scene.remove(enemyBase.mesh);
      playerBase.dispose();
      enemyBase.dispose();
    },
  };
}
