import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { UnitMesh } from '../units/units.js';
import { getQuatTemplates } from '../units/gltf-cast.js';
import { Unit } from '../simulation/entities.js';
import { CONFIG } from '../simulation/config.js';
import { makeNameTag } from '../core/pbr.js';
import { galleryRoster, lineupX } from './roster.js';
import { createPhasePlayer } from './player.js';
import { toBattle } from './nav.js';

// Gallery showcase (?showcase=gallery): every age's cast lined up with
// name tags, drag-orbit camera, click-to-focus, and a panel driving ages,
// Walk/Attack/Idle clips, and the unit list. Keys 1-5 switch age.
export function runShowcase(game) {
  let age = 0;
  let lineup = [];
  let quatSwapped = false;
  const player = createPhasePlayer();
  const canvas = document.getElementById('gameCanvas');
  const controls = new OrbitControls(game.camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  if (window.__hud?.el) window.__hud.el.style.display = 'none';

  const panel = document.createElement('div');
  panel.className = 'aow-panel aow-gallery';
  document.body.appendChild(panel);

  function lineupCenter() {
    if (!lineup.length) return new THREE.Vector3(9, 1, 0);
    const c = new THREE.Vector3();
    for (const { um } of lineup) c.add(um.mesh.position);
    return c.multiplyScalar(1 / lineup.length).add(new THREE.Vector3(0, 1, 0));
  }

  function placeCamera(center, dist = 11) {
    const off = game.camera.position.clone().sub(controls.target);
    if (off.lengthSq() < 1e-4) off.set(5.5, 3.2, 8.5);
    off.setLength(dist);
    controls.target.copy(center);
    game.camera.position.copy(center).add(off);
  }

  function focus(i, dist = 7) {
    const slot = lineup[i];
    if (!slot) return;
    placeCamera(slot.um.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), dist);
    for (const b of panel.querySelectorAll('[data-gunit]')) {
      b.classList.toggle('aow-active', Number(b.dataset.gunit) === i);
    }
  }

  function triggerAttack() {
    for (const { e } of lineup) e.attackCooldown = 2.0;
  }

  function build() {
    for (const { um } of lineup) {
      game.scene.remove(um.mesh);
      um.dispose();
    }
    lineup = [];
    galleryRoster(age).forEach((slot, i) => {
      const def = slot.isHero ? CONFIG.AGES[age].hero : CONFIG.AGES[age].units[slot.unitIndex];
      const e = new Unit(lineupX(i), def.hp, 'player', age, slot.isHero ? 0 : slot.unitIndex, 0, slot.isHero, 0);
      const um = UnitMesh(e, age);
      um.update(0, e); // sync mesh position before Box3/center math
      const tag = makeNameTag(slot.label);
      const box = new THREE.Box3().setFromObject(um.mesh);
      tag.position.set(0, box.max.y - um.mesh.position.y + 0.5, 0);
      um.mesh.add(tag);
      game.scene.add(um.mesh);
      lineup.push({ e, um });
    });
    quatSwapped = !!getQuatTemplates();
    placeCamera(lineupCenter());
    window.__galleryUnits = lineup; // probe handle, same idiom as __game3d
    document.title = `${CONFIG.AGES[age].name} — gallery (1-5 to switch)`;
    renderPanel();
  }

  function renderPanel() {
    const ages = CONFIG.AGES.map((a, i) =>
      `<button class="aow-btn${i === age ? ' aow-active' : ''}" data-gage="${i}">${a.name}</button>`).join('');
    const clips = ['Walk', 'Attack', 'Idle'].map((c, i) =>
      `<button class="aow-btn${!player.auto && player.phase === i ? ' aow-active' : ''}" data-gclip="${i}">${c}</button>`).join('') +
      `<button class="aow-btn${player.auto ? ' aow-active' : ''}" data-gclip="auto">Auto</button>`;
    const units = galleryRoster(age).map((s, i) =>
      `<button class="aow-btn" data-gunit="${i}">${s.label}</button>`).join('');
    panel.innerHTML = `<h2>${CONFIG.AGES[age].name}</h2>
      <div class="aow-grow">${ages}</div>
      <div class="aow-grow">${clips}</div>
      <div class="aow-grow">${units}</div>
      <button class="aow-btn" data-gback>← Back to battle</button>`;
  }

  panel.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-gage],[data-gclip],[data-gunit],[data-gback]');
    if (!btn) return;
    if (btn.dataset.gage !== undefined) {
      const n = Number(btn.dataset.gage);
      if (n !== age) { age = n; build(); }
    } else if (btn.dataset.gclip !== undefined) {
      if (btn.dataset.gclip === 'auto') player.setAuto(true);
      else {
        player.setPhase(Number(btn.dataset.gclip));
        if (player.phase === 1) triggerAttack();
      }
      renderPanel();
    } else if (btn.dataset.gunit !== undefined) {
      focus(Number(btn.dataset.gunit));
    } else {
      location.href = toBattle(location.href);
    }
  });

  // Click (not drag) focuses the picked unit: OrbitControls eats the drag,
  // so only a near-stationary press counts as a pick.
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let downX = 0;
  let downY = 0;
  canvas.addEventListener('pointerdown', (ev) => { downX = ev.clientX; downY = ev.clientY; });
  canvas.addEventListener('pointerup', (ev) => {
    if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 6) return;
    ptr.set((ev.clientX / canvas.clientWidth) * 2 - 1, -(ev.clientY / canvas.clientHeight) * 2 + 1);
    ray.setFromCamera(ptr, game.camera);
    const hits = ray.intersectObjects(lineup.map(({ um }) => um.mesh), true);
    if (!hits.length) return;
    let o = hits[0].object;
    while (o && !lineup.some(({ um }) => um.mesh === o)) o = o.parent;
    const i = lineup.findIndex(({ um }) => um.mesh === o);
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
    if (!quatSwapped && getQuatTemplates()) build();
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
    controls.update();
  });
}
