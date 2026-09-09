// BattleView: syncs BattleSim state to Three.js meshes each frame.
// Meshes are keyed by sim entity id; meshes self-position from their entity
// (UnitMesh/TurretMesh update()), so this layer only creates, updates and
// disposes them, plus combat FX, camera follow and base HP.
//
// Contract: attachBattleView(game, sim, fx, { lockCamera }) -> { dispose() }
// Registers ONE game.onUpdate (unsubscribed on dispose) that steps the sim
// first, then syncs. Owns age transitions: on age:evolve it re-moods the
// shared world to the player's age, rebuilds the evolved side's base, and
// switches the music. lockCamera leaves a ?camera= debug preset untouched.

import * as THREE from 'three';
import { CONFIG, toMeters } from '../simulation/config.js';
import { Unit } from '../simulation/entities.js';
import { UnitMesh } from '../units/units.js';
import { loadQuatCastOnce, getQuatTemplates } from '../units/gltf-cast.js';
import { BaseMesh } from '../bases/bases.js';
import { TurretMesh } from '../turrets/turrets.js';
import { TowerMesh } from '../turrets/tower.js';
import { BuildingMesh } from '../buildings/buildings.js';
import { ProjectileMesh } from '../projectiles/projectiles.js';
import { createGoldAggregator } from './gold-agg.js';

export { applyBattleAction } from './actions.js';

const PROJ_HEIGHT = 1.1;

function projHeight(p) {
  return (CONFIG.GROUND_Y - p.y) * 0.01 + PROJ_HEIGHT;
}

