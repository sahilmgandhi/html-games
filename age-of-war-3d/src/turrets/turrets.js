import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, basic, glowMat, glowSprite, solidify, cloneMats, makeHpBar, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Stone Age turrets (by turretIndex):
//   0 Rock Slingshot — timber A-frame with a swinging sling arm (rock)
//   1 Egg Automatic  — nest mound with an egg stack + rapid thrower (egg)
//   2 Primit. Catapult — heavy frame, long throwing arm, boulder bucket (boulder)
// Castle Age turrets (by turretIndex):
//   0 Catapult       — iron-banded torsion frame, stone-ball bucket (boulder)
//   1 Fire Catapult  — same frame + fire pot, flaming shot bucket (fireball)
//   2 Oil Tower      — stone tower with a tipping oil cauldron (oil)
//
// Contract: TurretMesh(turret, ageIndex) -> { mesh, aimAt(x,y,z), dispose() }
// Extras: update(dt) (recoil/flash decay), fire() (recoil + muzzle flash),
// kind (projectile kind), muzzle (Object3D at the barrel tip).
// Builders branch on ageIndex (0 Stone, 1 Castle, 2 Renaissance); unknown ages fall back to Stone.

export const TURRET_PROJECTILE = [
  ['rock', 'egg', 'boulder'],
  ['boulder', 'fireball', 'oil'],
  ['cannonball', 'cannonball', 'shell'],
];

const WOOD = '#6e4a2c';
const WOOD_DK = '#4c3018';
const STONE = '#8d8d94';
const BONE = '#e8dcc0';
const FUR = '#5a3d26';

function platform(r) {
  const g = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.7, 0.8, 14), pbr('#5a4a3a', 0.95));
  mound.position.y = 0.35;
  g.add(mound);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 0.25, 14), pbr(WOOD, 0.9));
  deck.position.y = 0.8;
  g.add(deck);
  return g;
}

function flashSprite(scale = 1) {
  const s = glowSprite('#ffcf5a', 0.95, 1.4 * scale);
  s.visible = false;
  return s;
}

// 0 — Rock Slingshot
function buildSlingshot(accent) {
  const root = new THREE.Group();
  root.add(platform(1.5));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const frameMat = pbr(WOOD, 0.9);
  for (const s of [-1, 1]) {
    for (const e of [-1, 1]) {
      const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.4, 8), frameMat);
      legA.position.set(e * 0.55, 1.6, s * 0.7);
      legA.rotation.z = e * -0.32;
      head.add(legA);
    }
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 8), pbr(WOOD_DK, 0.9));
  axle.rotation.x = Math.PI / 2;
  axle.position.y = 3.0;
  head.add(axle);
  const arm = new THREE.Group();
  arm.position.y = 3.0;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 8), frameMat);
  beam.rotation.z = Math.PI / 2 - 0.5;
  beam.position.x = 0.35;
  arm.add(beam);
  const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), pbr(FUR, 0.95));
  pouch.position.set(1.5, 0.65, 0);
  arm.add(pouch);
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), pbr(STONE, 0.85));
  stone.position.set(1.5, 0.85, 0);
  arm.add(stone);
  head.add(arm);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 14), pbr(accent, 0.6));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.35;
  head.add(band);
  root.add(head);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.5, 3.65, 0);
  arm.add(muzzle);
  const flash = flashSprite(1);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.6, restArmZ: 0, armAxis: 'windup' };
}

