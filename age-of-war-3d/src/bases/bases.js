import * as THREE from 'three';
import {
  pbr, basic, glowMat, glowSprite, jitterGeo, mottleGeo, rockMat, solidify, cloneMats, makeHpBar, makeCloth, bannerMat, teamRing, disposeDeep, SIDE_ACCENT,
} from '../core/pbr.js';

// Strongholds, one per age: Stone is a great-menhir core ringed by a timber
// palisade, skull totems and a war banner; Castle is a crenellated keep with
// corner turret, curtain wall, gatehouse and braziers. Both face +X for the
// player, -X for the enemy, and fly the owner's color on shared cloth.
//
// Contract: BaseMesh(side, ageIndex) -> { mesh, setHp(frac), update(dt), dispose() }
// Unknown ages reuse the Stone hold so evolve never renders a missing mesh.

const WOOD = '#8a5f36';
const WOOD_DK = '#654522';
const BASALT = '#4f4a44';
const BASALT_DK = '#37332e';
const BONE = '#e8dcc0';
const FUR = '#5a3d26';

function menhir(h, r, mat) {
  // Faceted AAA rock: jittered silhouette + seeded per-vertex mottling.
  const g = new THREE.CylinderGeometry(r * 0.75, r, h, 9);
  jitterGeo(g, 0.09, 2.2, r * 7 + h);
  mottleGeo(g, 0.14, (r * 13 + h * 7) | 0);
  const hex = '#' + mat.color.getHexString();
  return new THREE.Mesh(g, rockMat(hex, 0.95));
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

function buildStoneHold(accent, mirror, side) {
  const mesh = new THREE.Group();

  // foundation mound
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 0.7, 18), pbr('#6e5a44', 0.95));
  mound.position.y = 0.3;
  mesh.add(mound);

  // great menhir core with glowing rune band: dark basalt with strata rings
  const core = menhir(7.5, 1.5, pbr(BASALT, 0.95));
  core.position.y = 3.9;
  mesh.add(core);
  for (const [by, br, spin] of [[2.4, 1.43, 0.2], [4.6, 1.32, 0.5], [6.6, 1.22, 0.9]]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(br, br, 0.22, 7), pbr(BASALT_DK, 1));
    band.position.y = by;
    band.rotation.y = spin;
    mesh.add(band);
  }
  const cap = menhir(1.6, 1.1, pbr(BASALT_DK, 1));
  cap.position.y = 8.0;
  mesh.add(cap);
  const rune = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.09, 8, 24),
    glowMat(side === 'player' ? '#5aa2ff' : '#ff6a5a', 0.8)
  );
  rune.rotation.x = Math.PI / 2;
  rune.position.y = 5.4;
  mesh.add(rune);

  // palisade arc facing the battlefield: varied heights, girth, lean and
  // twist so the wall reads as hand-raised timber, not a picket-fence clone.
  const palMat = pbr(WOOD, 0.9);
  const palMatDk = pbr(WOOD_DK, 0.9);
  for (let i = -3; i <= 3; i++) {
    const k = (i * 2.7 + 1.3);
    const wob = Math.sin(k * 12.9) * 0.5 + Math.sin(k * 5.1) * 0.5;
    const h = 3.2 + (i % 2 === 0 ? 0.35 : 0) + wob * 0.28;
    const girth = 0.22 * (1 + wob * 0.12);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(girth * 0.92, girth * 1.15, h, 7), (i + 3) % 2 ? palMat : palMatDk);
    const a = (i / 3) * 0.62 + wob * 0.03;
    log.position.set(Math.cos(a) * 3.1 * mirror, h / 2 + 0.4, Math.sin(a) * 3.4);
    log.rotation.set(wob * 0.04, wob * 0.6, wob * 0.05);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(girth, 0.5 + wob * 0.12, 7), palMatDk);
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

  // war banner on the menhir, hoist pinned to the pole
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8), palMatDk);
  bannerPole.position.set(-0.6 * mirror, 8.6, 0);
  mesh.add(bannerPole);
  const cloth = makeCloth(1.7, 1.0, 6, bannerMat(accent, 'disc'));
  const flag = cloth.mesh;
  flag.position.set(-0.6 * mirror, 9.6, 0);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);

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
  const dmg2 = rubble(pbr(BASALT_DK, 1)); // < 66%: cracks + lean
  const dmg1 = new THREE.Group(); // < 33%: banner torn, core tilted, fire out
  const fallen = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.4, 7), palMatDk);
  fallen.position.set(2.2 * mirror, 0.9, -2.4);
  fallen.rotation.z = Math.PI / 2.2;
  fallen.rotation.y = 0.5;
  dmg1.add(fallen);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  // HP bar, shadows and facing are owned by the BaseMesh dispatcher below.
  let t = Math.random() * 10;
  return {
    group: mesh,
    setHp(f) {
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      core.rotation.z = f < 0.33 ? 0.06 : 0;
      flame.visible = f > 0.05;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      cloth.update(t);
      // fire flicker
      if (flame.visible) {
        const f = 1 + Math.sin(t * 13) * 0.15 + Math.sin(t * 29) * 0.08;
        flame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
        ember.scale.setScalar(1 + Math.sin(t * 17) * 0.12);
      }
      rune.rotation.z = t * 0.4;
    },
  };
}

