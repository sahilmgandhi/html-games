import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, basic, glowMat, glowSprite, jitterGeo, mottleGeo, rockMat, solidify, cloneMats, makeHpBar, teamRing, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Stone Age turrets (by turretIndex):
//   0 Rock Slingshot — timber A-frame with a swinging sling arm (rock)
//   1 Egg Automatic  — nest mound with an egg stack + rapid thrower (egg)
//   2 Primit. Catapult — heavy frame, long throwing arm, boulder bucket (boulder)
// Castle Age turrets (by turretIndex):
//   0 Catapult       — iron-banded torsion frame, stone-ball bucket (boulder)
//   1 Fire Catapult  — same frame + fire pot, flaming shot bucket (fireball)
// 2 Oil Tower      — stone tower with a tipping oil cauldron (oil)
// Renaissance turrets (by turretIndex):
//   0 Small Cannon   — stone redoubt, thin wheeled barrel (cannonball)
//   1 Large Cannon   — same redoubt + banded long barrel (cannonball)
//   2 Explos. Cannon — squat mortar, powder kegs (shell)
// Modern turrets (by turretIndex):
//   0 Single Turret  — concrete pit, shielded direct-fire gun (bullet)
//   1 Rocket Turret  — angled multi-tube launcher rack (rocket)
//   2 Double Turret  — twin barrels on a steel dome (bullet)
// Future turrets (by turretIndex):
//   0 Titanium Shooter — dark tech pad, twin railgun rails (bullet)
//   1 Lazer Cannon   — lensed emitter housing (laser)
//   2 Ion Ray        — coil tower with a plasma orb (plasma)
//
// Contract: TurretMesh(turret, ageIndex) -> { mesh, aimAt(x,y,z), dispose() }
// Extras: update(dt) (recoil/flash decay), fire() (recoil + muzzle flash),
// kind (projectile kind), muzzle (Object3D at the barrel tip).
// Builders branch on ageIndex (0 Stone, 1 Castle, 2 Renaissance, 3 Modern,
// 4 Future); unknown ages fall back to Stone.

export const TURRET_PROJECTILE = [
  ['rock', 'egg', 'boulder'],
  ['boulder', 'fireball', 'oil'],
  ['cannonball', 'cannonball', 'shell'],
  ['bullet', 'rocket', 'bullet'],
  ['bullet', 'laser', 'plasma'],
];

const WOOD = '#6e4a2c';
const WOOD_DK = '#4c3018';
const STONE = '#8d8d94';
const BONE = '#e8dcc0';
const FUR = '#5a3d26';

