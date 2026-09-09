import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, basic, glowMat, solidify, cloneMats, makeHpBar, teamRing, emblemTexture, disposeDeep, SIDE_ACCENT, skinMat, clothMat, furMat,
} from '../core/pbr.js';

// Procedural units, Clash-Royale chunky style, one builder set per age
// (Stone: clubman/slinger/dino-rider/shaman; Castle: swordsman/archer/
// knight/paladin; Renaissance: dueler/musketeer/cannoneer/engineer).
// units. Inner `body` group carries walk,
// attack and death poses so facing never fights animation.
//
// Contract: UnitMesh(entity, ageIndex) -> { mesh, update(dt, entity), dispose() }
// Works for any age (falls back to the melee rig for unknown types).

const SKIN_DK = '#a06a42';
const FUR = '#6b4a2f';
const FUR_DK = '#4a3120';
const WOOD = '#7a5230';
const WOOD_DK = '#54371f';
const STONE = '#8d8d94';
const BONE = '#e8dcc0';

function leg(r, len, mat) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 12), mat);
  m.position.y = -len / 2;
  g.add(m);
  // boot: dark leather heel + forward toe box instead of a bare fur slab.
  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.22), pbr(FUR_DK, 0.95));
  boot.position.set(0.02, -len + 0.07, 0);
  g.add(boot);
  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.2), pbr('#3a2a1c', 0.9));
  toe.position.set(0.16, -len + 0.045, 0);
  g.add(toe);
  return g;
}

function arm(r, len, mat, hand) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, len, 12), mat);
  m.position.y = -len / 2;
  g.add(m);
  if (hand) {
    hand.position.y = -len;
    g.add(hand);
  } else {
    // empty hand reads as a fist, not a sawn-off stump.
    const fist = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 8, 6), skinMat());
    fist.position.y = -len - 0.02;
    fist.scale.set(1, 1.25, 1);
    g.add(fist);
  }
  return g;
}

// Realistic close-up face: inset shadowed sockets, small off-white eyeballs
// with dark irises, upper lids, angled brows, nose bridge, mouth line and
// ears. Same signature as the old cartoon eyes() so every builder picks it
// up with no per-rig edits.
function eyes(head, y, xOff, spread = 0.13) {
  const socketM = pbr('#7a4e34', 0.8);
  const ballM = pbr('#e8e0d0', 0.5);
  const irisM = pbr('#2e2018', 0.4);
  const lidM = pbr('#a06a42', 0.7);
  const hairM = pbr('#2e2018', 0.95);
  for (const s of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), socketM);
    socket.position.set(xOff - 0.01, y, s * spread);
    socket.scale.set(0.55, 1, 1);
    head.add(socket);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), ballM);
    ball.position.set(xOff + 0.02, y, s * spread);
    ball.scale.set(0.6, 1, 1);
    head.add(ball);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), irisM);
    iris.position.set(xOff + 0.052, y, s * spread);
    head.add(iris);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), basic('#ffffff'));
    glint.position.set(xOff + 0.068, y + 0.012, s * spread);
    head.add(glint);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.1), lidM);
    lid.position.set(xOff + 0.015, y + 0.062, s * spread);
    lid.rotation.z = -0.15;
    head.add(lid);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.028, 0.12), hairM);
    brow.position.set(xOff - 0.01, y + 0.115, s * (spread + 0.01));
    brow.rotation.x = s * -0.18;
    head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.06), skinMat());
  nose.position.set(xOff + 0.12, y - 0.08, 0);
  head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.022, 0.13), pbr('#5a3226', 0.8));
  mouth.position.set(xOff + 0.07, y - 0.19, 0);
  head.add(mouth);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat());
    ear.position.set(xOff - 0.12, y - 0.03, s * 0.21);
    ear.scale.set(0.6, 1, 0.8);
    head.add(ear);
  }
}

function headband(head, y, accent) {
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.09, 12), pbr(accent, 0.7));
  band.position.y = y;
  head.add(band);
}

function warPaint(torso, accent) {
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.4), pbr(accent, 0.7));
  stripe.position.set(0.24, 0.1, 0);
  stripe.rotation.z = 0.3;
  torso.add(stripe);
}

function club(scale = 1) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.065 * scale, 0.7 * scale, 8), pbr(WOOD, 0.9));
  shaft.position.y = -0.3 * scale;
  g.add(shaft);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13 * scale, 10, 8), pbr(WOOD_DK, 0.9));
  knob.position.y = -0.68 * scale;
  knob.scale.set(1, 1.35, 1);
  g.add(knob);
  return g;
}

function buildClubman(accent) {
  const b = new THREE.Group();
  const skin = skinMat();
  const legL = leg(0.11, 0.85, skin); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, skin); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.62, 10), skin);
  chest.position.y = 0.32; torso.add(chest);
  const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, 0.3, 10), furMat(FUR));
  tunic.position.y = 0.02; torso.add(tunic);
  warPaint(torso, accent);
  b.add(torso);
  const armL = arm(0.09, 0.6, skin); armL.position.set(0, 1.52, 0.36);
  const armR = arm(0.09, 0.6, skin, club(1)); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.86;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), skin);
  head.add(skull);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.24), pbr(SKIN_DK, 0.8));
  jaw.position.set(0.1, -0.15, 0); head.add(jaw);
  const hair = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 10), furMat('#2e2018'));
  hair.position.y = 0.26; head.add(hair);
  eyes(head, 0.04, 0.2);
  headband(head, 0.12, accent);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.1 };
}

function buildSlinger(accent) {
  const b = new THREE.Group();
  const skin = skinMat();
  const legL = leg(0.09, 0.8, skin); legL.position.set(0, 0.9, 0.14);
  const legR = leg(0.09, 0.8, skin); legR.position.set(0, 0.9, -0.14);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 0.95;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.58, 10), skin);
  chest.position.y = 0.3; torso.add(chest);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.12), pbr(accent, 0.7));
  strap.position.set(0, 0.36, 0); strap.rotation.x = 0.5; torso.add(strap);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.24, 10), furMat(FUR));
  skirt.position.y = -0.02; torso.add(skirt);
  b.add(torso);
  const sling = new THREE.Group();
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 12), pbr(FUR_DK, 0.95));
  sling.add(loop);
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pbr(STONE, 0.9));
  stone.position.y = -0.1; sling.add(stone);
  const armL = arm(0.075, 0.55, skin); armL.position.set(0, 1.44, 0.3);
  const armR = arm(0.075, 0.55, skin, sling); armR.position.set(0, 1.44, -0.3);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.74;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skin));
  const mop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), furMat('#3a2a1a'));
  mop.position.set(-0.05, 0.18, 0); mop.scale.set(1, 0.7, 1.05); head.add(mop);
  eyes(head, 0.02, 0.17, 0.11);
  headband(head, 0.1, accent);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 1.95 };
}