const CASTLE_STONE = '#8d8d94';
const CASTLE_DK = '#6e6e76';
const REN_PLASTER = '#c8a878';
const REN_TRIM = '#a85a3a';
const REN_DOME = '#3f7a5e';
const IRON = '#5a6068';

function crenellate(g, w, d, y, mat) {
  const nx = Math.max(2, Math.round(w / 0.7));
  const nz = Math.max(2, Math.round(d / 0.7));
  for (let i = 0; i < nx; i++) {
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.3), mat);
      m.position.set(-w / 2 + (i + 0.5) * (w / nx), y, s * (d / 2));
      g.add(m);
    }
  }
  for (let i = 0; i < nz; i++) {
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.4), mat);
      m.position.set(s * (w / 2), y, -d / 2 + (i + 0.5) * (d / nz));
      g.add(m);
    }
  }
}

function rubble(mat) {
  const dmg2 = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.5 + i * 0.2, 0.4, 0.8), mat);
    slab.position.set((Math.sin(i * 2.4) * 2.4), 0.75, Math.cos(i * 1.7) * 2.8);
    slab.rotation.set(i, i * 2, 0.4);
    dmg2.add(slab);
  }
  return dmg2;
}

function brazier(mat) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.0, 8), mat);
  stem.position.y = 0.5; g.add(stem);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.2, 0.4, 10), mat);
  bowl.position.y = 1.0; g.add(bowl);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 8), glowMat('#ff9a3a', 0.9));
  flame.position.y = 1.5; g.add(flame);
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat('#ffd23a', 0.9));
  ember.position.y = 1.25; g.add(ember);
  const halo = glowSprite('#ff9a3a', 0.5, 1.6);
  halo.position.y = 1.5; g.add(halo);
  return { group: g, flame, ember };
}

