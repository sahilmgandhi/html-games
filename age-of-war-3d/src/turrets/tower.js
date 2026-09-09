import * as THREE from 'three';
import {
  pbr, glowMat, glowSprite, solidify, disposeDeep, teamRing, SIDE_ACCENT,
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

export function TowerMesh(side, ageIndex) {
  const accent = SIDE_ACCENT[side] || SIDE_ACCENT.player;
  void ageIndex;

  const mesh = new THREE.Group();
  const stone = pbr('#8d8d94', 0.95);
  const stoneDk = pbr('#5e5e66', 0.95);

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

  // deck plate + side-color trim
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 4.4), stone);
  deck.position.y = DECK_TOP - 0.175;
  mesh.add(deck);
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

  // banner pole + pennant + beacon at the rear corner
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), pbr('#4c3018', 0.9));
  pole.position.set(-1.7, DECK_TOP + 1.2, -1.7);
  mesh.add(pole);
  const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.06), pbr(accent, 0.7));
  pennant.position.set(-1.2, DECK_TOP + 2.0, -1.7);
  mesh.add(pennant);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat('#ffd23a', 1));
  beacon.position.set(-1.7, DECK_TOP + 2.5, -1.7);
  mesh.add(beacon);
  const halo = glowSprite('#ffd23a', 0.5, 1.4);
  halo.position.copy(beacon.position);
  mesh.add(halo);

  // four weapon mounts: 2x2 grid on the deck top
  const mounts = [];
  for (const mx of [-0.7, 0.7]) {
    for (const mz of [-0.95, 0.95]) {
      const anchor = new THREE.Object3D();
      anchor.position.set(mx, DECK_TOP, mz);
      mesh.add(anchor);
      mounts.push(anchor);
    }
  }

  mesh.add(teamRing(3.4, accent));
  solidify(mesh);
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
    },
    dispose() {
      disposeDeep(mesh);
    },
  };
}