function buildDinoRider(accent) {
  const b = new THREE.Group();
  const hide = pbr('#7da05a', 0.8);
  const belly = pbr('#c9c27a', 0.85);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 12), hide);
  torso.scale.set(1.35, 0.95, 0.85); torso.position.y = 1.55;
  b.add(torso);
  const tum = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), belly);
  tum.scale.set(1.15, 0.7, 0.7); tum.position.set(0.1, 1.25, 0);
  b.add(tum);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.0, 10), hide);
  neck.position.set(0.95, 2.1, 0); neck.rotation.z = -0.5;
  b.add(neck);
  const dhead = new THREE.Group(); dhead.position.set(1.35, 2.5, 0);
  const skullD = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.42), hide);
  dhead.add(skullD);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.34), hide);
  snout.position.set(0.38, -0.05, 0); dhead.add(snout);
  for (const s of [-1, 1]) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), pbr(BONE, 0.6));
    tooth.position.set(0.42, -0.2, s * 0.1); tooth.rotation.x = Math.PI;
    dhead.add(tooth);
  }
  for (const s of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), pbr('#3d5a2e', 0.8));
    socket.position.set(0.1, 0.14, s * 0.2);
    socket.scale.set(0.55, 1, 1);
    dhead.add(socket);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), pbr('#e8e0c8', 0.5));
    ball.position.set(0.13, 0.14, s * 0.2);
    ball.scale.set(0.6, 1, 1);
    dhead.add(ball);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), pbr('#141a10', 0.4));
    pupil.position.set(0.17, 0.14, s * 0.2);
    dhead.add(pupil);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.13), hide);
    lid.position.set(0.12, 0.21, s * 0.2);
    lid.rotation.z = -0.15;
    dhead.add(lid);
  }
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), pbr('#4a7038', 0.85));
  crest.position.set(-0.1, 0.32, 0); crest.rotation.z = 0.4; dhead.add(crest);
  b.add(dhead);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.6, 10), hide);
  tail.position.set(-1.5, 1.6, 0); tail.rotation.z = Math.PI / 2 - 0.15;
  b.add(tail);
  for (const s of [-1, 1]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 6), pbr('#4a7038', 0.85));
    spike.position.set(-0.3 - (s > 0 ? 0.35 : 0), 2.35, 0);
    b.add(spike);
  }
  const legL = leg(0.2, 1.1, hide); legL.position.set(0.1, 1.15, 0.42);
  const legR = leg(0.2, 1.1, hide); legR.position.set(0.1, 1.15, -0.42);
  b.add(legL, legR);
  // rider
  const skin = skinMat();
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.7), pbr(accent, 0.7));
  saddle.position.set(-0.1, 2.28, 0); b.add(saddle);
  const rtorso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.45, 8), skin);
  rtorso.position.set(-0.1, 2.6, 0); b.add(rtorso);
  const rhead = new THREE.Group(); rhead.position.set(-0.05, 2.98, 0);
  rhead.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), skin));
  eyes(rhead, 0.02, 0.13, 0.09);
  headband(rhead, 0.08, accent);
  b.add(rhead);
  const armR = arm(0.07, 0.45, skin, club(0.8)); armR.position.set(0.05, 2.78, -0.24);
  b.add(armR);
  const armL = arm(0.07, 0.45, skin); armL.position.set(0.05, 2.78, 0.24);
  armL.rotation.x = 0.5; b.add(armL);
  return { body: b, legL, legR, armL, armR, head: dhead, height: 3.1, dino: true, tail };
}

function buildShaman(accent) {
  const b = new THREE.Group();
  const skin = skinMat();
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.5, 12), clothMat('#5a3a6a', 0.85));
  robe.position.y = 0.75; b.add(robe);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 16), pbr(accent, 0.6));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.12; b.add(trim);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 10), skin);
  chest.position.y = 1.65; b.add(chest);
  const armL = arm(0.08, 0.55, skin); armL.position.set(0, 1.82, 0.32);
  const staff = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.7, 8), pbr(WOOD_DK, 0.9));
  pole.position.y = -0.4; staff.add(pole);
  const skullS = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), pbr(BONE, 0.6));
  skullS.position.y = 0.5; staff.add(skullS);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.25, 6), pbr(BONE, 0.6));
    horn.position.set(0, 0.58, s * 0.14); horn.rotation.x = s * 0.7; staff.add(horn);
  }
  const armR = arm(0.08, 0.55, skin, staff); armR.position.set(0, 1.82, -0.32);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 2.1;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skin));
  eyes(head, 0.03, 0.17, 0.11);
  for (let i = -1; i <= 1; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 6), furMat(accent));
    f.position.set(-0.08, 0.32, i * 0.13); f.rotation.z = 0.25;
    head.add(f);
  }
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.2), pbr(BONE, 0.6));
  mask.position.set(0.2, -0.1, 0); head.add(mask);
  b.add(head);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.05, 8, 32),
    glowMat('#7dff9a', 0.55)
  );
  aura.rotation.x = Math.PI / 2; aura.position.y = 0.08;
  b.add(aura);
  return { body: b, legL: null, legR: null, armL, armR, head, height: 2.4, aura };
}

// ---- Castle Age (age 1): plate, mail and heraldry in the same chunky idiom ----
const STEEL = '#9aa0a8';
const STEEL_DK = '#5a6068';
const LEATHER = '#5a3d26';
const GOLD = '#c9a13a';
const PLUME = '#a83a3a';

function sword(len = 1.0) {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, len, 0.11), pbr(STEEL, 0.35, 0.85));
  blade.position.y = -len / 2 - 0.1; g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), pbr(STEEL, 0.35, 0.85));
  tip.rotation.x = Math.PI; tip.position.y = -len - 0.18; g.add(tip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.16), pbr(GOLD, 0.5, 0.7));
  guard.position.y = -0.08; g.add(guard);
  return g;
}

function helm(head, accent, plumeColor) {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), pbr(STEEL, 0.45, 0.7));
  dome.position.y = 0.04; head.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14), pbr(STEEL_DK, 0.6, 0.6));
  brim.position.y = 0.06; head.add(brim);
  const nasal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.05), pbr(STEEL_DK, 0.6, 0.6));
  nasal.position.set(0.25, -0.06, 0); head.add(nasal);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 6), furMat(plumeColor || PLUME, 0.7));
  plume.position.set(-0.05, 0.36, 0); plume.rotation.z = 0.3; head.add(plume);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.07, 14), pbr(accent, 0.6));
  band.position.y = 0.1; head.add(band);
}