function platform(r) {
  const g = new THREE.Group();
  const moundGeo = new THREE.CylinderGeometry(r, r + 0.7, 0.8, 14);
  jitterGeo(moundGeo, 0.07, 2.4, r * 3 + 1);
  mottleGeo(moundGeo, 0.13, (r * 11) | 0);
  const mound = new THREE.Mesh(moundGeo, rockMat('#5a4a3a', 0.95));
  mound.position.y = 0.35;
  g.add(mound);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 0.25, 14), pbr(WOOD, 0.9));
  deck.position.y = 0.8;
  g.add(deck);
  // deck plank seams: two dark grooves so the top reads as laid timber.
  for (const z of [-0.5, 0.5]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry((r + 0.3) * 2, 0.02, 0.05), pbr(WOOD_DK, 0.95));
    seam.position.set(0, 0.93, z);
    g.add(seam);
  }
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
  // rope lashings where the beam pivot rides the axle.
  for (const s of [-1, 1]) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 12), pbr(WOOD_DK, 0.95));
    wrap.position.set(0, 3.0, s * 0.25);
    head.add(wrap);
  }
  // tie-beams between the front and back leg pairs so the fork reads built.
  for (const s of [-1, 1]) {
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 7), frameMat);
    tie.rotation.z = Math.PI / 2;
    tie.position.set(0, 0.7, s * 0.7);
    head.add(tie);
  }
  const arm = new THREE.Group();
  arm.position.y = 3.0;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 8), frameMat);
  beam.rotation.z = Math.PI / 2 - 0.5;
  beam.position.x = 0.35;
  arm.add(beam);
  const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), pbr(FUR, 0.95));
  pouch.position.set(1.5, 0.65, 0);
  arm.add(pouch);
  const stoneGeo = new THREE.SphereGeometry(0.2, 8, 6);
  jitterGeo(stoneGeo, 0.03, 3.0, 7);
  const stone = new THREE.Mesh(stoneGeo, pbr(STONE, 0.85));
  stone.position.set(1.5, 0.85, 0);
  arm.add(stone);
  head.add(arm);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 14), pbr(accent, 0.6));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.35;
  head.add(band);
  root.add(head);
  // spare sling-stones piled against the platform.
  shotPile(root, 2.2, 0.9, pbr(STONE, 0.9), 0.2, 3);
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
  // trampled straw lining inside the nest bowl.
  const straw = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.2, 8, 14), pbr('#a08a5a', 0.98));
  straw.rotation.x = Math.PI / 2;
  straw.position.y = 0.8;
  straw.scale.z = 0.55;
  head.add(straw);
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
  // owner-color war band lashed around the post.
  const postBand = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 6, 12), pbr(accent, 0.65));
  postBand.rotation.x = Math.PI / 2;
  postBand.position.y = 2.4;
  head.add(postBand);
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
  // spare eggs cached at the foot of the nest.
  shotPile(root, -1.9, 1.0, pbr('#efe6d0', 0.5), 0.26, 3);
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
    // St Andrew's cross between the splayed legs: both diagonals.
    for (const dir of [-1, 1]) {
      const diag = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.33, 6), frameMat);
      diag.position.set(0, 0.65, s * 0.55);
      diag.rotation.z = dir * 1.126;
      head.add(diag);
    }
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), pbr(WOOD_DK, 0.9));
  axle.rotation.x = Math.PI / 2;
  axle.position.set(-0.4, 1.5, 0);
  head.add(axle);
  // rope lashings binding beam pivot to the cheeks.
  for (const s of [-1, 1]) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12), pbr('#a08a5a', 0.95));
    wrap.position.set(-0.4, 1.5, s * 0.55);
    head.add(wrap);
  }
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
  const boulderGeo = new THREE.SphereGeometry(0.34, 9, 7);
  jitterGeo(boulderGeo, 0.04, 2.6, 31);
  const boulder = new THREE.Mesh(boulderGeo, pbr('#6a6a72', 0.9));
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
  // spare boulders stacked by the frame.
  shotPile(root, 2.7, -0.9, pbr('#6a6a72', 0.9), 0.34, 3);
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
    // St Andrew's cross-brace between the legs so the frame reads as built.
    for (const bs of [-1, 1]) {
      const braceB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.12), frameMat);
      braceB.position.set(0, 0.55, s * 0.6);
      braceB.rotation.z = bs * 1.07;
      head.add(braceB);
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
  // rope wraps lashing the beam to its pivot axle.
  for (const ry of [0.12, 0.3, 0.48]) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12), pbr('#a08a5a', 0.95));
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = ry;
    arm.add(wrap);
  }
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.42, 10, 1, true), pbr(IRON, 0.5, 0.7));
  bucket.material = bucket.material.clone();
  bucket.material.side = THREE.DoubleSide;
  bucket.position.y = 3.3;
  arm.add(bucket);
  const ballGeo = new THREE.SphereGeometry(0.36, 9, 7);
  jitterGeo(ballGeo, 0.035, 3.0, 77);
  const ball = new THREE.Mesh(ballGeo, pbr(STONE_T, 0.9));
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
  const towerDk = pbr('#6e6e76', 0.95);
  // battered base flare so the tower sits into the platform.
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 0.8, 12), towerDk);
  flare.position.y = 0.3;
  head.add(flare);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 3.2, 12), towerMat);
  tower.position.y = 1.6;
  head.add(tower);
  // stone course bands + corner pilasters: laid masonry, not a plain tube.
  for (const [by, br] of [[0.9, 1.3], [2.3, 1.19]]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(br, br + 0.06, 0.22, 12), towerDk);
    band.position.y = by;
    head.add(band);
  }
  for (let pi = 0; pi < 4; pi++) {
    const pa = pi * Math.PI / 2 + Math.PI / 4;
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.26, 3.0, 0.26), (pi % 2 ? towerMat : towerDk));
    pil.position.set(Math.cos(pa) * 1.08, 1.6, Math.sin(pa) * 1.08);
    pil.rotation.y = -pa;
    head.add(pil);
  }
  crenelRing(head, 1.0, 3.4, towerMat);
  const roofTrim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.09, 8, 16), pbr(accent, 0.6));
  roofTrim.rotation.x = Math.PI / 2;
  roofTrim.position.y = 3.1;
  head.add(roofTrim);
  // timber posts carry the yoke axle so the cauldron rig reads as built.
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 8), pbr(WOOD_DK, 0.9));
    post.position.set(0, 2.75, s * 1.15);
    head.add(post);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.24), pbr(WOOD, 0.9));
    seat.position.set(0, 3.42, s * 1.15);
    head.add(seat);
  }
  // cauldron arm: tips forward to pour on fire()
  const arm = new THREE.Group();
  arm.position.set(0, 3.3, 0);
  const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), pbr(WOOD_DK, 0.9));
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
  // crane timbers swing the pot out past the parapet: king post, jib,
  // diagonal brace, hanger stick, then chains down to the pot rim.
  const craneMat = pbr(WOOD, 0.9);
  const king = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.72, 7), craneMat);
  king.position.set(0, 0.36, 0);
  arm.add(king);
  const jib = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 7), craneMat);
  jib.rotation.z = Math.PI / 2;
  jib.position.set(0.45, 0.72, 0);
  arm.add(jib);
  const braceLen = Math.hypot(0.9, 0.72);
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, braceLen, 6), pbr(WOOD_DK, 0.9));
  brace.position.set(0.45, 0.36, 0);
  brace.rotation.z = -Math.atan2(0.9, 0.72);
  arm.add(brace);
  for (const s of [-1, 1]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 5), pbr(IRON, 0.5, 0.7));
    chain.position.set(0.9, 0.55, s * 0.3);
    arm.add(chain);
  }
  const oilGlow = glowSprite(FIRE, 0.45, 1.1);
  oilGlow.position.set(0.9, 0.55, 0);
  arm.add(oilGlow);
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
// Spoked artillery wheel: iron tire, wooden spokes + hub. Reads as a real
// gun carriage instead of a wooden disc.
function spokedWheel(r, w) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.02, 0.035, 8, 18), pbr('#1a1a20', 0.5, 0.7)));
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, w + 0.04, 10), pbr(WOOD_DK, 0.9));
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  const spokeM = pbr(WOOD, 0.85);
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(r - 0.08, 0.055, 0.055), spokeM);
    sp.position.set(Math.cos(i * Math.PI / 3) * (r / 2), Math.sin(i * Math.PI / 3) * (r / 2), 0);
    sp.rotation.z = i * Math.PI / 3;
    g.add(sp);
  }
  return g;
}