// 1 — Egg Automatic
function buildEgg(accent) {
  const root = new THREE.Group();
  root.add(platform(1.4));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.35, 10, 16), pbr('#7a5a34', 0.95));
  nest.rotation.x = Math.PI / 2;
  nest.position.y = 0.9;
  nest.scale.z = 0.7;
  head.add(nest);
  // egg stack
  for (let i = 0; i < 4; i++) {
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), pbr('#efe6d0', 0.5));
    egg.scale.set(1, 1.3, 1);
    const a = (i / 4) * Math.PI * 2;
    egg.position.set(Math.cos(a) * 0.4, 1.0 + (i === 0 ? 0.35 : 0), Math.sin(a) * 0.4);
    head.add(egg);
  }
  // rapid thrower: short post + spinning cradle
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.2, 8), pbr(WOOD, 0.9));
  post.position.y = 1.8;
  head.add(post);
  const arm = new THREE.Group();
  arm.position.y = 2.9;
  const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 12, Math.PI * 1.4), pbr(WOOD_DK, 0.9));
  cradle.rotation.z = -0.4;
  arm.add(cradle);
  const loaded = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), pbr('#efe6d0', 0.5));
  loaded.scale.set(1, 1.3, 1);
  loaded.position.set(0.55, 0.1, 0);
  arm.add(loaded);
  const feathers = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 6), pbr(accent, 0.75));
  feathers.position.set(-0.4, 0.3, 0);
  feathers.rotation.z = 1.2;
  arm.add(feathers);
  head.add(arm);
  root.add(head);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.9, 3.1, 0);
  arm.add(muzzle);
  const flash = flashSprite(0.8);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.2, spin: true };
}

// 2 — Primitive Catapult
function buildCatapult(accent) {
  const root = new THREE.Group();
  root.add(platform(1.8));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const frameMat = pbr(WOOD, 0.9);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.25), frameMat);
    cheek.position.set(0, 1.2, s * 0.55);
    head.add(cheek);
    for (const ex of [-1, 1]) {
      const legC = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 2.0, 8), frameMat);
      legC.position.set(ex * 1.0, 0.5, s * 0.55);
      legC.rotation.z = ex * 0.3;
      head.add(legC);
    }
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), pbr(WOOD_DK, 0.9));
  axle.rotation.x = Math.PI / 2;
  axle.position.set(-0.4, 1.5, 0);
  head.add(axle);
  const arm = new THREE.Group();
  arm.position.set(-0.4, 1.5, 0);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.4, 8), frameMat);
  beam.position.y = 1.4;
  arm.add(beam);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.4, 10, 1, true), pbr(WOOD_DK, 0.9));
  bucket.material = bucket.material.clone();
  bucket.material.side = THREE.DoubleSide;
  bucket.position.y = 3.1;
  arm.add(bucket);
  const boulder = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7), pbr('#6a6a72', 0.9));
  boulder.position.y = 3.3;
  arm.add(boulder);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), pbr('#a08a5a', 0.95));
  rope.position.set(0.5, 0.4, 0);
  rope.rotation.z = 0.5;
  arm.add(rope);
  arm.rotation.z = -0.9; // resting lean-back
  head.add(arm);
  const paint = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.2, 0.05), pbr(accent, 0.65));
  paint.position.set(0, 1.2, 0.7);
  head.add(paint);
  root.add(head);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 4.6, 0);
  head.add(muzzle);
  const flash = flashSprite(1.4);
  flash.position.set(2.2, 3.6, 0);
  head.add(flash);
  return { root, head, arm, muzzle, flash, height: 5.4, restArmZ: -0.9, armAxis: 'throw' };
}

const STONE_T = '#8d8d94';
const STONE_DK = '#5e5e66';
const IRON = '#3a3f4a';
const FIRE = '#ff7a2a';
const OIL = '#241f12';

function stonePlatform(r) {
  const g = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.7, 0.8, 14), pbr(STONE_DK, 0.95));
  mound.position.y = 0.35;
  g.add(mound);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 0.25, 14), pbr(STONE_T, 0.9));
  deck.position.y = 0.8;
  g.add(deck);
  return g;
}

function crenelRing(parent, r, y, mat, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.2), mat);
    c.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    c.rotation.y = -a;
    parent.add(c);
  }
}

function shotPile(parent, x, z, mat, r = 0.3, n = 3) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), mat);
    s.position.set(x + (i % 2) * r * 1.6, r + Math.floor(i / 2) * r * 1.4, z);
    parent.add(s);
  }
}