function buildSwordsman(accent) {
  const b = new THREE.Group();
  const steel = pbr(STEEL, 0.45, 0.55);
  const legL = leg(0.11, 0.85, steel); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, steel); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.6, 10), steel);
  chest.position.y = 0.32; torso.add(chest);
  const surcoat = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.37, 0.42, 10), clothMat(accent, 0.8));
  surcoat.position.y = 0.02; torso.add(surcoat);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 10), pbr(LEATHER, 0.9));
  belt.position.y = -0.14; torso.add(belt);
  b.add(torso);
  const shield = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 14), pbr(accent, 0.6));
  plate.rotation.x = Math.PI / 2; shield.add(plate);
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 20), pbr('#1c1c22', 0.7));
  shield.add(rimRing);
  const sigil = new THREE.Mesh(new THREE.CircleGeometry(0.26, 14),
    new THREE.MeshStandardMaterial({ map: emblemTexture(accent, '#e8e2d4', 'cross'), roughness: 0.6 }));
  sigil.position.z = 0.045; shield.add(sigil);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pbr(STEEL_DK, 0.5, 0.65));
  boss.position.z = 0.08; shield.add(boss);
  const armL = arm(0.09, 0.6, steel, shield); armL.position.set(0, 1.52, 0.36);
  const armR = arm(0.09, 0.6, steel, sword()); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.86;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.11);
  helm(head, accent);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.15 };
}

function buildArcher(accent) {
  const b = new THREE.Group();
  const cloth = clothMat('#4a5a3a');
  const legL = leg(0.09, 0.8, pbr(LEATHER, 0.9)); legL.position.set(0, 0.9, 0.14);
  const legR = leg(0.09, 0.8, pbr(LEATHER, 0.9)); legR.position.set(0, 0.9, -0.14);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 0.95;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.58, 10), cloth);
  chest.position.y = 0.3; torso.add(chest);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.12), pbr(accent, 0.7));
  strap.position.set(0, 0.36, 0); strap.rotation.x = 0.5; torso.add(strap);
  b.add(torso);
  // quiver of arrows on the back
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.55, 8), pbr(LEATHER, 0.9));
  quiver.position.set(-0.2, 1.35, 0.12); quiver.rotation.z = 0.35; b.add(quiver);
  for (let i = 0; i < 3; i++) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), pbr(STEEL, 0.4, 0.8));
    tip.position.set(-0.28 + i * 0.05, 1.66, 0.12); b.add(tip);
  }
  // longbow in the left hand, arc opening forward (+X)
  const bow = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 14, Math.PI), pbr(WOOD, 0.85));
  arc.rotation.z = -Math.PI / 2; bow.add(arc);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.76, 4), basic('#d8cfb8'));
  string.position.x = 0; bow.add(string);
  const armL = arm(0.075, 0.55, cloth, bow); armL.position.set(0, 1.44, 0.3);
  const armR = arm(0.075, 0.55, cloth); armR.position.set(0, 1.44, -0.3);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.74;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), skinMat()));
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 10), cloth);
  hood.position.y = 0.2; head.add(hood);
  eyes(head, 0.0, 0.16, 0.1);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.0 };
}

function buildKnight(accent) {
  const b = new THREE.Group();
  const horse = pbr('#4a3428', 0.9);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.5, 10), horse);
  barrel.rotation.z = Math.PI / 2; barrel.position.y = 1.25; b.add(barrel);
  const caparison = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.51, 0.8, 10), clothMat(accent, 0.85));
  caparison.rotation.z = Math.PI / 2; caparison.position.set(-0.25, 1.25, 0); b.add(caparison);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.7, 8), horse);
  neck.position.set(0.85, 1.6, 0); neck.rotation.z = -0.6; b.add(neck);
  const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.24), horse);
  horseHead.position.set(1.15, 1.9, 0); b.add(horseHead);
  const chamfron = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.26), pbr(STEEL_DK, 0.6, 0.6));
  chamfron.position.set(1.2, 1.92, 0); b.add(chamfron);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 6), furMat(PLUME, 0.7));
  crest.position.set(1.05, 2.2, 0); crest.rotation.z = -0.4; b.add(crest);
  const tailM = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 7), furMat('#2e2018'));
  tailM.position.set(-0.95, 1.3, 0); tailM.rotation.z = 2.6; b.add(tailM);
  // near-side legs trot (rig); far-side pair is static dressing
  const legL = leg(0.09, 1.0, horse); legL.position.set(0.55, 1.0, 0.2);
  const legR = leg(0.09, 1.0, horse); legR.position.set(-0.55, 1.0, 0.2);
  const farL = leg(0.09, 1.0, horse); farL.position.set(0.55, 1.0, -0.2);
  const farR = leg(0.09, 1.0, horse); farR.position.set(-0.55, 1.0, -0.2);
  b.add(legL, legR, farL, farR);
  // rider
  const steel = pbr(STEEL, 0.45, 0.55);
  const torso = new THREE.Group(); torso.position.y = 1.7;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.55, 10), steel);
  chest.position.y = 0.3; torso.add(chest);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.3), pbr(accent, 0.7));
  cross.position.set(0.26, 0.32, 0); torso.add(cross);
  b.add(torso);
  // couched lance: shaft forward along +X, strike anim reads as the thrust
  const lance = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 7), pbr(WOOD, 0.85));
  shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.9; lance.add(shaft);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), pbr(STEEL, 0.35, 0.85));
  point.rotation.z = -Math.PI / 2; point.position.x = 2.15; lance.add(point);
  const pennon = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.18), pbr(accent, 0.7));
  pennon.position.set(1.75, 0.12, 0); lance.add(pennon);
  const armL = arm(0.09, 0.55, steel); armL.position.set(0, 2.2, 0.32);
  const armR = arm(0.09, 0.55, steel, lance); armR.position.set(0, 2.2, -0.32);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 2.5;
  const helmM = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.34, 12), steel);
  head.add(helmM);
  eyes(head, 0.02, 0.18, 0.09);
  b.add(head);
  // couched lance: the strike anim drives this arm forward (thrust), never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.9, tail: tailM, thrust: true };
}

function buildPaladin(accent) {
  const b = new THREE.Group();
  const steel = pbr(STEEL, 0.35, 0.6);
  const legL = leg(0.12, 0.9, steel); legL.position.set(0, 1.0, 0.17);
  const legR = leg(0.12, 0.9, steel); legR.position.set(0, 1.0, -0.17);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.05;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.33, 0.66, 12), steel);
  chest.position.y = 0.34; torso.add(chest);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 18), pbr(GOLD, 0.5, 0.7));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.6; torso.add(trim);
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.62), clothMat('#7a1f1f'));
  cape.position.set(-0.32, 0.1, 0); cape.rotation.z = 0.12; torso.add(cape);
  b.add(torso);
  const armL = arm(0.1, 0.65, steel); armL.position.set(0, 1.62, 0.38);
  const armR = arm(0.1, 0.65, steel, sword(1.0)); armR.position.set(0, 1.62, -0.38);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.98;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat()));
  eyes(head, 0.02, 0.19, 0.11);
  helm(head, accent, GOLD);
  b.add(head);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.05, 8, 32),
    glowMat('#ffd23a', 0.55)
  );
  aura.rotation.x = Math.PI / 2; aura.position.y = 0.08;
  b.add(aura);
  return { body: b, legL, legR, armL, armR, head, height: 2.5, aura };
}