function gunRedoubt(accent, barrelLen, barrelR, elevation, flashScale) {
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
  for (const s of [-1, 1]) {
    const wheel = spokedWheel(0.42, 0.12);
    wheel.position.set(0, -0.45, s * 0.42);
    arm.add(wheel);
  }
  // tube group: breech at local origin, bore along +X, so rings, bands and
  // the muzzle anchor all sit exactly on the barrel at any elevation.
  const tube = new THREE.Group();
  tube.position.set(0, -0.1, 0);
  tube.rotation.z = elevation;
  arm.add(tube);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelR * 0.8, barrelR, barrelLen, 12),
    pbr(IRON, 0.45, 0.75));
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.x = barrelLen / 2;
  tube.add(barrel);
  // muzzle swell + cascabel knob: the classic cannon silhouette.
  const swell = new THREE.Mesh(new THREE.TorusGeometry(barrelR * 0.8 + 0.015, 0.032, 8, 14),
    pbr(IRON, 0.4, 0.8));
  swell.rotation.y = Math.PI / 2;
  swell.position.x = barrelLen - 0.05;
  tube.add(swell);
  const cascabel = new THREE.Mesh(new THREE.SphereGeometry(barrelR * 0.9, 10, 8),
    pbr(IRON, 0.4, 0.8));
  cascabel.position.x = -0.1;
  tube.add(cascabel);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(barrelLen, 0, 0);
  tube.add(muzzle);
  const flash = flashSprite(flashScale);
  flash.position.copy(muzzle.position);
  tube.add(flash);
  head.add(arm);
  root.add(head);
  return { root, head, arm, tube, muzzle, flash };
}