function buildCastleKeep(accent, mirror) {
  const mesh = new THREE.Group();
  const stone = pbr(CASTLE_STONE, 0.9);
  const stoneDk = pbr(CASTLE_DK, 0.95);

  // foundation platform: broken ground silhouette + trampled dirt skirt.
  const moundGeo = new THREE.CylinderGeometry(4.0, 4.8, 0.7, 18);
  jitterGeo(moundGeo, 0.08, 2.0, 41);
  mottleGeo(moundGeo, 0.12, 41);
  const mound = new THREE.Mesh(moundGeo, rockMat(CASTLE_DK, 0.95));
  mound.position.y = 0.3;
  mesh.add(mound);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.1, 0.16, 18), pbr('#4a3b2c', 0.98));
  skirt.position.y = 0.05;
  mesh.add(skirt);

  // keep core with stone course bands
  const keep = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.0, 3.2), stone);
  keep.position.y = 3.15;
  mesh.add(keep);
  for (const y of [1.9, 3.6]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.22, 3.3), stoneDk);
    band.position.y = y;
    mesh.add(band);
  }
  // corner quoins: alternating proud blocks so the keep reads as laid masonry.
  for (let qi = 0; qi < 5; qi++) {
    const qy = 1.15 + qi * 0.95;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.36), (qi % 2 ? stone : stoneDk));
      q.position.set(sx * 1.62, qy, sz * 1.62);
      mesh.add(q);
    }
  }
  crenellate(mesh, 3.2, 3.2, 5.85, stoneDk);

  // corner turret with the owner's color on the cone roof
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 1.8, 12), stone);
  turret.position.set(-0.9 * mirror, 6.4, -0.9);
  mesh.add(turret);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.2, 12), pbr(accent, 0.7));
  roof.position.set(-0.9 * mirror, 7.9, -0.9);
  mesh.add(roof);

  // lit slit windows on the battlefield face, darkened as the keep falls
  const windows = [];
  for (const [wy, off] of [[4.6, -0.8], [4.6, 0.8], [3.4, 0]]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.28), glowMat('#ffca5a', 0.9));
    w.position.set(1.62 * mirror, wy, off);
    mesh.add(w);
    windows.push(w);
  }

  // heater shield in the owner's color over the gate
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.15, 3), pbr(accent, 0.65));
  shield.rotation.z = Math.PI / 2;
  shield.position.set(1.65 * mirror, 5.3, 0);
  mesh.add(shield);

  // curtain wall arc facing the battlefield, gate in the middle.
  // Per-seg groups carry merlons + arrow slit so dressing follows wall yaw.
  const slitMat = basic('#14141c');
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const a = (i / 2) * 0.55;
    const segG = new THREE.Group();
    segG.position.set(Math.cos(a) * 3.4 * mirror, 0, Math.sin(a) * 3.7);
    segG.rotation.y = -a * mirror;
    mesh.add(segG);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.6, 1.7), (i % 2 ? stone : stoneDk));
    seg.position.y = 1.9;
    segG.add(seg);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.8), stoneDk);
    cap.position.y = 3.35;
    segG.add(cap);
    for (const mz of [-0.55, 0, 0.55]) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.28), stone);
      merlon.position.set(0, 3.68, mz);
      segG.add(merlon);
    }
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.14), slitMat);
    slit.position.set(0.3 * mirror, 2.5, 0);
    segG.add(slit);
  }
  // gatehouse: jambs + lintel + dark opening + portcullis bars
  for (const s of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.0, 0.6), stoneDk);
    jamb.position.set(3.4 * mirror, 2.1, s * 1.0);
    mesh.add(jamb);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 2.6), stoneDk);
  lintel.position.set(3.4 * mirror, 3.8, 0);
  mesh.add(lintel);
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), basic('#0a0a12'));
  opening.position.set(3.35 * mirror, 2.0, 0);
  opening.rotation.y = mirror > 0 ? Math.PI / 2 : -Math.PI / 2;
  mesh.add(opening);
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.6, 6), pbr(IRON, 0.6));
    bar.position.set(3.28 * mirror, 2.0, i * 0.28);
    mesh.add(bar);
  }

  // braziers flanking the gate
  const braziers = [];
  for (const s of [-1, 1]) {
    const br = brazier(stoneDk);
    br.group.position.set(2.4 * mirror, 0.6, s * 2.6);
    mesh.add(br.group);
    braziers.push(br);
  }

  // war banner on the keep, hoist pinned to the pole
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 8), pbr(WOOD_DK, 0.9));
  bannerPole.position.set(1.0 * mirror, 6.9, 1.0);
  mesh.add(bannerPole);
  const cloth = makeCloth(1.6, 0.95, 6, bannerMat(accent, 'cross'));
  const flag = cloth.mesh;
  flag.position.set(1.0 * mirror, 7.85, 1.0);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);

  const dmg2 = rubble(stoneDk);
  const dmg1 = new THREE.Group(); // < 33%: windows out, one brazier out, banner torn
  const fallen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), stoneDk);
  fallen.position.set(2.4 * mirror, 0.9, -2.6);
  fallen.rotation.set(0.3, 0.6, 0.2);
  dmg1.add(fallen);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  let t = Math.random() * 10;
  return {
    group: mesh,
    setHp(f) {
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      for (const w of windows) w.visible = f > 0.33;
      braziers[1].flame.visible = f > 0.33;
      braziers[1].ember.visible = f > 0.33;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      cloth.update(t);
      for (const br of braziers) {
        if (!br.flame.visible) continue;
        const k = 1 + Math.sin(t * 13 + br.group.position.z) * 0.15;
        br.flame.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      }
    },
  };
}

