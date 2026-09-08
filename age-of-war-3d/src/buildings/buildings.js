import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, glowMat, solidify, cloneMats, makeHpBar, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Economy structures (by buildingIndex):
//   0 Gold Mine — boulder mound with a timbered adit, gold seam + nugget pile,
//                 wooden ore cart and a pickaxe stuck in a stump.
//   1 Barracks  — two hide tents around a campfire, weapon rack and a tall
//                 war banner; green-cross pennant marks the healing aura.
//
// Contract: BuildingMesh(building) -> { mesh, dispose() }
// Extra: update(dt) drives banner ripple + fire flicker.

const WOOD = '#6e4a2c';
const WOOD_DK = '#4c3018';
const ROCK = '#7d7468';
const ROCK_DK = '#575046';
const GOLD = '#e8b53a';
const HIDE = '#a8763e';
const HIDE_DK = '#7d5527';

function rockGeo(r, squash = 1, seed = 1) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const w = 1 + 0.22 * Math.sin(pos.getX(i) * 4 + seed) * Math.cos(pos.getZ(i) * 3 + seed * 2);
    pos.setXYZ(i, pos.getX(i) * w, pos.getY(i) * w * squash, pos.getZ(i) * w);
  }
  g.computeVertexNormals();
  return g;
}

function buildMine(accent) {
  const root = new THREE.Group();
  // mound sits back; the works face the camera (+x/+z)
  const mound = new THREE.Mesh(rockGeo(1.8, 0.7, 1), pbr('#6a6055', 0.95));
  mound.position.set(-0.4, 0.7, -0.6);
  mound.scale.x = 1.2;
  root.add(mound);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(rockGeo(0.4 + (i % 3) * 0.2, 0.8, 2 + i), pbr(ROCK, 0.95));
    b.position.set(Math.cos(i * 2.2) * 2.4 - 0.4, 0.3, Math.sin(i * 2.2) * 1.7 - 0.4);
    root.add(b);
  }
  // timbered adit (mine mouth) on the mound's front face
  const mouth = new THREE.Group();
  mouth.position.set(1.35, 0, 0.75);
  mouth.rotation.y = 0.55;
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.7), pbr('#100c08', 1));
  hole.position.y = 0.95;
  mouth.add(hole);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.0, 8), pbr(WOOD_DK, 0.9));
    post.position.set(s * 0.85, 1.0, 0.1);
    mouth.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.1, 8), pbr(WOOD, 0.9));
  lintel.rotation.z = Math.PI / 2;
  lintel.position.y = 2.0;
  mouth.add(lintel);
  root.add(mouth);
  // gold seam in the rock + nugget pile
  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.2),
    new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.85, emissive: '#5a3c00', emissiveIntensity: 0.5 }));
  seam.position.set(-1.1, 1.45, 0.75);
  seam.rotation.set(0.2, 0.2, 0.5);
  root.add(seam);
  for (let i = 0; i < 7; i++) {
    const n = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + (i % 2) * 0.06, 0),
      seam.material);
    n.position.set(2.1 + Math.sin(i * 3.1) * 0.45, 0.12, 1.9 + Math.cos(i * 2.3) * 0.4);
    n.rotation.set(i, i * 2, 0);
    root.add(n);
  }
  // ore cart
  const cart = new THREE.Group();
  cart.position.set(3.0, 0, 1.7);
  cart.rotation.y = 0.5;
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.8), pbr(WOOD_DK, 0.9));
  tub.position.y = 0.55;
  cart.add(tub);
  const load = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), pbr(ROCK_DK, 0.95));
  load.scale.set(1.2, 0.5, 0.9);
  load.position.y = 0.85;
  cart.add(load);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10), pbr('#3a2a1a', 0.9));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(sx * 0.35, 0.22, sz * 0.42);
    cart.add(wheel);
  }
  root.add(cart);
  // pickaxe stuck in the mound crown, stump alongside as a chopping block
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.6, 10), pbr(WOOD, 0.9));
  stump.position.set(-2.5, 0.3, 0.7);
  root.add(stump);
  const pick = new THREE.Group();
  pick.position.set(-0.7, 1.55, 0.35);
  pick.rotation.z = -0.35;
  pick.scale.setScalar(0.75);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 8), pbr(WOOD, 0.85));
  pick.add(handle);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 10, Math.PI), pbr('#55555e', 0.5, 0.7));
  head.position.y = 0.55;
  pick.add(head);
  root.add(pick);
  // claim banner
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), pbr(WOOD_DK, 0.9));
  pole.position.set(-1.6, 2.2, -1.2);
  root.add(pole);
  const flagGeo = new THREE.PlaneGeometry(0.9, 0.55, 5, 1);
  const flag = new THREE.Mesh(flagGeo, pbr(accent, 0.75));
  flag.material.side = THREE.DoubleSide;
  flag.position.set(-1.1, 3.0, -1.2);
  root.add(flag);
  return { root, flag, flagGeo, flagBase: flagGeo.attributes.position.array.slice(), height: 3.6 };
}