// 0 — Small Cannon (Renaissance)
function buildSmallCannon(accent) {
  const { root, head, arm, tube, muzzle, flash } = gunRedoubt(accent, 1.6, 0.16, 0.22, 1.2);
  for (const bx of [0.55, 1.1]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 14), pbr('#1a1a20', 0.5, 0.7));
    band.rotation.y = Math.PI / 2;
    band.position.x = bx;
    tube.add(band);
  }
  shotPile(head, -1.2, 0.9, pbr(IRON, 0.45, 0.75), 0.22, 3);
  return { root, head, arm, muzzle, flash, height: 4.6, restArmZ: 0, armAxis: 'throw' };
}

// 1 — Large Cannon (Renaissance): longer banded barrel, heavier shot
function buildLargeCannon(accent) {
  const { root, head, arm, tube, muzzle, flash } = gunRedoubt(accent, 2.4, 0.22, 0.2, 1.5);
  for (const bx of [0.8, 1.7]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 14), pbr('#1a1a20', 0.5, 0.7));
    band.rotation.y = Math.PI / 2;
    band.position.x = bx;
    tube.add(band);
  }
  shotPile(head, -1.2, 0.9, pbr(IRON, 0.45, 0.75), 0.28, 3);
  return { root, head, arm, muzzle, flash, height: 4.8, restArmZ: 0, armAxis: 'throw' };
}

// 2 — Explosive Cannon (Renaissance): squat mortar, powder kegs, shell pile
function buildExplosiveCannon(accent) {
  const { root, head, arm, tube, muzzle, flash } = gunRedoubt(accent, 1.0, 0.32, 0.55, 1.7);
  const reinforce = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.035, 8, 14), pbr('#1a1a20', 0.5, 0.7));
  reinforce.rotation.y = Math.PI / 2;
  reinforce.position.x = 0.5;
  tube.add(reinforce);
  for (const [kx, kz] of [[-1.2, -0.8], [-1.2, 0.9]]) {
    const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), pbr(WOOD, 0.9));
    keg.position.set(kx, 1.15, kz);
    head.add(keg);
    for (const hy of [-0.12, 0.12]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.025, 6, 14), pbr('#1a1a20', 0.5, 0.7));
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(kx, 1.15 + hy, kz);
      head.add(hoop);
    }
  }
  shotPile(head, -0.4, 1.1, pbr('#3a3028', 0.5), 0.26, 3);
  return { root, head, arm, muzzle, flash, height: 4.8, restArmZ: 0, armAxis: 'throw' };
}