function buildRenaissancePalazzo(accent, mirror) {
  const mesh = new THREE.Group();
  const plaster = pbr(REN_PLASTER, 0.95);
  const trim = pbr(REN_TRIM, 0.9);
  const stoneDk = pbr(CASTLE_DK, 0.95);

  // rusticated stone base + plaster piano nobile
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 4.2), stoneDk);
  base.position.y = 0.8;
  mesh.add(base);
  const piano = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 3.8), plaster);
  piano.position.y = 2.9;
  mesh.add(piano);
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 4.2), trim);
  cornice.position.y = 4.35;
  mesh.add(cornice);
  // corner bastions with little domes
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const bast = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.2, 10), stoneDk);
      bast.position.set(sx * 1.9 * mirror, 1.1, sz * 1.9);
      mesh.add(bast);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        pbr(REN_DOME, 0.7));
      cap.position.set(sx * 1.9 * mirror, 2.2, sz * 1.9);
      mesh.add(cap);
    }
  }
  // central drum + verdigris dome
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.0, 12), plaster);
  drum.position.y = 5.0;
  mesh.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(REN_DOME, 0.65));
  dome.position.y = 5.5;
  mesh.add(dome);
  // lit arcade windows facing the field (+x), out below 33%
  const windows = [];
  const winM = new THREE.MeshBasicMaterial({ color: '#ffca6a' });
  const shutterM = pbr(WOOD_DK, 0.9);
  for (const wy of [2.4, 3.4]) {
    for (const off of [-1.1, 0, 1.1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.7), winM);
      w.position.set(1.92 * mirror, wy, off);
      w.rotation.y = mirror > 0 ? Math.PI / 2 : -Math.PI / 2;
      mesh.add(w);
      windows.push(w);
      // stone architrave: lintel + sill so windows sit in the wall, not on it.
      for (const ly of [wy + 0.41, wy - 0.41]) {
        const lin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.68), trim);
        lin.position.set(1.92 * mirror, ly, off);
        mesh.add(lin);
      }
      // folded wooden shutters flanking each window.
      for (const s of [-1, 1]) {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.3), shutterM);
        sh.position.set(1.92 * mirror, wy, off + s * 0.39);
        mesh.add(sh);
      }
    }
  }
  // string course over the rusticated base + corner lesene on the piano nobile.
  const course = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.18, 4.0), trim);
  course.position.y = 1.68;
  mesh.add(course);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const les = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), trim);
    les.position.set(sx * 1.9 * mirror, 2.9, sz * 1.9);
    mesh.add(les);
  }
  // arched gate with torches
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.5),
    new THREE.MeshBasicMaterial({ color: '#0a0a12' }));
  opening.position.set(2.12 * mirror, 0.85, 0);
  opening.rotation.y = mirror > 0 ? Math.PI / 2 : -Math.PI / 2;
  mesh.add(opening);
  const torches = [];
  for (const s of [-1, 1]) {
    const br = brazier(stoneDk);
    br.group.position.set(2.2 * mirror, 0.4, s * 1.8);
    mesh.add(br.group);
    torches.push(br);
  }
  // war banner on the cornice, hoist pinned to the pole
  const bannerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.4, 8), pbr(WOOD_DK, 0.9));
  bannerPole.position.set(-1.0 * mirror, 5.6, 1.2);
  mesh.add(bannerPole);
  const cloth = makeCloth(1.6, 0.95, 6, bannerMat(accent, 'chevron'));
  const flag = cloth.mesh;
  flag.position.set(-1.0 * mirror, 6.45, 1.2);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);

  const dmg2 = rubble(stoneDk);
  const dmg1 = new THREE.Group(); // < 33%: windows out, one torch out, banner torn
  const fallen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), trim);
  fallen.position.set(2.4 * mirror, 0.7, -2.4);
  fallen.rotation.set(0.3, 0.6, 0.2);
  dmg1.add(fallen);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  let t = Math.random() * 10;
  return {
    group: mesh,
    setHp(f) {
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      for (const w of windows) w.visible = f > 0.33;
      torches[1].flame.visible = f > 0.33;
      torches[1].ember.visible = f > 0.33;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      cloth.update(t);
      for (const br of torches) {
        if (!br.flame.visible) continue;
        const k = 1 + Math.sin(t * 13 + br.group.position.z) * 0.15;
        br.flame.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      }
    },
  };
}