function musket() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8), pbr(STEEL_DK, 0.5, 0.65));
  barrel.rotation.z = Math.PI / 2 - 0.12; barrel.position.set(0.35, -0.5, 0); g.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), pbr(WOOD_DK, 0.9));
  stock.position.set(-0.25, -0.62, 0); stock.rotation.z = -0.12; g.add(stock);
  return g;
}

function tricorn(accent) {
  const g = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.18, 12), pbr('#2a2018', 0.9));
  g.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), pbr('#2a2018', 0.9));
  brim.position.y = -0.1; g.add(brim);
  const cockade = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), pbr(accent, 0.7));
  cockade.position.set(0.2, -0.02, 0); g.add(cockade);
  return g;
}

function fieldGun(barrelLen, barrelR) {
  const g = new THREE.Group();
  const wheelM = pbr(WOOD_DK, 0.9);
  for (const s of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 12), wheelM);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, 0.34, s * 0.32);
    g.add(wheel);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), pbr(STEEL_DK, 0.5, 0.65));
    hub.position.set(0, 0.34, s * 0.38);
    g.add(hub);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelR * 0.85, barrelR, barrelLen, 12),
    pbr('#2a2a30', 0.45, 0.75));
  barrel.rotation.z = -Math.PI / 2 + 0.18;
  barrel.position.set(0.35, 0.62, 0);
  g.add(barrel);
  // reinforce bands seated on the barrel taper, ring planes square to the bore.
  const boreDir = new THREE.Vector3(Math.cos(0.18), Math.sin(0.18), 0);
  for (const bx of [0.05, 0.45]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(barrelR * 0.96 - bx * 0.06, 0.025, 6, 14),
      pbr(STEEL_DK, 0.5, 0.65));
    band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), boreDir);
    band.position.set(bx, 0.62 + (bx - 0.35) * 0.18, 0);
    g.add(band);
  }
  for (const s of [-1, 1]) {
    const trailBeam = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.09, 0.09), wheelM);
    trailBeam.position.set(-0.45, 0.3, s * 0.2);
    trailBeam.rotation.z = -0.25;
    g.add(trailBeam);
  }
  return g;
}

function buildDueler(accent) {
  const b = new THREE.Group();
  const cream = pbr('#d8c8a8', 0.9);
  const legL = leg(0.1, 0.85, cream); legL.position.set(0, 0.95, 0.15);
  const legR = leg(0.1, 0.85, cream); legR.position.set(0, 0.95, -0.15);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.58, 10), pbr(accent, 0.75));
  chest.position.y = 0.32; torso.add(chest);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 10), pbr(GOLD, 0.6, 0.7));
  sash.position.y = -0.1; sash.rotation.x = 0.35; torso.add(sash);
  // baldric: diagonal sword-belt across the doublet.
  const baldric = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.12), pbr(LEATHER, 0.9));
  baldric.position.set(0.26, 0.32, 0); baldric.rotation.z = -0.5; torso.add(baldric);
  b.add(torso);
  // rapier with a cup hilt; puffed sleeves cap both shoulders.
  const rapier = sword(0.7);
  const cup = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    pbr(STEEL_DK, 0.5, 0.7));
  cup.position.y = -0.08; rapier.add(cup);
  const buckler = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), pbr(STEEL, 0.4, 0.8));
  buckler.rotation.x = Math.PI / 2;
  const armL = arm(0.085, 0.58, cream, buckler); armL.position.set(0, 1.5, 0.34);
  const armR = arm(0.085, 0.58, cream, rapier); armR.position.set(0, 1.5, -0.34);
  for (const a of [armL, armR]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), cream);
    a.add(puff);
  }
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.84;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(accent, 0.8));
  cap.position.y = 0.08; head.add(cap);
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 6), pbr('#e8e0d0', 0.8));
  feather.position.set(-0.12, 0.32, 0); feather.rotation.z = 0.5; head.add(feather);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.1 };
}

function buildMusketeer(accent) {
  const b = new THREE.Group();
  const coat = pbr(accent, 0.85);
  const legL = leg(0.1, 0.85, pbr('#3a3028', 0.9)); legL.position.set(0, 0.95, 0.15);
  const legR = leg(0.1, 0.85, pbr('#3a3028', 0.9)); legR.position.set(0, 0.95, -0.15);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.6, 10), coat);
  chest.position.y = 0.32; torso.add(chest);
  const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.12), pbr('#d8c8a8', 0.85));
  bandolier.position.set(0.27, 0.32, 0); bandolier.rotation.z = 0.5; torso.add(bandolier);
  // second strap crosses into an X; cartridge block rides the hip.
  const crossbelt = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.12), pbr(LEATHER, 0.9));
  crossbelt.position.set(0.27, 0.32, 0); crossbelt.rotation.z = -0.5; torso.add(crossbelt);
  const cartBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.2), pbr(WOOD_DK, 0.9));
  cartBox.position.set(-0.28, -0.05, -0.2); torso.add(cartBox);
  b.add(torso);
  const armL = arm(0.09, 0.6, coat); armL.position.set(0, 1.52, 0.35);
  const armR = arm(0.09, 0.6, coat, musket()); armR.position.set(0, 1.52, -0.35);
  for (const a of [armL, armR]) {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 10), pbr('#d8c8a8', 0.85));
    cuff.position.y = -0.5; a.add(cuff);
  }
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.86;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const hat = tricorn(accent); hat.position.y = 0.24; head.add(hat);
  b.add(head);
  // leveled musket: the strike anim holds aim and kicks back, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.15, thrust: true };
}

function buildCannoneer(accent) {
  const b = new THREE.Group();
  const apron = pbr('#4a3826', 0.95);
  const legL = leg(0.11, 0.85, pbr('#3a3028', 0.9)); legL.position.set(-0.35, 0.95, 0.16);
  const legR = leg(0.11, 0.85, pbr('#3a3028', 0.9)); legR.position.set(-0.35, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.set(-0.35, 1.0, 0);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.62, 10), apron);
  chest.position.y = 0.33; torso.add(chest);
  b.add(torso);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), pbr(WOOD, 0.9));
  rod.position.y = -0.5;
  const armL = arm(0.095, 0.6, apron); armL.position.set(-0.35, 1.52, 0.36);
  const armR = arm(0.095, 0.6, apron, rod); armR.position.set(-0.35, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.set(-0.35, 1.88, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.16, 10), pbr(accent, 0.8));
  cap.position.y = 0.24; head.add(cap);
  b.add(head);
  const gun = fieldGun(1.1, 0.14);
  gun.position.set(0.75, 0, 0);
  b.add(gun);
  // ramrod work: the strike anim drives the arm forward, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.2, thrust: true };
}