// Modern gun pit shared by all three turrets: concrete pad, sandbag arc,
// steel pivot. The gun group is the recoil arm (armAxis 'throw', rest 0).
function gunPit(accent) {
  const root = new THREE.Group();
  const padGeo = new THREE.CylinderGeometry(1.9, 2.1, 0.5, 14);
  jitterGeo(padGeo, 0.03, 2.0, 7);
  mottleGeo(padGeo, 0.1, 7);
  const pad = new THREE.Mesh(padGeo, rockMat('#6a6a62', 0.95));
  pad.position.y = 0.25;
  root.add(pad);
  const bagM = pbr('#8a7a5a', 1.0);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + 0.7 * (i / 6));
    const wob = Math.sin(i * 12.9) * 0.5 + Math.sin(i * 5.3) * 0.5;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.34 * (1 + wob * 0.08), 8, 6), bagM);
    bag.scale.set(1.25, 0.55, 0.8);
    bag.position.set(Math.cos(a) * 1.9, 0.68 + wob * 0.02, Math.sin(a) * 1.9);
    bag.rotation.set(wob * 0.1, -a + wob * 0.2, wob * 0.08);
    root.add(bag);
  }
  // ammo crate + spare shell staged on the pad.
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.4), pbr(WOOD, 0.9));
  crate.position.set(-1.2, 0.68, 1.1);
  crate.rotation.y = 0.3;
  root.add(crate);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), pbr('#2c3036', 0.4, 0.8));
  shell.rotation.z = Math.PI / 2;
  shell.position.set(-1.1, 0.92, 1.05);
  shell.rotation.y = 0.3;
  root.add(shell);
  const head = new THREE.Group();
  head.position.y = 0.5;
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.7, 10), pbr('#3a3f46', 0.6));
  pivot.position.y = 0.7;
  head.add(pivot);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.07, 8, 18), pbr(accent, 0.6));
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.15;
  head.add(trim);
  root.add(head);
  const arm = new THREE.Group();
  arm.position.set(0, 1.1, 0);
  head.add(arm);
  return { root, head, arm };
}

// 0 — Single Turret (Modern): shielded direct-fire gun, near-level barrel
function buildSingleTurret(accent) {
  const { root, head, arm } = gunPit(accent);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 1.4), pbr('#4a4f56', 0.55));
  shield.position.set(0.35, 0.35, 0);
  arm.add(shield);
  // bolt heads around the shield rim + owner-color stripe.
  const boltM = pbr('#1c1e22', 0.5, 0.7);
  for (const [by, bz] of [[0.75, 0.6], [0.75, -0.6], [-0.05, 0.6], [-0.05, -0.6]]) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 6), boltM);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0.35, by, bz);
    arm.add(bolt);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.2, 12), pbr('#2c3036', 0.4, 0.8));
  barrel.rotation.z = -Math.PI / 2 + 0.08;
  barrel.position.set(1.2, 0.4, 0);
  arm.add(barrel);
  // thermal sleeve rings + muzzle brake at the barrel tip.
  for (const sx of [1.35, 1.75]) {
    const sleeve = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.022, 6, 12), pbr('#3a3f46', 0.5, 0.6));
    sleeve.rotation.y = Math.PI / 2;
    sleeve.position.set(sx, 0.4 + (sx - 1.2) * 0.08, 0);
    arm.add(sleeve);
  }
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 10), pbr('#1c1e22', 0.5, 0.7));
  brake.rotation.z = -Math.PI / 2 + 0.08;
  brake.position.set(2.2, 0.48, 0);
  arm.add(brake);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(2.35, 0.5, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.4);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 3.4, restArmZ: 0, armAxis: 'throw' };
}

// 1 — Rocket Turret (Modern): angled rack of six launch tubes
function buildRocketTurret(accent) {
  const { root, head, arm } = gunPit(accent);
  const rack = new THREE.Group();
  rack.position.set(0, 0.35, 0);
  rack.rotation.z = 0.5; // fixed skyward tilt; the head still yaws to track
  // frame rails + backplate tie the six tubes into one launch rack.
  for (const fy of [-0.3, 0.3]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.72), pbr('#2c3036', 0.5, 0.6));
    rail.position.set(0.3, fy, 0);
    rack.add(rail);
  }
  const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.72), pbr('#4a4f56', 0.55));
  backplate.position.set(-0.48, 0, 0);
  rack.add(backplate);
  for (const dy of [-0.16, 0.16]) {
    for (const dz of [-0.28, 0, 0.28]) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 8), pbr('#3d4436', 0.6, 0.3));
      tube.rotation.z = -Math.PI / 2;
      tube.position.set(0.3, dy, dz);
      rack.add(tube);
      const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 8),
        new THREE.MeshBasicMaterial({ color: '#0c0e0c' }));
      mouth.rotation.z = -Math.PI / 2;
      mouth.position.set(1.06, dy, dz);
      rack.add(mouth);
    }
  }
  arm.add(rack);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.0, 0.95, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.6);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.2, restArmZ: 0, armAxis: 'throw' };
}

