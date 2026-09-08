import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, basic, glowMat, glowSprite, solidify, cloneMats, makeHpBar, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Stone Age turrets (by turretIndex):
//   0 Rock Slingshot — timber A-frame with a swinging sling arm (rock)
//   1 Egg Automatic  — nest mound with an egg stack + rapid thrower (egg)
//   2 Primit. Catapult — heavy frame, long throwing arm, boulder bucket (boulder)
//
// Contract: TurretMesh(turret, ageIndex) -> { mesh, aimAt(x,y,z), dispose() }
// Extras: update(dt) (recoil/flash decay), fire() (recoil + muzzle flash),
// kind (projectile kind), muzzle (Object3D at the barrel tip).

export const TURRET_PROJECTILE = ['rock', 'egg', 'boulder'];

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

const BUILDERS = [buildSlingshot, buildEgg, buildCatapult];

export function TurretMesh(turret, ageIndex) {
  void ageIndex;
  const accent = SIDE_ACCENT[turret.side] || SIDE_ACCENT.player;
  const rig = (BUILDERS[turret.turretIndex] || buildSlingshot)(accent);

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
  const _v = new THREE.Vector3();

  function setFlash(on) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(on ? 0xffffff : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = on ? 0.5 : 1;
    }
  }

  return {
    mesh,
    kind: TURRET_PROJECTILE[turret.turretIndex] || 'rock',
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