function buildWarEngineer(accent) {
  const b = new THREE.Group();
  const coat = pbr('#3a2a4a', 0.85);
  const legL = leg(0.12, 0.9, pbr('#2a2018', 0.9)); legL.position.set(-0.5, 1.0, 0.17);
  const legR = leg(0.12, 0.9, pbr('#2a2018', 0.9)); legR.position.set(-0.5, 1.0, -0.17);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.set(-0.5, 1.05, 0);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.34, 0.68, 12), coat);
  chest.position.y = 0.36; torso.add(chest);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.04, 8, 18), pbr(GOLD, 0.5, 0.7));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.62; torso.add(trim);
  b.add(torso);
  const armL = arm(0.1, 0.65, coat); armL.position.set(-0.5, 1.64, 0.38);
  const armR = arm(0.1, 0.65, coat, musket()); armR.position.set(-0.5, 1.64, -0.38);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.set(-0.5, 2.0, 0);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat()));
  eyes(head, 0.02, 0.19, 0.11);
  const hat = tricorn(GOLD); hat.position.y = 0.26; head.add(hat);
  b.add(head);
  const mortar = fieldGun(0.8, 0.24);
  mortar.position.set(0.7, 0, 0);
  b.add(mortar);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.05, 8, 32),
    glowMat('#ffd23a', 0.55)
  );
  aura.rotation.x = Math.PI / 2; aura.position.y = 0.08;
  b.add(aura);
  // leveled musket: the strike anim holds aim and kicks back, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.6, aura, thrust: true };
}

// Modern: olive-drab great-war infantry, riflemen, a tracked tank and an
// officer hero. The tank omits legs/arms; the shared anim guards every rig
// field, so it bobs, sways its turret and topples on death like the rest.
const OLIVE = '#5a5a3a';
const OLIVE_DK = '#3f3f2c';
const TANK_GREEN = '#4a5238';

function helmet(accent) {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(OLIVE_DK, 0.85));
  g.add(dome);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), pbr(OLIVE_DK, 0.85));
  brim.position.y = 0.0; g.add(brim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 12), pbr(accent, 0.7));
  band.position.y = 0.06; g.add(band);
  return g;
}

function rifle() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8), pbr(STEEL_DK, 0.4, 0.8));
  barrel.rotation.z = Math.PI / 2 - 0.1; barrel.position.set(0.4, -0.5, 0); g.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.09), pbr(WOOD_DK, 0.9));
  stock.position.set(-0.3, -0.6, 0); stock.rotation.z = -0.1; g.add(stock);
  const bayonet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), pbr(STEEL, 0.35, 0.85));
  bayonet.rotation.z = Math.PI / 2 - 0.1; bayonet.position.set(1.22, -0.43, 0); g.add(bayonet);
  return g;
}

// great-war webbing: crossed straps over the chest + a hip canteen, so the
// olive uniform reads as kitted infantry instead of a bare cylinder.
function webbing(torso) {
  const strapM = pbr('#3a3226', 0.95);
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.11), strapM);
    strap.position.set(0.28, 0.33, s * 0.1);
    strap.rotation.x = s * 0.28;
    strap.rotation.z = 0.12;
    torso.add(strap);
  }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.31, 0.09, 10), strapM);
  belt.position.y = -0.02; torso.add(belt);
  const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 10), pbr(OLIVE_DK, 0.9));
  canteen.position.set(0.05, -0.08, 0.33); torso.add(canteen);
  const canteenCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), pbr(WOOD_DK, 0.9));
  canteenCap.position.set(0.05, 0.03, 0.33); torso.add(canteenCap);
}

function buildMeleeInfantry(accent) {
  const b = new THREE.Group();
  const uniform = pbr(OLIVE, 0.9);
  const legL = leg(0.11, 0.85, pbr(OLIVE_DK, 0.9)); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, pbr(OLIVE_DK, 0.9)); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.62, 10), uniform);
  chest.position.y = 0.33; torso.add(chest);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.35), pbr('#4a3d2a', 0.95));
  pack.position.set(-0.32, 0.35, 0); torso.add(pack);
  webbing(torso);
  b.add(torso);
  const armL = arm(0.095, 0.6, uniform); armL.position.set(0, 1.52, 0.36);
  const armR = arm(0.095, 0.6, uniform, rifle()); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.88;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const helm = helmet(accent); helm.position.y = 0.1; head.add(helm);
  b.add(head);
  // bayonet jab: the strike anim drives the rifle forward, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.15, thrust: true };
}

function buildInfantry(accent) {
  const b = new THREE.Group();
  const uniform = pbr(OLIVE, 0.9);
  const legL = leg(0.11, 0.85, pbr(OLIVE_DK, 0.9)); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, pbr(OLIVE_DK, 0.9)); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.62, 10), uniform);
  chest.position.y = 0.33; torso.add(chest);
  const ammo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.35), pbr('#4a3d2a', 0.95));
  ammo.position.set(0, 0.05, 0); torso.add(ammo);
  webbing(torso);
  b.add(torso);
  const armL = arm(0.095, 0.6, uniform); armL.position.set(0, 1.52, 0.36);
  // rifleman aims: rifle held level, arm pose baked into the held group
  const aim = new THREE.Group();
  const gun = rifle(); gun.rotation.z = 0.1; gun.position.set(0.35, -0.55, 0); aim.add(gun);
  const armR = arm(0.095, 0.6, uniform, aim); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.88;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const helm = helmet(accent); helm.position.y = 0.1; head.add(helm);
  b.add(head);
  // aimed volley: the strike anim holds the level and kicks back, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.15, thrust: true };
}