// 2 — Double Turret (Modern): twin barrels on a low steel dome
function buildDoubleTurret(accent) {
  const { root, head, arm } = gunPit(accent);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr('#4a4f56', 0.55));
  dome.position.y = -0.1;
  arm.add(dome);
  for (const s of [-1, 1]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 12), pbr('#2c3036', 0.4, 0.8));
    barrel.rotation.z = -Math.PI / 2 + 0.1;
    barrel.position.set(1.3, 0.6, s * 0.3);
    arm.add(barrel);
  }
  // twin discharge: one flash sprite per barrel tip (see flash2 handling).
  const muzzle = new THREE.Object3D();
  muzzle.position.set(2.5, 0.72, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.5);
  flash.position.set(2.5, 0.72, 0.3);
  arm.add(flash);
  const flash2 = flashSprite(1.5);
  flash2.position.set(2.5, 0.72, -0.3);
  arm.add(flash2);
  return { root, head, arm, muzzle, flash, flash2, height: 3.6, restArmZ: 0, armAxis: 'throw' };
}

// shared Future mount: dark hex pad, glowing rim ring, pivot pylon
function techPad(accent) {
  const root = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.5, 6), pbr('#0d1522', 0.8));
  pad.position.y = 0.25;
  root.add(pad);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.06, 8, 6), glowMat('#00e5ff', 0.9));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.5;
  root.add(rim);
  // recessed inner deck + hex bolt studs around the pad vertices.
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.08, 6), pbr('#131c2c', 0.7, 0.4));
  deck.position.y = 0.5;
  root.add(deck);
  const studM = pbr('#2a3648', 0.5, 0.7);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 6), studM);
    stud.position.set(Math.sin(a) * 1.68, 0.53, Math.cos(a) * 1.68);
    root.add(stud);
  }
  const head = new THREE.Group();
  head.position.y = 0.5;
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 6), pbr('#1c2940', 0.6, 0.6));
  pivot.position.y = 0.7;
  head.add(pivot);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 8, 6), pbr(accent, 0.6));
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.15;
  head.add(trim);
  root.add(head);
  const arm = new THREE.Group();
  arm.position.set(0, 1.2, 0);
  head.add(arm);
  return { root, head, arm };
}

// 0 — Titanium Shooter (Future): twin railgun rails with a power strip
function buildTitaniumShooter(accent) {
  const { root, head, arm } = techPad(accent);
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.14), pbr('#2a3648', 0.5, 0.7));
    rail.position.set(1.0, 0.5, s * 0.22);
    arm.add(rail);
    // rail tip shoe: tapered cap so the rails end in a point, not a cut.
    const shoe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.22, 4), pbr('#1c2940', 0.6, 0.6));
    shoe.rotation.z = -Math.PI / 2;
    shoe.position.set(2.1, 0.5, s * 0.22);
    arm.add(shoe);
  }
  // ceramic insulators bridge the rails + glowing strip feeds between them.
  const insulM = pbr('#0d1522', 0.7, 0.3);
  for (const ix of [0.4, 1.0, 1.6]) {
    const insul = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.58), insulM);
    insul.position.set(ix, 0.5, 0);
    arm.add(insul);
  }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.1), glowMat('#00e5ff', 0.95));
  strip.position.set(1.0, 0.32, 0);
  arm.add(strip);
  const breech = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.6), pbr('#1c2940', 0.6, 0.6));
  breech.position.set(-0.2, 0.4, 0);
  arm.add(breech);
  // capacitor cell on the breech flank: the gun reads as powered, not hollow.
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10), glowMat('#00e5ff', 1));
  cell.rotation.x = Math.PI / 2;
  cell.position.set(-0.2, 0.4, 0.38);
  arm.add(cell);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(2.1, 0.5, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.3);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 3.6, restArmZ: 0, armAxis: 'steady' };
}

