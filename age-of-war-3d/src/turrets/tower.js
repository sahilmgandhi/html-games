import * as THREE from 'three';
import {
  pbr, basic, glowMat, glowSprite, solidify, disposeDeep, teamRing, SIDE_ACCENT,
  makeCloth, mergeStatic,
} from '../core/pbr.js';

// One shared outpost tower per side. All four turret slots of a side seat on
// this tower's deck mounts instead of sprawling as free-standing rigs in the
// lane, which fixes the old scattered/buried/oversized placement.
//
// Contract: TowerMesh(side, ageIndex) -> { mesh, mounts, mount(i), update(dt), dispose() }
//   mounts: four Object3D anchors in a 2x2 grid on the deck top.
//   mount(i): mounts[i] clamped to 0..3 so any slotIndex seats safely.
// The tower is age-agnostic by design (one silhouette for all five ages);
// ageIndex is accepted for API symmetry and future skins, and currently only
// tints the deck trim alongside the side accent.

const DECK_TOP = 4.675;

// Per-age palettes for the shared silhouette: the stone takes its mood
// from the age's stronghold so towers read native in every era.
const AGE_STONE = ['#8d8d94', '#6e6e76', '#c8a878', '#7a7a72', '#1c2940'];
const AGE_STONE_DK = ['#5e5e66', '#46464f', '#a85a3a', '#54544e', '#0d1522'];