const MOD_CONCRETE = '#7a7a72';
const MOD_DK = '#54544e';
const MOD_SAND = '#8a7a5a';

function buildModernBunker(accent, mirror) {
  const mesh = new THREE.Group();
  const concrete = pbr(MOD_CONCRETE, 0.95);
  const dark = pbr(MOD_DK, 0.95);

  // sandbag ring + concrete pillbox with a barrel-vault roof
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), pbr(MOD_SAND, 1.0));
    bag.scale.set(1.25, 0.55, 0.8);
    bag.position.set(Math.cos(a) * 3.1 * mirror, 0.24, Math.sin(a) * 3.1);
    bag.rotation.y = -a;
    mesh.add(bag);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.8, 3.2), dark);
  body.position.y = 0.9;
  mesh.add(body);
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.4, 12, 1, false, 0, Math.PI),
    concrete);
  vault.rotation.z = Math.PI / 2;
  vault.position.y = 1.8;
  mesh.add(vault);
  // firing slit facing the field (+x), dark when ruined
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.35),
    new THREE.MeshBasicMaterial({ color: '#ffca6a' }));
  slit.position.set(2.22 * mirror, 1.1, 0);
  slit.rotation.y = mirror > 0 ? Math.PI / 2 : -Math.PI / 2;
  mesh.add(slit);
  // antenna mast + dish on the roof
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6), pbr(IRON, 0.6));
  mast.position.set(-1.2 * mirror, 4.6, -0.8);
  mesh.add(mast);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(IRON, 0.5));
  dish.position.set(-1.2 * mirror, 3.6, -0.8);
  dish.rotation.z = mirror > 0 ? -1.1 : 1.1;
  mesh.add(dish);
  // signal pennant on the mast, hoist pinned to the pole
  const cloth = makeCloth(1.4, 0.5, 6, bannerMat(accent, 'bolt'));
  const flag = cloth.mesh;
  flag.position.set(-1.2 * mirror, 5.9, -0.8);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);

  const dmg2 = rubble(dark);
  const dmg1 = new THREE.Group(); // < 33%: slit dark, mast snapped, pennant torn
  const snapped = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 6), pbr(IRON, 0.6));
  snapped.position.set(1.8 * mirror, 0.9, 1.8);
  snapped.rotation.set(0.4, 0, Math.PI / 2.3);
  dmg1.add(snapped);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  let t = Math.random() * 10;
  return {
    group: mesh,
    setHp(f) {
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      slit.material.color.set(f > 0.33 ? '#ffca6a' : '#0c0e0c');
      mast.visible = f > 0.33;
      dish.visible = f > 0.33;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      cloth.update(t);
    },
  };
}

const FUT_ALLOY = '#1c2940';
const FUT_DARK = '#0d1522';