// 1 — Lazer Cannon (Future): lensed emitter housing
function buildLazerCannon(accent) {
  const { root, head, arm } = techPad(accent);
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.4, 10), pbr('#1c2940', 0.6, 0.6));
  housing.rotation.z = -Math.PI / 2;
  housing.position.set(0.5, 0.45, 0);
  arm.add(housing);
  // reinforce rings seated on the housing taper (0.70 rear -> 0.55 muzzle).
  for (const [rx, rr] of [[0.3, 0.65], [0.8, 0.60]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.03, 6, 16), pbr('#2a3648', 0.5, 0.7));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(rx, 0.45, 0);
    arm.add(ring);
  }
  // power cell behind the housing in a cage frame: the emitter reads charged.
  const cellM = glowMat('#00e5ff', 1);
  const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 10), cellM);
  cell.rotation.z = -Math.PI / 2;
  cell.position.set(-0.45, 0.45, 0);
  arm.add(cell);
  for (const s of [-1, 1]) {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), pbr('#2a3648', 0.5, 0.7));
    cage.position.set(-0.45, 0.45, s * 0.24);
    arm.add(cage);
  }
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), glowMat('#00e5ff', 1));
  lens.rotation.z = -Math.PI / 2;
  lens.position.set(1.22, 0.45, 0);
  arm.add(lens);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.07, 8, 14), pbr('#2a3648', 0.5, 0.7));
  coil.rotation.y = Math.PI / 2;
  coil.position.set(0.1, 0.45, 0);
  arm.add(coil);
  // saddle block ties the floating housing down to the arm pivot.
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), pbr('#1c2940', 0.6, 0.6));
  saddle.position.set(0.5, 0.0, 0);
  arm.add(saddle);
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.35, 0.45, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.7);
  flash.position.copy(muzzle.position);
  arm.add(flash);
  return { root, head, arm, muzzle, flash, height: 4.0, restArmZ: 0, armAxis: 'steady' };
}

// 2 — Ion Ray (Future): coil tower crowned with a plasma orb
function buildIonRay(accent) {
  const { root, head, arm } = techPad(accent);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), pbr('#1c2940', 0.6, 0.6));
  mast.position.y = 1.3;
  arm.add(mast);
  for (const fy of [0.8, 1.4, 2.0]) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 14), pbr('#2a3648', 0.5, 0.7));
    coil.rotation.x = Math.PI / 2;
    coil.position.y = fy;
    arm.add(coil);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), glowMat('#ff5ad0', 1));
  orb.position.y = 2.6;
  arm.add(orb);
  // halo crown around the orb + guy-struts tying the mast to the arm base.
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 20), glowMat('#ff5ad0', 0.9));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 2.6;
  arm.add(halo);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6), pbr('#2a3648', 0.5, 0.7));
    strut.position.set(Math.cos(a) * 0.28, 0.55, Math.sin(a) * 0.28);
    strut.rotation.set(-Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3);
    arm.add(strut);
  }
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.4, 2.6, 0);
  arm.add(muzzle);
  const flash = flashSprite(1.8);
  flash.position.set(0, 2.6, 0);
  arm.add(flash);
  // beam mast: holds aim on fire (steady recoil), never whips the mast.
  return { root, head, arm, muzzle, flash, height: 4.6, restArmZ: 0, armAxis: 'steady' };
}