function buildTank(accent) {
  const b = new THREE.Group();
  const hullM = pbr(TANK_GREEN, 0.7, 0.35);
  for (const s of [-1, 1]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.45), pbr('#2a2a28', 0.9, 0.3));
    track.position.set(0, 0.35, s * 0.62);
    b.add(track);
    for (const wx of [-0.7, 0, 0.7]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 10), pbr(STEEL_DK, 0.6, 0.6));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.32, s * 0.86);
      b.add(wheel);
    }
  }
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 1.0), hullM);
  hull.position.y = 0.85; b.add(hull);
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.0), hullM);
  glacis.position.set(1.2, 0.72, 0); glacis.rotation.z = -0.5; b.add(glacis);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 1.02), pbr(accent, 0.7));
  stripe.position.y = 0.85; b.add(stripe);
  // track skirts, a nose headlight and a turret antenna: silhouette dressing.
  for (const s of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 0.06), hullM);
    skirt.position.set(0, 0.62, s * 0.88);
    b.add(skirt);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.18), basic('#ffe9a8'));
  lamp.position.set(1.45, 0.85, 0.3); b.add(lamp);
  const lampGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.22), pbr(STEEL_DK, 0.6, 0.6));
  lampGuard.position.set(1.45, 0.93, 0.3); b.add(lampGuard);
  // turret doubles as the rig head so it sways on the march
  const turret = new THREE.Group(); turret.position.set(-0.2, 1.25, 0);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.4, 12), hullM);
  turret.add(dome);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.5, 10), pbr(STEEL_DK, 0.4, 0.8));
  barrel.rotation.z = -Math.PI / 2 + 0.06;
  barrel.position.set(0.95, 0.12, 0);
  turret.add(barrel);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10), pbr(OLIVE_DK, 0.85));
  hatch.position.y = 0.24; turret.add(hatch);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.9, 6), pbr('#1c1c20', 0.8));
  antenna.position.set(-0.3, 0.6, -0.25); turret.add(antenna);
  b.add(turret);
  return { body: b, head: turret, height: 2.4 };
}

function buildCommander(accent) {
  const b = new THREE.Group();
  const coat = pbr('#3d4436', 0.85);
  const legL = leg(0.11, 0.88, pbr('#2c2c24', 0.9)); legL.position.set(0, 0.98, 0.16);
  const legR = leg(0.11, 0.88, pbr('#2c2c24', 0.9)); legR.position.set(0, 0.98, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.03;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.33, 0.66, 12), coat);
  chest.position.y = 0.35; torso.add(chest);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 18), pbr(GOLD, 0.5, 0.7));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.6; torso.add(trim);
  // Sam Browne crossbelt, medal ribbons and a cap visor: staff-officer read.
  const crossbelt = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.12), pbr('#d8c8a8', 0.85));
  crossbelt.position.set(0.29, 0.35, 0); crossbelt.rotation.z = 0.5; torso.add(crossbelt);
  for (let ri = 0; ri < 3; ri++) {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.09),
      pbr(['#4a8af4', '#c9a13a', '#a83a3a'][ri], 0.6));
    ribbon.position.set(0.3, 0.48, -0.12 + ri * 0.12);
    torso.add(ribbon);
  }
  b.add(torso);
  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), pbr(GOLD, 0.5, 0.7));
  baton.position.y = -0.5;
  const armL = arm(0.1, 0.62, coat); armL.position.set(0, 1.58, 0.37);
  const armR = arm(0.1, 0.62, coat, baton); armR.position.set(0, 1.58, -0.37);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.94;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat()));
  eyes(head, 0.0, 0.17, 0.1);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.14, 12), pbr('#2c2c24', 0.85));
  cap.position.y = 0.26; head.add(cap);
  const capBand = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 12), pbr(GOLD, 0.5, 0.7));
  capBand.position.y = 0.2; head.add(capBand);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.3), pbr('#1c1c20', 0.7));
  visor.position.set(0.24, 0.16, 0); head.add(visor);
  b.add(head);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.05, 8, 32),
    glowMat('#ffd23a', 0.55)
  );
  aura.rotation.x = Math.PI / 2; aura.position.y = 0.08;
  b.add(aura);
  return { body: b, legL, legR, armL, armR, head, height: 2.3, aura };
}

// Future: black-glass armor with cyan power accents and glowing visors.
const FUT_DARK = '#141c28';
const FUT_PLATE = '#232f44';
const FUT_GLOW = '#00e5ff';

function visor(head) {
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.05), glowMat(FUT_GLOW, 0.95));
  v.position.set(0.14, 0.05, 0);
  head.add(v);
}

// Shoulder shell over an arm joint, and a backpack power unit with a glow
// cell on its rear face. Shared across the Future infantry rigs.
function pauldron(parent, mat, x, y, z, r = 0.16) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
  p.position.set(x, y, z);
  parent.add(p);
}

function powerPack(parent, x, y, s = 1) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.42 * s, 0.3 * s), pbr(FUT_DARK, 0.7, 0.25));
  g.add(box);
  const cell = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2 * s, 0.12 * s), glowMat(FUT_GLOW, 0.9));
  cell.position.x = -0.11 * s;
  g.add(cell);
  g.position.set(x, y, 0);
  parent.add(g);
}

function blaster() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), pbr(FUT_DARK, 0.6, 0.4));
  g.add(body);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), glowMat(FUT_GLOW, 0.95));
  tip.rotation.z = Math.PI / 2; tip.position.set(0.45, 0, 0); g.add(tip);
  return g;
}

function energyBlade(len) {
  const g = new THREE.Group();
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), pbr(FUT_DARK, 0.6, 0.4));
  hilt.position.y = -0.3; g.add(hilt);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, len, 0.09), glowMat(FUT_GLOW, 0.9));
  blade.position.y = -0.3 + len / 2; g.add(blade);
  return g;
}

function buildGodsBlade(accent) {
  const b = new THREE.Group();
  const armor = pbr(FUT_PLATE, 0.65, 0.55);
  const legL = leg(0.12, 0.88, pbr(FUT_DARK, 0.7, 0.25)); legL.position.set(0, 0.98, 0.17);
  const legR = leg(0.12, 0.88, pbr(FUT_DARK, 0.7, 0.25)); legR.position.set(0, 0.98, -0.17);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.03;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.34, 0.68, 12), armor);
  chest.position.y = 0.36; torso.add(chest);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 18), pbr(accent, 0.5));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.6; torso.add(trim);
  const waist = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 18), glowMat(FUT_GLOW, 0.9));
  waist.rotation.x = Math.PI / 2; waist.position.y = 0.03; torso.add(waist);
  b.add(torso);
  const armL = arm(0.1, 0.62, armor); armL.position.set(0, 1.6, 0.38);
  const armR = arm(0.1, 0.62, armor, energyBlade(0.85)); armR.position.set(0, 1.6, -0.38);
  b.add(armL, armR);
  // pauldrons, waist power-seam and a backpack cell: elite-guard read.
  pauldron(b, armor, 0, 1.66, 0.42);
  pauldron(b, armor, 0, 1.66, -0.42);
  powerPack(b, -0.36, 1.4);
  const head = new THREE.Group(); head.position.y = 1.98;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), pbr(FUT_DARK, 0.6, 0.4)));
  visor(head);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.3 };
}