export function TowerMesh(side, ageIndex) {
  const accent = SIDE_ACCENT[side] || SIDE_ACCENT.player;
  const skin = AGE_STONE[ageIndex] || AGE_STONE[0];
  const skinDk = AGE_STONE_DK[ageIndex] || AGE_STONE_DK[0];

  const mesh = new THREE.Group();
  const stone = pbr(skin, 0.95);
  const stoneDk = pbr(skinDk, 0.95);

  // stepped plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 3.6), stoneDk);
  plinth.position.y = 0.25;
  mesh.add(plinth);
  const step = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 3.0), stone);
  step.position.y = 0.7;
  mesh.add(step);

  // tapered square shaft + course bands
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.55, 3.4, 4), stone);
  shaft.rotation.y = Math.PI / 4;
  shaft.position.y = 2.65;
  mesh.add(shaft);
  for (const by of [1.6, 3.4]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 2.5), stoneDk);
    band.position.y = by;
    band.rotation.y = Math.PI / 4;
    mesh.add(band);
  }

  // corner quoins - alternating proud blocks so the tower reads as laid masonry
  for (let qi = 0; qi < 5; qi++) {
    const qy = 1.15 + qi * 0.95;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.36), (qi % 2 ? stone : stoneDk));
      q.position.set(sx * 1.62, qy, sz * 1.62);
      mesh.add(q);
    }
  }

  // arrow slit windows on the battlefield face, darkened as the tower falls
  const slitMat = basic('#14141c');
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const a = (i / 2) * 0.55;
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.14), slitMat);
    slit.position.set(1.62 * Math.cos(a), 1.9, Math.sin(a) * 1.7);
    slit.rotation.y = -a;
    mesh.add(slit);
  }

  // deck plate + side-color trim
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 4.4), stone);
  deck.position.y = DECK_TOP - 0.175;
  mesh.add(deck);
  // plank seams across the deck so guns don't sit on bare slab
  for (let i = -3; i <= 3; i++) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.02, 0.05), stoneDk);
    seam.position.set(0, DECK_TOP + 0.005, i * 0.6);
    mesh.add(seam);
  }
  const trimM = pbr(accent, 0.6);
  for (const s of [-1, 1]) {
    for (const horiz of [true, false]) {
      const trim = new THREE.Mesh(
        horiz ? new THREE.BoxGeometry(4.5, 0.12, 0.18) : new THREE.BoxGeometry(0.18, 0.12, 4.5),
        trimM);
      trim.position.set(horiz ? 0 : s * 2.15, DECK_TOP - 0.1, horiz ? s * 2.15 : 0);
      mesh.add(trim);
    }
  }

  // crenellated rim so the deck reads as a fighting top
  const merlonM = stoneDk;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const edge = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)) ? 'z' : 'x';
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), merlonM);
    m.position.set(
      edge === 'x' ? Math.sign(Math.cos(a)) * 2.05 : Math.sin(a) * 2.9,
      DECK_TOP + 0.2,
      edge === 'z' ? Math.sign(Math.sin(a)) * 2.05 : Math.cos(a) * 2.9);
    mesh.add(m);
  }

  // corner turrets on the crenellations
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8), stoneDk);
    turret.position.set(sx * 2.1, DECK_TOP + 0.6, sz * 2.2);
    mesh.add(turret);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 8), pbr(accent, 0.7));
    cap.position.set(sx * 2.1, DECK_TOP + 1.0, sz * 2.2);
    mesh.add(cap);
  }

  // banner pole + pennant + beacon at the rear corner
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), pbr('#4c3018', 0.9));
  pole.position.set(-1.7, DECK_TOP + 1.2, -1.7);
  mesh.add(pole);
  // pole guy-wires for stability
  for (const s of [-1, 1]) {
    const guy = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.5, 4), pbr('#3a2a1a', 0.7));
    guy.position.set(-1.7 + s * 0.15, DECK_TOP + 2.5, -1.7 + s * 0.15);
    guy.rotation.set(s * 0.3, 0, s * 0.3);
    mesh.add(guy);
  }
  // rippling pennant on the pole, hoist pinned: flat quads do not ship.
  const cloth = makeCloth(0.9, 0.5, 6, pbr(accent, 0.7));
  const pennant = cloth.mesh;
  pennant.position.set(-1.2, DECK_TOP + 2.0, -1.7);
  mesh.add(pennant);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat('#ffd23a', 1));
  beacon.position.set(-1.7, DECK_TOP + 2.5, -1.7);
  mesh.add(beacon);
  const halo = glowSprite('#ffd23a', 0.5, 1.4);
  halo.position.copy(beacon.position);
  mesh.add(halo);
  // beacon pulse light
  const beaconLight = new THREE.PointLight('#ffd23a', 1.2, 15, 2);
  beaconLight.position.copy(beacon.position);
  mesh.add(beaconLight);

  // four weapon mounts: 2x2 grid on the deck top, each seated in a
  // visible iron cradle so guns sit IN hardware, not on bare deck.
  const cradleM = pbr('#2e2e36', 0.6, 0.6);
  const mounts = [];
  for (const mx of [-0.7, 0.7]) {
    for (const mz of [-0.95, 0.95]) {
      const anchor = new THREE.Object3D();
      anchor.position.set(mx, DECK_TOP, mz);
      const cradle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 10), cradleM);
      cradle.position.y = -0.12;
      // cradle detail: recessed socket for the gun trunnion
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.15, 8), pbr('#1a1a1a', 0.5));
      socket.position.y = 0.02;
      anchor.add(cradle);
      anchor.add(socket);
      mesh.add(anchor);
      mounts.push(anchor);
    }
  }

  mesh.add(teamRing(3.4, accent));
  solidify(mesh);
  // Static shell merges; the pulsing beacon and rippling pennant stay live.
  mergeStatic(mesh, new Set([beacon, pennant]));
  mesh.rotation.y = side === 'player' ? 0 : Math.PI;

  let t = Math.random() * 10;
  return {
    mesh,
    mounts,
    mount(i) {
      const k = Number.isInteger(i) ? i : 0;
      return mounts[Math.min(Math.max(k, 0), mounts.length - 1)];
    },
    update(dt) {
      t += dt;
      const k = 0.75 + Math.sin(t * 3.1) * 0.25;
      halo.material.opacity = 0.35 + k * 0.25;
      beacon.scale.setScalar(0.9 + k * 0.2);
      // Pulsing beacon light
      beaconLight.intensity = 0.8 + k * 0.5;
      cloth.update(t);
    },
    dispose() {
      disposeDeep(mesh);
    },
  };
}