// 0 — Catapult (Castle): iron-banded torsion frame, stone-ball bucket
function buildMilCatapult(accent) {
  const root = new THREE.Group();
  root.add(stonePlatform(1.8));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const frameMat = pbr(WOOD, 0.9);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 0.3), frameMat);
    cheek.position.set(0, 1.3, s * 0.6);
    head.add(cheek);
    for (const ex of [-1, 1]) {
      const legC = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.2, 8), frameMat);
      legC.position.set(ex * 1.1, 0.5, s * 0.6);
      legC.rotation.z = ex * 0.3;
      head.add(legC);
    }
    // iron bands around the cheeks
    for (const bx of [-1.1, 0, 1.1]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.36), pbr(IRON, 0.5, 0.7));
      band.position.set(bx, 1.3, s * 0.6);
      head.add(band);
    }
  }
  // torsion bundle
  const bundle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 10), pbr('#a08a5a', 0.95));
  bundle.rotation.x = Math.PI / 2;
  bundle.position.set(-0.4, 1.3, 0);
  head.add(bundle);
  const arm = new THREE.Group();
  arm.position.set(-0.4, 1.3, 0);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.6, 8), frameMat);
  beam.position.y = 1.5;
  arm.add(beam);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.42, 10, 1, true), pbr(IRON, 0.5, 0.7));
  bucket.material = bucket.material.clone();
  bucket.material.side = THREE.DoubleSide;
  bucket.position.y = 3.3;
  arm.add(bucket);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.36, 9, 7), pbr(STONE_T, 0.9));
  ball.position.y = 3.5;
  arm.add(ball);
  arm.rotation.z = -0.9;
  head.add(arm);
  shotPile(head, -1.7, 1.3, pbr(STONE_T, 0.9));
  const paint = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 0.05), pbr(accent, 0.65));
  paint.position.set(0, 1.3, 0.78);
  head.add(paint);
  root.add(head);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 4.8, 0);
  head.add(muzzle);
  const flash = flashSprite(1.4);
  flash.position.set(2.3, 3.8, 0);
  head.add(flash);
  return { root, head, arm, muzzle, flash, height: 5.6, restArmZ: -0.9, armAxis: 'throw' };
}

// 1 — Fire Catapult (Castle): catapult frame + fire pot, flaming shot
function buildFireCatapult(accent) {
  const rig = buildMilCatapult(accent);
  // fire pot on the deck + flame on the loaded shot
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 10, 1, true), pbr(IRON, 0.5, 0.7));
  pot.material = pot.material.clone();
  pot.material.side = THREE.DoubleSide;
  pot.position.set(-1.7, 1.25, -1.2);
  rig.head.add(pot);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), glowMat(FIRE, 0.9));
  flame.position.set(-1.7, 1.9, -1.2);
  rig.head.add(flame);
  const glow = glowSprite(FIRE, 0.7, 2.2);
  glow.position.copy(flame.position);
  rig.head.add(glow);
  // flaming shot: wrap the stone ball in fire
  const fireball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 9, 7), glowMat('#ffb03a', 0.9));
  fireball.position.y = 3.5;
  rig.arm.add(fireball);
  rig.flame = flame;
  rig.glow = glow;
  return rig;
}

// 2 — Oil Tower (Castle): stone tower, tipping cauldron pours oil
function buildOilTower(accent) {
  const root = new THREE.Group();
  root.add(stonePlatform(1.6));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const towerMat = pbr(STONE_T, 0.95);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 3.2, 12), towerMat);
  tower.position.y = 1.6;
  head.add(tower);
  crenelRing(head, 1.0, 3.4, towerMat);
  const roofTrim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.09, 8, 16), pbr(accent, 0.6));
  roofTrim.rotation.x = Math.PI / 2;
  roofTrim.position.y = 3.1;
  head.add(roofTrim);
  // cauldron arm: tips forward to pour on fire()
  const arm = new THREE.Group();
  arm.position.set(0, 3.3, 0);
  const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), pbr(WOOD_DK, 0.9));
  yoke.rotation.x = Math.PI / 2;
  arm.add(yoke);
  const potM = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.36, 0.6, 12, 1, true), pbr(IRON, 0.5, 0.7));
  potM.material = potM.material.clone();
  potM.material.side = THREE.DoubleSide;
  potM.position.set(0.9, 0.1, 0);
  arm.add(potM);
  const oilM = new THREE.Mesh(new THREE.CircleGeometry(0.44, 12), pbr(OIL, 0.3));
  oilM.rotation.x = -Math.PI / 2;
  oilM.position.set(0.9, 0.32, 0);
  arm.add(oilM);
  head.add(arm);
  root.add(head);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.9, 3.4, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.2);
  flash.position.set(0.9, 3.2, 0);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 5.2 };
}