function buildBlasterUnit(accent) {
  const b = new THREE.Group();
  const suit = pbr(FUT_DARK, 0.7, 0.25);
  const legL = leg(0.11, 0.85, suit); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, suit); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.62, 10), pbr(FUT_PLATE, 0.65, 0.55));
  chest.position.y = 0.33; torso.add(chest);
  const cell = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.06), glowMat(FUT_GLOW, 0.9));
  cell.position.set(0.2, 0.35, 0.12); torso.add(cell);
  const sigil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), pbr(accent, 0.6));
  sigil.position.set(-0.2, 0.4, 0); torso.add(sigil);
  const waist = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 8, 18), glowMat(FUT_GLOW, 0.9));
  waist.rotation.x = Math.PI / 2; waist.position.y = 0.03; torso.add(waist);
  b.add(torso);
  const armL = arm(0.095, 0.6, suit); armL.position.set(0, 1.52, 0.36);
  const aim = new THREE.Group();
  const gun = blaster(); gun.position.set(0.35, -0.55, 0); aim.add(gun);
  const armR = arm(0.095, 0.6, suit, aim); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  // pauldrons, waist power-seam and a slim backpack cell.
  pauldron(b, suit, 0, 1.58, 0.4, 0.15);
  pauldron(b, suit, 0, 1.58, -0.4, 0.15);
  powerPack(b, -0.33, 1.32, 0.85);
  const head = new THREE.Group(); head.position.y = 1.88;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), pbr(FUT_DARK, 0.6, 0.4)));
  visor(head);
  b.add(head);
  // aimed burst: the strike anim holds the level and kicks back, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 2.15, thrust: true };
}

function buildWarMachine(accent) {
  const b = new THREE.Group();
  const hullM = pbr(FUT_PLATE, 0.55, 0.55);
  for (const s of [-1, 1]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.5), pbr('#0c1018', 0.8, 0.4));
    track.position.set(0, 0.38, s * 0.66);
    b.add(track);
    for (const wx of [-0.75, 0, 0.75]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), pbr('#2a3648', 0.5));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.35, s * 0.93);
      b.add(wheel);
    }
  }
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.05), hullM);
  hull.position.y = 0.95; b.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.1, 1.07), glowMat(FUT_GLOW, 0.9));
  stripe.position.y = 1.0; b.add(stripe);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.1, 1.07), pbr(accent, 0.5));
  trim.position.y = 0.78; b.add(trim);
  // track skirts over the road wheels, a glow bow-lamp and a turret antenna.
  for (const s of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 0.06), hullM);
    skirt.position.set(0, 0.55, s * 0.99);
    b.add(skirt);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.3), glowMat(FUT_GLOW, 0.95));
  lamp.position.set(1.12, 1.0, 0); b.add(lamp);
  // twin cannon turret doubles as the rig head
  const turret = new THREE.Group(); turret.position.set(-0.2, 1.4, 0);
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.42, 12), hullM);
  turret.add(dome);
  for (const s of [-1, 1]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 10), pbr('#0c1018', 0.5));
    barrel.rotation.z = -Math.PI / 2 + 0.05;
    barrel.position.set(1.0, 0.1, s * 0.2);
    turret.add(barrel);
  }
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.5), glowMat(FUT_GLOW, 0.95));
  eye.position.set(0.42, 0.05, 0); turret.add(eye);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.9, 6), pbr('#1c1c20', 0.8));
  antenna.position.set(-0.3, 0.55, -0.25); turret.add(antenna);
  b.add(turret);
  return { body: b, head: turret, height: 2.6 };
}

function buildSuperSoldier(accent) {
  const b = new THREE.Group();
  const armor = pbr(FUT_PLATE, 0.6, 0.55);
  const legL = leg(0.15, 1.0, pbr(FUT_DARK, 0.7, 0.25)); legL.position.set(0, 1.1, 0.2);
  const legR = leg(0.15, 1.0, pbr(FUT_DARK, 0.7, 0.25)); legR.position.set(0, 1.1, -0.2);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.15;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.8, 12), armor);
  chest.position.y = 0.42; torso.add(chest);
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), armor);
    pad.position.set(0.05, 0.72, s * 0.48); torso.add(pad);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glowMat(FUT_GLOW, 0.95));
  core.position.set(0.36, 0.4, 0); torso.add(core);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 18), pbr(accent, 0.6));
  stripe.rotation.x = Math.PI / 2; stripe.position.y = 0.1; torso.add(stripe);
  b.add(torso);
  const armL = arm(0.12, 0.72, armor); armL.position.set(0, 1.82, 0.5);
  const armR = arm(0.12, 0.72, armor, energyBlade(1.0)); armR.position.set(0, 1.82, -0.5);
  b.add(armL, armR);
  // heavy pauldrons, a large backpack cell and a helm crest: elite read.
  pauldron(b, armor, 0, 1.9, 0.54, 0.2);
  pauldron(b, armor, 0, 1.9, -0.54, 0.2);
  powerPack(b, -0.46, 1.58, 1.2);
  const head = new THREE.Group(); head.position.y = 2.24;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), pbr(FUT_DARK, 0.6, 0.4)));
  visor(head);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), pbr(accent, 0.6));
  crest.position.y = 0.27; head.add(crest);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.8 };
}

function buildTitan(accent) {
  const b = new THREE.Group();
  const armor = pbr(FUT_PLATE, 0.55, 0.55);
  const legL = leg(0.16, 1.05, pbr(FUT_DARK, 0.7, 0.25)); legL.position.set(0, 1.15, 0.22);
  const legR = leg(0.16, 1.05, pbr(FUT_DARK, 0.7, 0.25)); legR.position.set(0, 1.15, -0.22);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.2;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.47, 0.85, 12), armor);
  chest.position.y = 0.44; torso.add(chest);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 20), pbr(GOLD, 0.5, 0.7));
  trim.rotation.x = Math.PI / 2; trim.position.y = 0.72; torso.add(trim);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.3), pbr(accent, 0.5));
  crest.position.set(-0.1, 0.85, 0); torso.add(crest);
  b.add(torso);
  const cannon = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.9, 10), pbr(FUT_DARK, 0.5, 0.6));
  tube.rotation.z = Math.PI / 2 - 0.1; tube.position.set(0.3, -0.6, 0); cannon.add(tube);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glowMat(FUT_GLOW, 0.95));
  muzzle.position.set(0.72, -0.65, 0); cannon.add(muzzle);
  const charge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.14), glowMat(FUT_GLOW, 0.9));
  charge.position.set(0.05, -0.55, 0); cannon.add(charge);
  const armL = arm(0.13, 0.75, armor); armL.position.set(0, 1.9, 0.52);
  const armR = arm(0.13, 0.75, armor, cannon); armR.position.set(0, 1.9, -0.52);
  b.add(armL, armR);
  // siege pauldrons over the arm joints.
  pauldron(b, armor, 0, 1.98, 0.56, 0.2);
  pauldron(b, armor, 0, 1.98, -0.56, 0.2);
  const head = new THREE.Group(); head.position.y = 2.36;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), pbr(FUT_DARK, 0.6, 0.4)));
  visor(head);
  b.add(head);
  const aura = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.055, 8, 32),
    glowMat('#ffd23a', 0.55)
  );
  aura.rotation.x = Math.PI / 2; aura.position.y = 0.08;
  b.add(aura);
  // arm cannon: the strike anim braces and fires forward, never overhead.
  return { body: b, legL, legR, armL, armR, head, height: 3.0, aura, thrust: true };
}