function buildBarracks(accent) {
  const root = new THREE.Group();
  // two hide tents
  for (const [tx, tz, s] of [[-1.5, -1.2, 1], [1.4, -1.6, 0.85]]) {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 2.6 * s, 9), pbr(HIDE, 0.9));
    tent.position.set(tx, 1.3 * s, tz);
    root.add(tent);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), pbr(WOOD_DK, 0.9));
    tip.position.set(tx, 2.7 * s, tz);
    root.add(tip);
    const seamT = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2 * s, 0.06), pbr(HIDE_DK, 0.9));
    seamT.position.set(tx + 0.75 * s, 1.1 * s, tz + 0.75 * s);
    seamT.rotation.y = Math.PI / 4;
    root.add(seamT);
  }
  // campfire
  const fire = new THREE.Group();
  fire.position.set(0, 0, 1.2);
  const stones = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 8, 12), pbr(ROCK, 0.95));
  stones.rotation.x = Math.PI / 2;
  stones.position.y = 0.1;
  fire.add(stones);
  for (let i = 0; i < 3; i++) {
    const logF = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 6), pbr(WOOD_DK, 0.9));
    logF.rotation.z = Math.PI / 2;
    logF.rotation.y = (i / 3) * Math.PI;
    logF.position.y = 0.18;
    fire.add(logF);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 8), glowMat('#ff9a3a', 0.9));
  flame.position.y = 0.75;
  fire.add(flame);
  root.add(fire);
  // weapon rack: spears + spare club
  const rack = new THREE.Group();
  rack.position.set(2.6, 0, 1.0);
  rack.rotation.y = -0.4;
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), pbr(WOOD, 0.9));
    post.position.set(0, 0.8, s * 0.5);
    rack.add(post);
  }
  const barR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), pbr(WOOD, 0.9));
  barR.rotation.x = Math.PI / 2;
  barR.position.y = 1.5;
  rack.add(barR);
  for (let i = -1; i <= 1; i++) {
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), pbr(WOOD, 0.85));
    spear.position.set(0, 1.1, i * 0.3);
    spear.rotation.x = 0.15;
    rack.add(spear);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 6), pbr('#55555e', 0.5, 0.7));
    tip.position.set(0, 2.25, i * 0.3 + 0.16);
    rack.add(tip);
  }
  root.add(rack);
  // tall war banner + healer pennant
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), pbr(WOOD_DK, 0.9));
  pole.position.set(-2.8, 2.1, 1.4);
  root.add(pole);
  const flagGeo = new THREE.PlaneGeometry(1.3, 0.9, 5, 2);
  const flag = new THREE.Mesh(flagGeo, pbr(accent, 0.75));
  flag.material.side = THREE.DoubleSide;
  flag.position.set(-2.05, 3.6, 1.4);
  root.add(flag);
  const crossMat = glowMat('#7dff9a', 0.85).clone();
  const crossV = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.5), crossMat);
  const crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), crossMat);
  crossV.position.set(-2.05, 3.6, 0.02);
  crossH.position.set(-2.05, 3.6, 0.02);
  // parent crosses to flag so they ride the ripple anchor (flag origin corner)
  root.add(crossV, crossH);
  return { root, flag, flagGeo, flagBase: flagGeo.attributes.position.array.slice(), flame, crosses: [crossV, crossH], height: 4.4 };
}

const BUILDERS = [buildMine, buildBarracks];

export function BuildingMesh(building) {
  const accent = SIDE_ACCENT[building.side] || SIDE_ACCENT.player;
  const rig = (BUILDERS[building.buildingIndex] || buildMine)(accent);

  const mesh = new THREE.Group();
  mesh.add(rig.root);
  const bar = makeHpBar(2.2);
  bar.sprite.position.y = rig.height + 0.6;
  bar.sprite.visible = false;
  mesh.add(bar.sprite);
  solidify(mesh);
  cloneMats(mesh);

  mesh.position.set(toMeters(building.x), 0, building.z || 0);
  mesh.rotation.y = building.side === 'player' ? 0 : Math.PI;

  let t = Math.random() * 10;
  return {
    mesh,
    update(dt) {
      t += dt;
      mesh.position.set(toMeters(building.x), 0, building.z || 0);
      if (rig.flagGeo) {
        const pos = rig.flagGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const bx = rig.flagBase[i * 3];
          pos.setZ(i, Math.sin(t * 5 + bx * 3) * 0.1 * (bx + 0.65));
        }
        pos.needsUpdate = true;
      }
      if (rig.flame) {
        const f = 1 + Math.sin(t * 13) * 0.15 + Math.sin(t * 29) * 0.08;
        rig.flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
      }
      if (rig.crosses) {
        const p = 0.85 + Math.sin(t * 3) * 0.15;
        rig.crosses.forEach((c) => c.material.opacity = p);
      }
      const frac = building.hp / building.maxHp;
      bar.sprite.visible = frac < 0.999 && building.alive;
      if (bar.sprite.visible) bar.set(frac);
      mesh.visible = building.alive;
    },
    dispose() {
      disposeDeep(mesh);
      rig.flagGeo?.dispose?.();
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
}
