import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnitMesh } from '../units/units.js';
import { getQuatTemplates } from '../units/gltf-cast.js';
import { TurretMesh } from '../turrets/turrets.js';
import { TowerMesh } from '../turrets/tower.js';
import { BaseMesh } from '../bases/bases.js';
import { Unit } from '../simulation/entities.js';
import { CONFIG } from '../simulation/config.js';
import { makeNameTag } from '../core/pbr.js';
import { galleryRoster, galleryTurrets, GALLERY_CATEGORIES, lineupX } from './roster.js';
import { createPhasePlayer } from './player.js';
import { toBattle } from './nav.js';

// Gallery showcase (?showcase=gallery): every age's arsenal on parade.
// Categories: units (marching lineup, Walk/Attack/Idle cycling), turrets
// (both side towers with all three guns seated, aiming + firing), bases
// (player vs enemy with a damage-state cycler), world (the age's terrain,
// environment and lighting with an empty stage). Keys 1-5 switch age.
// The ambient world follows the gallery age so casts parade in their own mood.
const CATS = GALLERY_CATEGORIES;
const HP_STEPS = [1, 0.5, 0.2];

export function runShowcase(game) {
  let age = 0;
  let cat = 'units';
  let hpStep = 0;
  let staged = [];
  let focusables = [];
  let quatSwapped = false;
  let fireT = 0;
  const player = createPhasePlayer();
  const canvas = document.getElementById('gameCanvas');
  const controls = new OrbitControls(game.camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });
  if (window.__hud?.el) window.__hud.el.style.display = 'none';

  const panel = document.createElement('div');
  panel.className = 'aow-panel aow-gallery';
  document.body.appendChild(panel);

  function stageCenter() {
    if (!focusables.length) return new THREE.Vector3(12, 1, 0);
    const c = new THREE.Vector3();
    for (const o of focusables) c.add(o.getWorldPosition(new THREE.Vector3()));
    return c.multiplyScalar(1 / focusables.length);
  }

  function placeCamera(center, dist = 11) {
    const off = game.camera.position.clone().sub(controls.target);
    if (off.lengthSq() < 1e-4) off.set(5.5, 3.2, 8.5);
    off.setLength(dist);
    controls.target.copy(center);
    game.camera.position.copy(center).add(off);
  }

  function focus(i, dist = 7) {
    const o = focusables[i];
    if (!o) return;
    placeCamera(o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1, 0)), dist);
    for (const b of panel.querySelectorAll('[data-gunit]')) {
      b.classList.toggle('aow-active', Number(b.dataset.gunit) === i);
    }
  }

  function tag(obj, label, lift = 0.5) {
    const tag = makeNameTag(label);
    const box = new THREE.Box3().setFromObject(obj);
    tag.position.set(0, box.max.y + lift, 0);
    // Tag rides the object: parent under it in local space.
    obj.updateMatrixWorld(true);
    obj.add(tag);
    tag.position.y -= obj.position.y;
    return tag;
  }

  function clear() {
    for (const s of staged) {
      game.scene.remove(s.mesh);
      s.dispose?.();
    }
    staged = [];
    focusables = [];
  }

  function syncWorld() {
    const w = window.__world;
    if (!w) return;
    try { w.terrain.setAge(age); } catch {}
    try { w.environment.setAge(age); } catch {}
    try { w.lighting.setAge(age); } catch {}
  }

  function buildUnits() {
    const lineup = [];
    galleryRoster(age).forEach((slot, i) => {
      const def = slot.isHero ? CONFIG.AGES[age].hero : CONFIG.AGES[age].units[slot.unitIndex];
      const e = new Unit(lineupX(i), def.hp, 'player', age, slot.isHero ? 0 : slot.unitIndex, 0, slot.isHero, 0);
      const um = UnitMesh(e, age);
      um.update(0, e);
      tag(um.mesh, slot.label);
      game.scene.add(um.mesh);
      lineup.push({ e, um });
      staged.push(um);
      focusables.push(um.mesh);
    });
    quatSwapped = !!getQuatTemplates();
    window.__galleryUnits = lineup;
    return lineup;
  }

  function buildTurrets() {
    const guns = [];
    const towers = [];
    for (const side of ['player', 'enemy']) {
      const tower = TowerMesh(side, age);
      tower.mesh.position.set(side === 'player' ? 4 : 20, 0, 0);
      game.scene.add(tower.mesh);
      staged.push(tower);
      towers.push(tower);
      galleryTurrets(age).forEach((slot, i) => {
        const tur = {
          side, turretIndex: slot.turretIndex, x: 0, z: 0,
          hp: 100, maxHp: 100, alive: true, hitFlash: 0,
        };
        const tm = TurretMesh(tur, age, tower.mount(i));
        tag(tm.mesh, slot.label, 0.7);
        game.scene.add(tm.mesh);
        guns.push({ tur, tm, phase: i * 1.3 });
        staged.push({ mesh: tm.mesh, dispose: () => tm.dispose() });
        focusables.push(tm.mesh);
      });
    }
    window.__galleryUnits = [];
    return { guns, towers };
  }

  function buildBases() {
    const bases = [];
    for (const side of ['player', 'enemy']) {
      const b = BaseMesh(side, age);
      b.mesh.position.set(side === 'player' ? 5 : 19, 0, 0);
      b.setHp(HP_STEPS[hpStep]);
      game.scene.add(b.mesh);
      staged.push(b);
      focusables.push(b.mesh);
      bases.push(b);
    }
    tag(bases[0].mesh, `${CONFIG.AGES[age].name} base`, 0.6);
    tag(bases[1].mesh, 'Enemy base', 0.6);
    window.__galleryUnits = [];
    return bases;
  }

  let lineup = [];
  let guns = [];
  let towers = [];
  let bases = [];

  function triggerAttack() {
    for (const { e } of lineup) e.attackCooldown = 2.0;
  }

  function build() {
    clear();
    syncWorld();
    lineup = [];
    guns = [];
    towers = [];
    bases = [];
    if (cat === 'units') lineup = buildUnits();
    else if (cat === 'turrets') ({ guns, towers } = buildTurrets());
    else if (cat === 'bases') bases = buildBases();
    const dist = cat === 'units' ? 13 : cat === 'turrets' ? 22 : 26;
    placeCamera(stageCenter(), dist);
    document.title = `${CONFIG.AGES[age].name} — gallery ${cat} (1-5 to switch)`;
    renderPanel();
  }

  function renderPanel() {
    const cats = CATS.map((c) =>
      `<button class="aow-btn${c === cat ? ' aow-active' : ''}" data-gcat="${c}">${c[0].toUpperCase() + c.slice(1)}</button>`).join('');
    const ages = CONFIG.AGES.map((a, i) =>
      `<button class="aow-btn${i === age ? ' aow-active' : ''}" data-gage="${i}">${a.name}</button>`).join('');
    let ctx = '';
    if (cat === 'units') {
      ctx = ['Walk', 'Attack', 'Idle'].map((c, i) =>
        `<button class="aow-btn${!player.auto && player.phase === i ? ' aow-active' : ''}" data-gclip="${i}">${c}</button>`).join('') +
        `<button class="aow-btn${player.auto ? ' aow-active' : ''}" data-gclip="auto">Auto</button>`;
    } else if (cat === 'bases') {
      ctx = HP_STEPS.map((h, i) =>
        `<button class="aow-btn${i === hpStep ? ' aow-active' : ''}" data-ghp="${i}">HP ${Math.round(h * 100)}%</button>`).join('');
    }
    const items = focusables.map((_, i) => {
      const label = cat === 'units'
        ? galleryRoster(age)[i]?.label ?? i
        : cat === 'turrets'
          ? galleryTurrets(age)[i % galleryTurrets(age).length]?.label ?? i
          : cat === 'bases' ? (i === 0 ? 'Player' : 'Enemy') : i;
      return `<button class="aow-btn" data-gunit="${i}">${label}</button>`;
    }).join('');
    panel.innerHTML = `<h2>${CONFIG.AGES[age].name}</h2>
      <div class="aow-grow">${cats}</div>
      <div class="aow-grow">${ages}</div>
      ${ctx ? `<div class="aow-grow">${ctx}</div>` : ''}
      <div class="aow-grow">${items}</div>
      <button class="aow-btn" data-gback>← Back to battle</button>`;
  }

  panel.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-gcat],[data-gage],[data-gclip],[data-ghp],[data-gunit],[data-gback]');
    if (!btn) return;
    if (btn.dataset.gcat !== undefined) {
      if (btn.dataset.gcat !== cat) { cat = btn.dataset.gcat; build(); }
    } else if (btn.dataset.gage !== undefined) {
      const n = Number(btn.dataset.gage);
      if (n !== age) { age = n; build(); }
    } else if (btn.dataset.gclip !== undefined) {
      if (btn.dataset.gclip === 'auto') player.setAuto(true);
      else {
        player.setPhase(Number(btn.dataset.gclip));
        if (player.phase === 1) triggerAttack();
      }
      renderPanel();
    } else if (btn.dataset.ghp !== undefined) {
      hpStep = Number(btn.dataset.ghp);
      for (const b of bases) b.setHp(HP_STEPS[hpStep]);
      renderPanel();
    } else if (btn.dataset.gunit !== undefined) {
      focus(Number(btn.dataset.gunit));
    } else {
      location.href = toBattle(location.href);
    }
  });

  // Click (not drag) focuses the picked staged object: OrbitControls eats
  // the drag, so only a near-stationary press counts as a pick.
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let downX = 0;
  let downY = 0;
  canvas.addEventListener('pointerdown', (ev) => { downX = ev.clientX; downY = ev.clientY; });
  canvas.addEventListener('pointerup', (ev) => {
    if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return;
    ptr.set((ev.clientX / canvas.clientWidth) * 2 - 1, -(ev.clientY / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ptr, game.camera);
    const roots = focusables;
    const hits = ray.intersectObjects(roots, true);
    if (!hits.length) return;
    let o = hits[0].object;
    while (o && !roots.includes(o)) o = o.parent;
    const i = roots.indexOf(o);
    if (i >= 0) focus(i);
  });

  window.addEventListener('keydown', (ev) => {
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= CONFIG.AGES.length && n - 1 !== age) {
      age = n - 1;
      build();
    }
  });

  build();
  const startPhase = player.phase;
  if (startPhase === 1) triggerAttack();

  // walk 3s -> attack 2s -> idle 2s, looping so every clip shows.
  game.onUpdate((dt) => {
    if (cat === 'units' && !quatSwapped && getQuatTemplates()) build();
    const before = player.phase;
    player.update(dt);
    if (player.phase !== before && player.phase === 1) triggerAttack();
    if (player.phase !== before) renderPanel();
    for (const { e, um } of lineup) {
      if (player.phase === 0) e.walkPhase += dt * 6;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      um.update(dt, e);
      um.mesh.rotation.y = -Math.PI / 2; // face the camera, not the lane
    }
    if (guns.length) {
      fireT += dt;
      const t = fireT;
      for (const g of guns) {
        // Slow tracking sweep across the lane; staggered shots show recoil.
        g.tm.aimAt(12 + Math.sin(t * 0.5 + g.phase) * 8, 1.5, Math.cos(t * 0.35 + g.phase) * 4);
        g.tm.update(dt);
        if ((t + g.phase) % 4 < dt) {
          try { g.tm.fire(); } catch {}
        }
      }
    }
    for (const b of bases) b.update(dt);
    for (const tw of towers) tw.update(dt);
    controls.update();
  });
}
