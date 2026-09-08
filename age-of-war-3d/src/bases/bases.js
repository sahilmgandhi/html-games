import * as THREE from 'three';
import {
  pbr, basic, glowMat, solidify, cloneMats, makeHpBar, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Stone Age stronghold: great-menhir core ringed by a timber palisade, skull
// totems and a war banner in the owner's color. Faces +X for the player,
// -X for the enemy (mirrored war paint).
//
// Contract: BaseMesh(side, ageIndex) -> { mesh, setHp(frac), dispose() }

const WOOD = '#8a5f36';
const WOOD_DK = '#654522';
const ROCK = '#9b9184';
const ROCK_DK = '#6e655a';
const BONE = '#e8dcc0';
const FUR = '#5a3d26';

function menhir(h, r, mat) {
  const g = new THREE.CylinderGeometry(r * 0.75, r, h, 7);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const wob = 1 + 0.08 * Math.sin(y * 3.1 + r * 7) + 0.05 * Math.cos(y * 5.3);
    pos.setX(i, pos.getX(i) * wob);
    pos.setZ(i, pos.getZ(i) * wob);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function skullTotem(h) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h, 8), pbr(WOOD_DK, 0.9));
  pole.position.y = h / 2;
  g.add(pole);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), pbr(BONE, 0.65));
  skull.position.y = h + 0.12;
  skull.scale.set(1, 1.15, 0.9);
  g.add(skull);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), basic('#140f0c'));
    eye.position.set(0.15, h + 0.15, s * 0.08);
    g.add(eye);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), pbr(BONE, 0.6));
    horn.position.set(-0.02, h + 0.32, s * 0.16);
    horn.rotation.x = s * 0.8;
    g.add(horn);
  }
  return g;
}

export function BaseMesh(side, ageIndex) {
  void ageIndex;
  const accent = SIDE_ACCENT[side] || SIDE_ACCENT.player;
  const mirror = side === 'player' ? 1 : -1;

  const mesh = new THREE.Group();

  // foundation mound
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 0.7, 18), pbr('#6e5a44', 0.95));
  mound.position.y = 0.3;
  mesh.add(mound);

  // great menhir core with glowing rune band
  const core = menhir(7.5, 1.5, pbr(ROCK, 0.9));
  core.position.y = 3.9;
  mesh.add(core);
  const cap = menhir(1.6, 1.1, pbr(ROCK_DK, 0.95));
  cap.position.y = 8.0;
  mesh.add(cap);
  const rune = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.09, 8, 24),
    glowMat(side === 'player' ? '#5aa2ff' : '#ff6a5a', 0.8)
  );
  rune.rotation.x = Math.PI / 2;
  rune.position.y = 5.4;
  mesh.add(rune);

  // palisade arc facing the battlefield
  const palMat = pbr(WOOD, 0.9);
  const palMatDk = pbr(WOOD_DK, 0.9);
  for (let i = -3; i <= 3; i++) {
    const h = 3.2 + (i % 2 === 0 ? 0.35 : 0);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, h, 7), (i + 3) % 2 ? palMat : palMatDk);
    const a = (i / 3) * 0.62;
    log.position.set(Math.cos(a) * 3.1 * mirror, h / 2 + 0.4, Math.sin(a) * 3.4);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 7), palMatDk);
    tip.position.y = h / 2 + 0.25;
    log.add(tip);
    mesh.add(log);
  }
  // crossbeam with trophies
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 6.4, 8), palMatDk);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(3.1 * mirror, 3.1, 0);
  mesh.add(beam);
  for (let i = -2; i <= 2; i++) {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 6), pbr(BONE, 0.6));
    tusk.position.set(3.1 * mirror, 2.75, i * 1.2);
    tusk.rotation.x = Math.PI;
    mesh.add(tusk);
  }

  // skull totems flanking the gate
  for (const s of [-1, 1]) {
    const totem = skullTotem(2.6 + (s > 0 ? 0.5 : 0));
    totem.position.set(1.4 * mirror, 0.5, s * 3.2);
    mesh.add(totem);
  }

  // war banner on the menhir
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8), palMatDk);
  bannerPole.position.set(-0.6 * mirror, 8.6, 0);
  mesh.add(bannerPole);
  const flagGeo = new THREE.PlaneGeometry(1.7, 1.0, 6, 2);
  const flag = new THREE.Mesh(flagGeo, pbr(accent, 0.75));
  flag.material.side = THREE.DoubleSide;
  flag.position.set(0.35 * mirror - 0.6 * mirror, 9.6, 0);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);
  const flagBase = flagGeo.attributes.position.array.slice();

  // campfire at the gate
  const fire = new THREE.Group();
  fire.position.set(2.6 * mirror, 0.6, 1.6);
  for (let i = 0; i < 3; i++) {
    const logF = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 6), palMatDk);
    logF.rotation.z = Math.PI / 2;
    logF.rotation.y = (i / 3) * Math.PI;
    logF.position.y = 0.12;
    fire.add(logF);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 8), glowMat('#ff9a3a', 0.9));
  flame.position.y = 0.6;
  fire.add(flame);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat('#ffd23a', 0.9));
  ember.position.y = 0.3;
  fire.add(ember);
  mesh.add(fire);

  // damage states: cracked slabs + fallen timber, revealed as HP drops
  const dmg2 = new THREE.Group(); // < 66%: cracks + lean
  for (let i = 0; i < 4; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.5 + i * 0.2, 0.4, 0.8), pbr(ROCK_DK, 0.95));
    slab.position.set((Math.sin(i * 2.4) * 2.4), 0.75, Math.cos(i * 1.7) * 2.8);
    slab.rotation.set(i, i * 2, 0.4);
    dmg2.add(slab);
  }
  const dmg1 = new THREE.Group(); // < 33%: banner torn, core tilted, fire out
  const fallen = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.4, 7), palMatDk);
  fallen.position.set(2.2 * mirror, 0.9, -2.4);
  fallen.rotation.z = Math.PI / 2.2;
  fallen.rotation.y = 0.5;
  dmg1.add(fallen);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  // HP bar rides over the menhir, Clash-style
  const bar = makeHpBar(4.2);
  bar.sprite.position.y = 8.4;
  bar.set(1);
  mesh.add(bar.sprite);

  solidify(mesh);
  cloneMats(mesh);
  mesh.rotation.y = mirror > 0 ? 0 : Math.PI;

  let t = Math.random() * 10;
  return {
    mesh,
    setHp(frac) {
      const f = THREE.MathUtils.clamp(frac, 0, 1);
      bar.set(f);
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      core.rotation.z = f < 0.33 ? 0.06 : 0;
      flame.visible = f > 0.05;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      // banner ripple
      const pos = flagGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = flagBase[i * 3];
        const wave = Math.sin(t * 5 + bx * 3) * 0.12 * (bx + 0.85);
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
      flagGeo.computeVertexNormals();
      // fire flicker
      if (flame.visible) {
        const f = 1 + Math.sin(t * 13) * 0.15 + Math.sin(t * 29) * 0.08;
        flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
        ember.scale.setScalar(1 + Math.sin(t * 17) * 0.12);
      }
      rune.rotation.z = t * 0.4;
    },
    dispose() {
      disposeDeep(mesh);
      flagGeo.dispose();
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
}