function buildFutureCitadel(accent, mirror) {
  const mesh = new THREE.Group();
  const alloy = pbr(FUT_ALLOY, 0.6);
  const dark = pbr(FUT_DARK, 0.7);

  // octagonal plinth + tapered command spire
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, 0.8, 8), dark);
  plinth.position.y = 0.4;
  mesh.add(plinth);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.9, 5.2, 6), alloy);
  spire.position.y = 3.4;
  mesh.add(spire);
  // lit window strips facing the field (+x), dark when ruined
  const strips = [];
  for (const wy of [2.2, 3.4, 4.6]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28),
      new THREE.MeshBasicMaterial({ color: '#00e5ff' }));
    s.position.set(1.62 * mirror, wy, 0);
    s.rotation.y = mirror > 0 ? Math.PI / 2 : -Math.PI / 2;
    mesh.add(s);
    strips.push(s);
  }
  // glowing crown ring + beacon mast
  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.09, 8, 24), glowMat('#00e5ff', 0.9));
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 6.1;
  mesh.add(crown);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), dark);
  mast.position.y = 6.9;
  mesh.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), glowMat('#00e5ff', 1));
  beacon.position.y = 7.7;
  mesh.add(beacon);
  // dome annex + side-color banner on a pole
  const annex = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  annex.position.set(-2.2 * mirror, 0, 1.6);
  mesh.add(annex);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6), dark);
  pole.position.set(-2.2 * mirror, 2.2, -1.4);
  mesh.add(pole);
  const cloth = makeCloth(1.5, 0.9, 6, bannerMat(accent, 'crescent'));
  const flag = cloth.mesh;
  flag.position.set(-2.2 * mirror, 3.1, -1.4);
  if (mirror < 0) flag.rotation.y = Math.PI;
  mesh.add(flag);

  const dmg2 = rubble(dark);
  const dmg1 = new THREE.Group(); // < 33%: strips dark, crown out, banner torn
  const fallen = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 6), dark);
  fallen.position.set(2.0 * mirror, 0.7, -1.8);
  fallen.rotation.set(0.3, 0.4, Math.PI / 2.2);
  dmg1.add(fallen);
  mesh.add(dmg2, dmg1);
  dmg2.visible = false;
  dmg1.visible = false;

  let t = Math.random() * 10;
  return {
    group: mesh,
    setHp(f) {
      dmg2.visible = f < 0.66;
      dmg1.visible = f < 0.33;
      for (const s of strips) s.material.color.set(f > 0.33 ? '#00e5ff' : '#0d1522');
      crown.visible = f > 0.33;
      beacon.visible = f > 0.05;
      mast.visible = f > 0.33;
      const s = 0.55 + f * 0.45;
      flag.scale.set(s, f < 0.33 ? 0.7 : 1, 1);
    },
    update(dt) {
      t += dt;
      cloth.update(t);
    },
  };
}

export function BaseMesh(side, ageIndex) {
  // Unknown ages reuse the Stone hold so evolve never renders a missing mesh.
  const accent = SIDE_ACCENT[side] || SIDE_ACCENT.player;
  const mirror = side === 'player' ? 1 : -1;

  const mesh = new THREE.Group();
  const inner = ageIndex === 4
    ? buildFutureCitadel(accent, mirror)
    : ageIndex === 3
    ? buildModernBunker(accent, mirror)
    : ageIndex === 2
    ? buildRenaissancePalazzo(accent, mirror)
    : ageIndex === 1
      ? buildCastleKeep(accent, mirror)
      : buildStoneHold(accent, mirror, side);
  mesh.add(inner.group);

  // HP bar rides over the stronghold, Clash-style
  const bar = makeHpBar(4.2);
  bar.sprite.position.y = 8.4;
  bar.set(1);
  mesh.add(bar.sprite);

  solidify(mesh);
  cloneMats(mesh);
  mesh.rotation.y = mirror > 0 ? 0 : Math.PI;
  mesh.add(teamRing([5.2, 6.2, 6.2, 5.4, 6.0][ageIndex] || 5.2, accent));

  return {
    mesh,
    setHp(frac) {
      const f = THREE.MathUtils.clamp(frac, 0, 1);
      bar.set(f);
      inner.setHp(f);
    },
    update(dt) { inner.update(dt); },
    dispose() {
      disposeDeep(mesh);
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
}