const BUILDERS = {
  0: { melee: buildClubman, ranged: buildSlinger, fast: buildDinoRider },
  1: { melee: buildSwordsman, ranged: buildArcher, fast: buildKnight },
  2: { melee: buildDueler, ranged: buildMusketeer, siege: buildCannoneer },
  3: { melee: buildMeleeInfantry, ranged: buildInfantry, armored: buildTank },
  4: { melee: buildGodsBlade, ranged: buildBlasterUnit, armored: buildWarMachine, elite: buildSuperSoldier },
};
const HEROES = { 0: buildShaman, 1: buildPaladin, 2: buildWarEngineer, 3: buildCommander, 4: buildTitan };

export function UnitMesh(entity, ageIndex) {
  // Unknown ages reuse the Stone rigs so evolve never renders a missing mesh.
  const age = BUILDERS[ageIndex] ? ageIndex : 0;
  const accent = SIDE_ACCENT[entity.side] || SIDE_ACCENT.player;
  const rig = entity.isHero ? (HEROES[age] || buildShaman)(accent)
    : ((BUILDERS[age] || BUILDERS[0])[entity.type] || buildClubman)(accent);

  const mesh = new THREE.Group();
  mesh.add(rig.body);
  // heroes stand taller than line troops and carry a gold ring so they read
  // as heroes at lane distance; heroS rides every body-scale write below.
  const heroS = entity.isHero ? 1.18 : 1;
  const bar = makeHpBar(entity.isHero ? 1.8 : 1.3);
  bar.sprite.position.y = rig.height * heroS + 0.35;
  bar.sprite.visible = false;
  mesh.add(bar.sprite);
  solidify(mesh);
  const mats = cloneMats(mesh);
  for (const m of mats) {
    if ('emissive' in m) { m.emissive = new THREE.Color('#000000'); m.transparent = true; }
  }
  const ringR = THREE.MathUtils.clamp(rig.height * 0.35, 0.5, 1.5);
  mesh.add(teamRing(ringR * heroS, accent));
  if (entity.isHero) mesh.add(teamRing(ringR * heroS * 1.3, '#ffd23a', 0.9));

  let facing = entity.side === 'player' ? 0 : Math.PI;
  mesh.rotation.y = facing;
  // thrust rigs (lance, musket) drive the weapon forward; capture the rest
  // pose once so the snap always returns to it.
  let armRx = null;

  function setFlash(on) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(on ? 0xffffff : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = on ? 0.3 : 1;
    }
  }

  return {
    mesh,
    update(dt, e) {
      void dt;
      mesh.position.set(toMeters(e.x), 0, e.z || 0);
      facing = e.side === 'player' ? 0 : Math.PI;
      mesh.rotation.y = facing;

      const t = e.walkPhase * 4;
      const swing = Math.sin(t);
      if (rig.legL) {
        rig.legL.rotation.z = swing * 0.55;
        rig.legR.rotation.z = -swing * 0.55;
        rig.body.position.y = Math.abs(Math.cos(t)) * 0.06;
      } else {
        rig.body.position.y = Math.sin(t * 0.5) * 0.04; // robed hover-glide
      }
      if (rig.tail) rig.tail.rotation.y = Math.sin(t * 0.5) * 0.25;

      // attack swing: short windup (raise) then fast snap, plus a lunge
      // so strikes read as actions instead of a looping wave.
      let strike = 0;
      if (e.attackSpeed > 0 && e.attackCooldown > 0) {
        const k = 1 - e.attackCooldown / e.attackSpeed;
        if (k >= 0 && k < 0.45) {
          strike = k < 0.18
            ? -0.6 * (k / 0.18)
            : Math.sin(((k - 0.18) / 0.27) * Math.PI * 0.5);
        }
      }
      if (rig.head && !rig.dino) rig.head.rotation.y = Math.sin(t * 0.25) * 0.12;
      if (rig.thrust && rig.armR) {
        // couched thrust: gather back on windup, punch forward on the snap.
        if (armRx === null) armRx = rig.armR.position.x;
        rig.armR.rotation.z = (rig.dino ? -0.3 : 0) + Math.max(0, -strike) * 0.12;
        rig.armR.position.x = armRx + (strike > 0 ? strike * 0.55 : strike * 0.2);
        if (rig.armL) rig.armL.rotation.z = swing * 0.15;
        rig.body.rotation.y = strike * 0.06;
        rig.body.position.x = strike > 0 ? strike * 0.3 : 0;
      } else {
        if (rig.armR) rig.armR.rotation.z = -strike * 1.9 + (rig.dino ? -0.3 : 0);
        if (rig.armL && !rig.dino) rig.armL.rotation.z = swing * 0.3 - Math.max(0, -strike) * 0.5;
        rig.body.rotation.y = strike * 0.14;
        rig.body.position.x = strike > 0 ? strike * 0.14 : 0;
      }
      // hit pop: brief squash on the 0.1s hitFlash so impacts land visually.
      if (e.hitFlash > 0) {
        const pop = Math.min(1, e.hitFlash / 0.1);
        rig.body.scale.set(heroS * (1 + pop * 0.05), heroS * (1 - pop * 0.05), heroS * (1 + pop * 0.05));
      } else {
        rig.body.scale.set(heroS, heroS, heroS);
      }
      if (rig.aura) {
        const s = 1 + Math.sin(performance.now() * 0.004) * 0.07;
        rig.aura.scale.set(s, s, 1);
      }

      setFlash(e.hitFlash > 0);

      if (e.dying || !e.alive) {
        const raw = Math.min(1, (e.deathTimer || 0) / 0.35);
        // fast fall with a small settle bounce instead of a linear topple.
        const p = raw < 0.7
          ? (raw / 0.7) * (raw / 0.7)
          : 1 - Math.sin((raw - 0.7) / 0.3 * Math.PI) * 0.08;
        rig.body.rotation.x = p * 1.45;
        rig.body.position.y = -p * 0.15;
        rig.body.position.x = 0;
        if (rig.thrust && rig.armR && armRx !== null) rig.armR.position.x = armRx;
        rig.body.scale.set(heroS, heroS * (1 - p * 0.22), heroS);
        for (const m of mats) m.opacity = 1 - raw * 0.45;
        bar.sprite.visible = false;
      } else {
        rig.body.rotation.x = 0;
        for (const m of mats) m.opacity = 1;
        const frac = e.hp / e.maxHp;
        bar.sprite.visible = frac < 0.999;
        if (bar.sprite.visible) bar.set(frac);
      }
    },
    dispose() {
      disposeDeep(mesh);
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
}