export function attachBattleView(game, sim, fx, opts = {}) {
  const scene = game.scene;
  // lockCamera (?camera= debug preset): leave the camera alone entirely.
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

  // One shared outpost tower per side; turret meshes seat on its mounts.
  // Tower x follows the sim turret-line x so combat math and visuals agree.
  const towers = {};
  for (const side of ['player', 'enemy']) {
    const tw = TowerMesh(side, sim.currentAge);
    const slots = side === 'player' ? sim.turretSlotPositions : sim.enemyTurretSlotPositions;
    tw.mesh.position.set(toMeters(slots?.[0]?.x ?? sim.playerBase.x), 0, 0);
    scene.add(tw.mesh);
    towers[side] = tw;
  }

  // Stone-age CC0 cast: loads once in the background (shared with
  // showcases via loadQuatCastOnce); age-0 units created before it lands
  // are swapped to skeletal meshes on arrival (quatSwap in update).
  // A failed fetch simply keeps the procedural rigs.
  let quatSwapped = false;
  loadQuatCastOnce();

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
  // Screen shake + hit-stop + scorch decals: render-only combat feel.
  // hitStop freezes sim time for milliseconds on heavy impacts (impact frame).
  let shakeT = 0, shakeDur = 1, shakeAmp = 0;
  function shake(amp, dur) { shakeAmp = amp; shakeT = shakeDur = dur; }
  let hitStop = 0;
  let siegeT = 0;
  // Kill gold aggregates per side over a short window so mass kills flush
  // one "+N" number instead of a wall of overlapping labels.
  const goldAgg = createGoldAggregator(0.6);
  const _muzzle = new THREE.Vector3();
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
    if (!fx || !fx.burst) return;
    const mx = toMeters(px);
    fx.burst(mx, 1.2, z || 0, { color, count });
    if (label !== undefined && fx.damageNumber) {
      fx.damageNumber(mx, 2.4, z || 0, String(label), labelColor || '#ffd34d');
    }
  }

  // Sim emits with single-payload convention; EventBus passes it through.
  const bus = sim.events;
  const unsubs = [];
  // Pending special-attack FX timers; cleared on restart/dispose so FX never
  // leaks into the next game or a removed scene.
  const specialTimers = [];
  if (bus && bus.on) {
    unsubs.push(bus.on('projectile:fire', (src) => {
      if (src && src.turretIndex !== undefined) {
        const tm = turrets.get(src.id);
        if (tm) {
          tm.fire();
          // muzzle smoke + flash sparks at the barrel tip (world meters).
          try {
            tm.tm?.muzzle?.getWorldPosition(_muzzle);
            if (fx?.burst) {
              fx.burst(_muzzle.x, _muzzle.y, _muzzle.z, { color: 0xffd98a, count: 8, speed: 3, life: 0.35 });
              fx.burst(_muzzle.x, _muzzle.y, _muzzle.z, { color: 0x8a8a8a, count: 5, speed: 1.2, life: 0.9, up: 1.2 });
            }
          } catch { /* cosmetic */ }
        }
      }
    }));
    unsubs.push(bus.on('projectile:hit', (hit) => {
      if (!hit) return;
      if (hit.melee) {
        // Melee clash: spark snap + dust kick at the attacker.
        const a = hit.attacker;
        if (a) {
          focusX = a.x;
          focusTtl = Math.max(focusTtl, 1.2);
          burstAt(a.x, a.z || 0, '#ffe9a8', 10);
          burstAt(a.x, a.z || 0, '#9a8a72', 5);
        }
        return;
      }
      if (hit.entity) {
        focusX = hit.entity.x;
        focusTtl = Math.max(focusTtl, 1.2);
      } else {
        return;
      }
      const e = hit.entity;
      const color = e.side === 'player' ? '#5aa0ff' : '#ff6a5a';
      burstAt(e.x, e.z || 0, hit.special ? '#ff8800' : color, hit.special ? 30 : 10, hit.damage);
      if (e instanceof Unit) {
        // Flesh reads wet, armor reads bright: blood mist on soft targets,
        // a white-hot spark snap on plate, siege and heroes.
        const plated = e.isHero || e.type === 'armored' || e.type === 'siege' || e.type === 'elite';
        if (plated) burstAt(e.x, (e.z || 0) + 0.3, '#fff2c8', 12);
        else burstAt(e.x, (e.z || 0) + 0.2, '#a02323', 8);
      } else {
        // Structures take chunks: gray debris + a dust kick at the base.
        burstAt(e.x, e.z || 0, '#8a8378', 8);
        burstAt(e.x, e.z || 0, '#5a5148', 5);
      }
      if (hit.special || (hit.damage !== undefined && hit.damage >= 80)) {
        hitStop = Math.max(hitStop, 0.06);
      }
    }));
    unsubs.push(bus.on('entity:death', (e) => {
      if (!e) return;
      focusX = e.x;
      focusTtl = Math.max(focusTtl, 2.5);
      if (e.maxHp >= 1200) { shake(0.22, 0.35); hitStop = Math.max(hitStop, 0.09); } // heavy deaths thump
      const color = e.side === 'player' ? '#4a8af4' : '#f44a4a';
      burstAt(e.x, e.z || 0, color, 22);
      if (e instanceof Unit) {
        burstAt(e.x, (e.z || 0) + 0.3, '#ffe98a', 6);
        goldAgg.add(e.side, e.goldReward, toMeters(e.x), e.z || 0);
      }
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
    unsubs.push(bus.on('special:activate', (evt = {}) => {
      const { side, ageIndex } = evt;
      const sfx = SPECIAL_FX[ageIndex] || SPECIAL_FX[0];
      shake(0.45, 0.7);
      const enemyHalf = side === 'player';
      for (let i = 0; i < sfx.n; i++) {
        const px = enemyHalf
          ? CONFIG.WORLD.WIDTH * (0.55 + Math.random() * 0.4)
          : CONFIG.WORLD.WIDTH * (0.05 + Math.random() * 0.4);
        specialTimers.push(setTimeout(() => {
          const pz = (Math.random() * 2 - 1) * 1.6;
          burstAt(px, pz, i % 2 ? sfx.colors[0] : sfx.colors[1], sfx.count);
          scorchAt(px, pz);
        }, i * sfx.stagger));
      }
    }));
    unsubs.push(bus.on('age:evolve', (evt = {}) => {
      const { side, ageIndex } = evt;
      if (!side) return;
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
    unsubs.push(bus.on('game:restart', () => {
      // Drop pending special FX, clear combat camera/decal state, rebuild
      // both bases for the reset ages, and restore the opening world mood.
      for (const id of specialTimers) clearTimeout(id);
      specialTimers.length = 0;
      focusX = CONFIG.WORLD.WIDTH / 2;
      focusTtl = 0;
      goldAgg.clear();
      shakeT = 0;
      shakeAmp = 0;
      hitStop = 0;
      for (const sc of scorches) { sc.ttl = 0; sc.mesh.visible = false; }
      rebuildBase('player');
      rebuildBase('enemy');
      const world = window.__world;
      world?.terrain?.setAge?.(sim.currentAge);
      world?.lighting?.setAge?.(sim.currentAge);
      world?.environment?.setAge?.(sim.currentAge);
    }));
    unsubs.push(bus.on('game:over', (evt = {}) => {
      // Losing base becomes the camera focus with a final thump.
      const loserBase = evt.winner === 'player' ? sim.enemyBase : sim.playerBase;
      if (loserBase) {
        focusX = loserBase.x;
        focusTtl = 4;
        shake(0.5, 0.9);
      }
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
    // hit-stop: freeze sim briefly while camera/FX keep running on real dt.
    let simDt = dt * (sim.gameSpeed || 1);
    if (hitStop > 0) {
      hitStop = Math.max(0, hitStop - dt);
      simDt *= 0.12;
    }
    if (!sim.paused) sim.update(simDt);
    // Aggregated kill-gold: one "+N" number per side per window.
    for (const f of goldAgg.poll(dt)) {
      if (fx && fx.goldNumber) fx.goldNumber(f.x, 2.4, f.z, `+${f.amount}`);
    }

    // The skeletal cast arrives after first spawn: drop pre-cast stone and
    // castle meshes once so syncMap recreates them from the live entities.
    if (!quatSwapped && getQuatTemplates()) {
      quatSwapped = true;
      for (const [id, w] of units) {
        if (w.ageIndex <= 1) { scene.remove(w.mesh); w.dispose(); units.delete(id); }
      }
    }
    syncMap(units, sim.units, (e) => {
      const um = UnitMesh(e, e.ageIndex);
      return { mesh: um.mesh, dispose: () => um.dispose(), update: (d) => um.update(d, e), ageIndex: e.ageIndex };
    });
    syncMap(turrets, sim.turrets, (e) => {
      const tm = TurretMesh(e, e.ageIndex, towers[e.side]?.mount(e.slotIndex));
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
      w.mesh.position.set(toMeters(p.x), projHeight(p), p.z || 0);
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
    towers.player?.update(dt);
    towers.enemy?.update(dt);

    // Siege smoke: battered bases (<50%) smolder, burning (<33%) trail embers.
    siegeT -= dt;
    if (siegeT <= 0) {
      siegeT = 0.45;
      for (const b of [sim.playerBase, sim.enemyBase]) {
        if (!b) continue;
        const frac = b.hp / b.maxHp;
        if (frac < 0.5 && fx?.burst) {
          const mx = toMeters(b.x);
          fx.burst(mx, 5.5, 0, { color: 0x555555, count: frac < 0.33 ? 6 : 3, speed: 1, life: 1.2, up: 2.2 });
          if (frac < 0.33) fx.burst(mx, 3.5, 0, { color: 0xff7733, count: 3, speed: 1.5, life: 0.5, up: 2 });
        }
      }
    }

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
    const fieldW = CONFIG.WORLD.WIDTH;
    const clusterPx = seen ? (minX + maxX) / 2 : fieldW / 2;
    const clusterW = seen ? (maxX - minX) : fieldW;
    // Idle opening: action bunched at one gate (or nothing spawned yet)
    // frames a wide mid-field vista instead of parking inside a base.
    const oneSided = seen && clusterW < fieldW * 0.25 &&
      (clusterPx < fieldW * 0.3 || clusterPx > fieldW * 0.7);
    focusTtl = Math.max(0, focusTtl - dt);
    const idle = focusTtl <= 0 && (!seen || oneSided);
    const midPx = idle ? fieldW / 2 : clusterPx;
    const spreadPx = idle ? fieldW : clusterW;
    const anchorPx = focusTtl > 0 ? focusX * 0.65 + midPx * 0.35 : midPx;
    const midM = toMeters(anchorPx);
    // Keep-out: near a base, rise above the rooftops and pull back so the
    // camera never sits inside base geometry during gate fights.
    const baseMs = [toMeters(sim.playerBase.x), toMeters(sim.enemyBase.x)];
    const nearBase = baseMs.some((bx) => Math.abs(midM - bx) < 7);
    const baseY = THREE.MathUtils.clamp(4.5 + toMeters(spreadPx) * 0.35, 5, 11);
    const dist = Math.max(
      THREE.MathUtils.clamp(11 + toMeters(spreadPx) * 0.9, 13, 26),
      nearBase ? 20 : 0,
    );
    camGoal.set(
      THREE.MathUtils.clamp(midM, 5, 19),
      nearBase ? Math.max(baseY, 9) : baseY,
      dist,
    );
    lookGoal.set(THREE.MathUtils.clamp(midM, 5, 19), 1.5, 0);
    const cam = game.camera;
    if (opts.lockCamera) {
      if (!camInit) { cam.lookAt(lookGoal); camInit = true; }
    } else if (!camInit) {
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

  const offUpdate = game.onUpdate(update);

  return {
    dispose() {
      offUpdate?.();
      for (const u of unsubs) u();
      for (const id of specialTimers) clearTimeout(id);
      specialTimers.length = 0;
      for (const [, w] of units) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of turrets) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of buildings) { scene.remove(w.mesh); w.dispose(); }
      for (const [, w] of projectiles) { scene.remove(w.mesh); w.dispose(); }
      for (const sc of scorches) { scene.remove(sc.mesh); sc.mesh.material.dispose(); }
      scorchGeo.dispose();
      scene.remove(playerBase.mesh);
      scene.remove(enemyBase.mesh);
      playerBase.dispose();
      enemyBase.dispose();
      for (const side of ['player', 'enemy']) {
        if (towers[side]) {
          scene.remove(towers[side].mesh);
          towers[side].dispose();
        }
      }
    },
  };
}