// Renaissance gun redoubt shared by all three cannon turrets: stone
// platform, low parapet ring, wheeled barrel aimed skyward. The barrel group
// is the recoil arm (armAxis 'throw', rest 0) so fire() kicks it upward.
function gunRedoubt(accent, barrelLen, barrelR, elevation) {
  const root = new THREE.Group();
  root.add(stonePlatform(1.8));
  const head = new THREE.Group();
  head.position.y = 1.0;
  const parapet = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.7, 14, 1, true),
    pbr(STONE_T, 0.9));
  parapet.material = parapet.material.clone();
  parapet.material.side = THREE.DoubleSide;
  parapet.position.y = 1.15;
  head.add(parapet);
  crenelRing(head, 1.9, 1.65, pbr(STONE_DK, 0.95), 12);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 8, 18), pbr(accent, 0.6));
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.85;
  head.add(trim);
  const arm = new THREE.Group();
  arm.position.set(-0.3, 1.3, 0);
  const wheelM = pbr(WOOD_DK, 0.9);
  for (const s of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12), wheelM);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, -0.45, s * 0.42);
    arm.add(wheel);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelR * 0.8, barrelR, barrelLen, 12),
    pbr(IRON, 0.45, 0.75));
  barrel.rotation.z = -Math.PI / 2 + elevation;
  barrel.position.set(Math.cos(elevation) * barrelLen / 2, Math.sin(elevation) * barrelLen / 2 - 0.1, 0);
  arm.add(barrel);
  head.add(arm);
  root.add(head);
  return { root, head, arm };
}

// 0 — Small Cannon (Renaissance)
function buildSmallCannon(accent) {
  const { root, head, arm } = gunRedoubt(accent, 1.6, 0.16, 0.22);
  shotPile(head, -1.2, 0.9, pbr(IRON, 0.45, 0.75), 0.22, 3);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.35, 1.75, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.2);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.6, restArmZ: 0, armAxis: 'throw' };
}

// 1 — Large Cannon (Renaissance): longer banded barrel, heavier shot
function buildLargeCannon(accent) {
  const { root, head, arm } = gunRedoubt(accent, 2.4, 0.22, 0.2);
  for (const bx of [-0.5, 0.3]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 14), pbr('#1a1a20', 0.5, 0.7));
    band.rotation.y = Math.PI / 2;
    band.position.set(bx, 0.35, 0);
    arm.add(band);
  }
  shotPile(head, -1.2, 0.9, pbr(IRON, 0.45, 0.75), 0.28, 3);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.85, 1.85, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.5);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.8, restArmZ: 0, armAxis: 'throw' };
}

// 2 — Explosive Cannon (Renaissance): squat mortar, powder kegs, shell pile
function buildExplosiveCannon(accent) {
  const { root, head, arm } = gunRedoubt(accent, 1.0, 0.32, 0.55);
  for (const [kx, kz] of [[-1.2, -0.8], [-1.2, 0.9]]) {
    const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), pbr(WOOD, 0.9));
    keg.position.set(kx, 1.15, kz);
    head.add(keg);
  }
  shotPile(head, -0.4, 1.1, pbr('#3a3028', 0.5), 0.26, 3);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.75, 2.1, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.7);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.8, restArmZ: 0, armAxis: 'throw' };
}