const BUILDERS = {
  0: [buildSlingshot, buildEgg, buildCatapult],
  1: [buildMilCatapult, buildFireCatapult, buildOilTower],
  2: [buildSmallCannon, buildLargeCannon, buildExplosiveCannon],
  3: [buildSingleTurret, buildRocketTurret, buildDoubleTurret],
  4: [buildTitaniumShooter, buildLazerCannon, buildIonRay],
};

// Render-side park spread: sim stacks every turret of a side on one x, so
// offset each slot sideways in meters (sim math untouched). Roughly one
// redoubt-width apart so neighboring rigs read as separate emplacements.
const SLOT_OFF = [-1.9, -0.65, 0.65, 1.9];
function slotOff(turret) {
  return SLOT_OFF[turret.slotIndex] ?? 0;
}

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
  mesh.add(teamRing(2.3, accent));

  mesh.position.set(toMeters(turret.x) + slotOff(turret), 0, turret.z || 0);
  mesh.rotation.y = turret.side === 'player' ? 0 : Math.PI;

  let recoil = 0;
  let recoilV = 0;
  let flashT = 0;
  let yaw = 0;
  let yawInit = false;
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
      const target = Math.atan2(-_v.z, _v.x)
        - (turret.side === 'player' ? 0 : Math.PI);
      if (!yawInit) { yaw = target; yawInit = true; }
      else {
        // shortest-arc ease so barrels swing instead of snapping.
        let d = target - yaw;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        yaw += d * 0.35;
      }
      rig.head.rotation.y = yaw;
    },
    fire() {
      recoilV += 7;
      flashT = 0.12;
      rig.flash.visible = true;
      const s = 1.1 + Math.random() * 0.5;
      rig.flash.scale.set(s, s, 1);
      if (rig.flash2) {
        rig.flash2.visible = true;
        rig.flash2.scale.set(s, s, 1);
      }
    },
    update(dt) {
      mesh.position.set(toMeters(turret.x) + slotOff(turret), 0, turret.z || 0);
      t += dt;
      if (rig.flame) {
        const f = 1 + Math.sin(t * 13) * 0.15 + Math.sin(t * 29) * 0.08;
        rig.flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
        if (rig.glow) rig.glow.material.opacity = 0.55 + Math.sin(t * 17) * 0.15;
      }
      // spring recoil: sharp kick then a settled return.
      recoilV += (-recoil * 90 - recoilV * 12) * dt;
      recoil = THREE.MathUtils.clamp(recoil + recoilV * dt, -0.2, 1.2);
      if (Math.abs(recoil) > 0.001 || Math.abs(recoilV) > 0.001) {
        const k = Math.sin(THREE.MathUtils.clamp(recoil, 0, 1) * Math.PI * 0.5);
        if (rig.arm) {
          if (rig.armAxis === 'throw') rig.arm.rotation.z = rig.restArmZ + k * 1.1;
          else if (rig.spin) rig.arm.rotation.y = (rig.arm.rotation.y || 0) + dt * 2;
          // 'steady' beam rigs hold aim; the head kick below carries the shot.
          else if (rig.armAxis !== 'steady') rig.arm.rotation.z = k * -0.7;
        }
        rig.head.position.x = -k * 0.28;
      } else {
        recoil = 0;
        rig.head.position.x = 0;
        if (rig.arm && rig.armAxis === 'throw') rig.arm.rotation.z = rig.restArmZ;
        if (rig.arm && !rig.armAxis && !rig.spin) rig.arm.rotation.z = 0;
        if (rig.spin && rig.arm) rig.arm.rotation.y += dt * 0.6; // idle crank
      }
      if (flashT > 0) {
        flashT -= dt;
        rig.flash.material.opacity = Math.max(0, flashT / 0.12) * 0.95;
        if (flashT <= 0) rig.flash.visible = false;
        if (rig.flash2) {
          rig.flash2.material.opacity = Math.max(0, flashT / 0.12) * 0.95;
          if (flashT <= 0) rig.flash2.visible = false;
        }
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
