import * as THREE from 'three';
import { toMeters } from '../simulation/config.js';
import {
  pbr, basic, glowMat, solidify, cloneMats, makeHpBar, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Procedural Stone Age units, Clash-Royale chunky style. Every model faces +X;
// the outer group yaws PI for enemy units. Inner `body` group carries walk,
// attack and death poses so facing never fights animation.
//
// Contract: UnitMesh(entity, ageIndex) -> { mesh, update(dt, entity), dispose() }
// Works for any age (falls back to the melee rig for unknown types).

const SKIN = '#c98d5f';
const SKIN_DK = '#a06a42';
const FUR = '#6b4a2f';
const FUR_DK = '#4a3120';
const WOOD = '#7a5230';
const WOOD_DK = '#54371f';
const STONE = '#8d8d94';
const BONE = '#e8dcc0';

function leg(r, len, mat) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, len, 8), mat);
  m.position.y = -len / 2;
  g.add(m);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.2), pbr(FUR_DK, 0.95));
  foot.position.set(0.06, -len + 0.06, 0);
  g.add(foot);
  return g;
}

function arm(r, len, mat, hand) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, len, 8), mat);
  m.position.y = -len / 2;
  g.add(m);
  if (hand) {
    hand.position.y = -len;
    g.add(hand);
  }
  return g;
}

function eyes(head, y, xOff, spread = 0.13) {
  for (const s of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), basic('#ffffff'));
    white.position.set(xOff, y, s * spread);
    head.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), basic('#1a1210'));
    pupil.position.set(xOff + 0.055, y, s * spread);
    head.add(pupil);
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
  const skin = pbr(SKIN, 0.75);
  const legL = leg(0.11, 0.85, skin); legL.position.set(0, 0.95, 0.16);
  const legR = leg(0.11, 0.85, skin); legR.position.set(0, 0.95, -0.16);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 1.0;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.62, 10), skin);
  chest.position.y = 0.32; torso.add(chest);
  const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, 0.3, 10), pbr(FUR, 0.95));
  tunic.position.y = 0.02; torso.add(tunic);
  warPaint(torso, accent);
  b.add(torso);
  const armL = arm(0.09, 0.6, skin); armL.position.set(0, 1.52, 0.36);
  const armR = arm(0.09, 0.6, skin, club(1)); armR.position.set(0, 1.52, -0.36);
  b.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 1.86;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), skin);
  head.add(skull);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), pbr(SKIN_DK, 0.8));
  jaw.position.set(0.12, -0.16, 0); head.add(jaw);
  const hair = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.3, 10), pbr('#2e2018', 0.95));
  hair.position.y = 0.26; head.add(hair);
  eyes(head, 0.04, 0.2);
  headband(head, 0.12, accent);
  b.add(head);
  return { body: b, legL, legR, armL, armR, head, height: 2.1 };
}

function buildSlinger(accent) {
  const b = new THREE.Group();
  const skin = pbr(SKIN, 0.75);
  const legL = leg(0.09, 0.8, skin); legL.position.set(0, 0.9, 0.14);
  const legR = leg(0.09, 0.8, skin); legR.position.set(0, 0.9, -0.14);
  b.add(legL, legR);
  const torso = new THREE.Group(); torso.position.y = 0.95;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.58, 10), skin);
  chest.position.y = 0.3; torso.add(chest);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.12), pbr(accent, 0.7));
  strap.position.set(0, 0.36, 0); strap.rotation.x = 0.5; torso.add(strap);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.24, 10), pbr(FUR, 0.95));
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
  const mop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), pbr('#3a2a1a', 0.95));
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
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), basic('#ffffff'));
    white.position.set(0.12, 0.14, s * 0.2); dhead.add(white);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), basic('#1a1210'));
    pupil.position.set(0.19, 0.14, s * 0.2); dhead.add(pupil);
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
  const skin = pbr(SKIN, 0.75);
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
  const skin = pbr(SKIN, 0.75);
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.5, 12), pbr('#5a3a6a', 0.85));
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
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 6), pbr(accent, 0.7));
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

const BUILDERS = { melee: buildClubman, ranged: buildSlinger, fast: buildDinoRider };

export function UnitMesh(entity, ageIndex) {
  void ageIndex;
  const accent = SIDE_ACCENT[entity.side] || SIDE_ACCENT.player;
  const rig = entity.isHero ? buildShaman(accent)
    : (BUILDERS[entity.type] || buildClubman)(accent);

  const mesh = new THREE.Group();
  mesh.add(rig.body);
  const bar = makeHpBar(entity.isHero ? 1.8 : 1.3);
  bar.sprite.position.y = rig.height + 0.35;
  bar.sprite.visible = false;
  mesh.add(bar.sprite);
  solidify(mesh);
  const mats = cloneMats(mesh);
  for (const m of mats) {
    if ('emissive' in m) { m.emissive = new THREE.Color('#000000'); m.transparent = true; }
  }

  let facing = entity.side === 'player' ? 0 : Math.PI;
  mesh.rotation.y = facing;

  function setFlash(on) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(on ? 0xffffff : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = on ? 0.55 : 1;
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

      // attack swing: cooldown counts attackSpeed -> 0 after each strike
      let strike = 0;
      if (e.attackSpeed > 0 && e.attackCooldown > 0) {
        const k = 1 - e.attackCooldown / e.attackSpeed;
        if (k >= 0 && k < 0.4) strike = Math.sin((k / 0.4) * Math.PI);
      }
      if (rig.armR) rig.armR.rotation.z = -strike * 1.9 + (rig.dino ? -0.3 : 0);
      if (rig.armL && !rig.dino) rig.armL.rotation.z = swing * 0.3;
      if (rig.head && !rig.dino) rig.head.rotation.y = Math.sin(t * 0.25) * 0.12;
      if (rig.aura) {
        const s = 1 + Math.sin(performance.now() * 0.004) * 0.07;
        rig.aura.scale.set(s, s, 1);
      }

      setFlash(e.hitFlash > 0);

      if (e.dying || !e.alive) {
        const p = Math.min(1, (e.deathTimer || 0) / 0.35);
        rig.body.rotation.x = p * 1.45;
        rig.body.position.y = -p * 0.15;
        for (const m of mats) m.opacity = 1 - p * 0.45;
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