const BUILDERS = {
  0: [buildSlingshot, buildEgg, buildCatapult],
  1: [buildMilCatapult, buildFireCatapult, buildOilTower],
  2: [buildSmallCannon, buildLargeCannon, buildExplosiveCannon],
};

export function TurretMesh(turret, ageIndex) {
  const accent = SIDE_ACCENT[turret.side] || SIDE_ACCENT.player;
  const row = BUILDERS[ageIndex] || BUILDERS[0];
  const rig = (row[turret.turretIndex] || BUILDERS[0][0])(accent);

  const mesh = new THREE.Group();
  mesh.add(rig.root);
  const bar = makeHpBar(1.8);
  bar.sprite.position.y = rig.height + 0.5;
  bar.sprite.visible = false;
  mesh.add(bar.sprite);
  solidify(mesh);
  const mats = cloneMats(mesh);
  for (const m of mats) {
    if ('emissive' in m) { m.emissive = new THREE.Color('#000000'); m.transparent = true; }
  }

  mesh.position.set(toMeters(turret.x), 0, turret.z || 0);
  mesh.rotation.y = turret.side === 'player' ? 0 : Math.PI;

  let recoil = 0;
  let flashT = 0;
  let t = Math.random() * 10;
  const _v = new THREE.Vector3();

  function setFlash(on) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(on ? 0xffffff : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = on ? 0.5 : 1;
    }
  }

  return {
    mesh,
    kind: ((TURRET_PROJECTILE[ageIndex] || TURRET_PROJECTILE[0])[turret.turretIndex]) || 'rock',
    muzzle: rig.muzzle,
    aimAt(x, y, z) {
      rig.muzzle.getWorldPosition(_v);
      _v.set(x - _v.x, 0, z - _v.z);
      if (_v.lengthSq() < 1e-6) return;
      const yaw = Math.atan2(-_v.z, _v.x);
      // head group faces +X at rotation 0; compensate outer mirror
      const mirror = turret.side === 'player' ? 0 : Math.PI;
      rig.head.rotation.y = yaw - mirror;
    },
    fire() {
      recoil = 1;
      flashT = 0.12;
      rig.flash.visible = true;
    },
    update(dt) {
      mesh.position.set(toMeters(turret.x), 0, turret.z || 0);
      t += dt;
      if (rig.flame) {
        const f = 1 + Math.sin(t * 13) * 0.15 + Math.sin(t * 29) * 0.08;
        rig.flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
        if (rig.glow) rig.glow.material.opacity = 0.55 + Math.sin(t * 17) * 0.15;
      }
      if (recoil > 0) {
        recoil = Math.max(0, recoil - dt * 4);
        const k = Math.sin(recoil * Math.PI);
        if (rig.arm) {
          if (rig.armAxis === 'throw') rig.arm.rotation.z = rig.restArmZ + k * 1.1;
          else if (rig.spin) rig.arm.rotation.y = (rig.arm.rotation.y || 0) + dt * 2;
          else rig.arm.rotation.z = k * -0.7;
        }
        rig.head.position.x = -k * 0.18;
      } else {
        rig.head.position.x = 0;
        if (rig.arm && rig.armAxis === 'throw') rig.arm.rotation.z = rig.restArmZ;
        if (rig.arm && !rig.armAxis && !rig.spin) rig.arm.rotation.z = 0;
        if (rig.spin && rig.arm) rig.arm.rotation.y += dt * 0.6; // idle crank
      }
      if (flashT > 0) {
        flashT -= dt;
        rig.flash.material.opacity = Math.max(0, flashT / 0.12) * 0.95;
        if (flashT <= 0) rig.flash.visible = false;
      }
      setFlash(turret.hitFlash > 0);
      const frac = turret.hp / turret.maxHp;
      bar.sprite.visible = frac < 0.999 && turret.alive;
      if (bar.sprite.visible) bar.set(frac);
      mesh.visible = turret.alive;
    },
    dispose() {
      disposeDeep(mesh);
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
}
