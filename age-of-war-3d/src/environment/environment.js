import * as THREE from 'three';
import { mulberry32 } from '../simulation/rng.js';
import { pbr, glowMat, glowSprite, solidify, disposeDeep, jitterGeo, rockMat, mottleGeo, mergeStatic } from '../core/pbr.js';

// Castle Age backdrop: a moonlit fortress on the horizon, rolling dark
// hills, broadleaf trees, braziers along the lane, grey boulders, grass
// tufts, drifting clouds and circling crows. Same keep-clear rules as Stone:
// nothing gameplay-tall inside z [-2,2] sightlines.
//
// Contract: createEnvironment(scene, ageIndex) -> { group, setAge(i), dispose() }
// Extra: update(dt) drifts clouds, flaps birds and flickers braziers.
// setAge(i) rebuilds for the age (ages without a bespoke backdrop reuse Stone).

const TRUNK = '#5a4030';
const PINE = '#3f6b34';
const PINE_DK = '#2c4f26';
const MESA = '#8a5a44';
const MESA_DK = '#6e4434';
const LAVA = '#ff6a2a';
const KEEP_STONE = '#6a6a78';
const KEEP_STONE_DK = '#46464f';
const KEEP_ROOF = '#33415e';
const LEAF = ['#2e5b2e', '#3a6b34', '#274d28'];

// Lane firelight base intensity (physical falloff): reads as a warm pool
// ~4m out without flattening the night mood.
const FIRE_BASE = 20;

// Canopy tint jitter: lightness quantized to 5 steps so the shared pbr()
// cache stays tiny across rebuilds (a continuous range would add dozens of
// unique materials per setAge that the cache retains forever).
function canopyTint(base, rng) {
  const c = new THREE.Color(base);
  c.offsetHSL(0, 0, Math.round((rng() - 0.5) * 4) * 0.02);
  return pbr(`#${c.getHexString()}`, 0.9);
}

function araucaria(rng) {
  const g = new THREE.Group();
  const h = 3.5 + rng() * 2.5;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, h, 7), pbr(TRUNK, 0.95));
  trunk.position.y = h / 2;
  g.add(trunk);
  const tiers = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < tiers; i++) {
    const r = (1.7 - i * 0.32) * (0.9 + rng() * 0.2);
    const tierGeo = new THREE.ConeGeometry(r, 1.1, 9);
    jitterGeo(tierGeo, 0.06, 3, h * 10 + i);
    const cone = new THREE.Mesh(tierGeo,
      canopyTint(i === 0 ? PINE_DK : (i % 2 ? PINE : PINE_DK), rng));
    cone.position.y = h * 0.55 + i * 0.85;
    g.add(cone);
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), canopyTint(PINE, rng));
  top.position.y = h * 0.55 + tiers * 0.85;
  g.add(top);
  return g;
}

function boulder(rng) {
  const r = 0.4 + rng() * 1.1;
  const g = new THREE.IcosahedronGeometry(r, 0);
  mottleGeo(g, 0.14, (r * 91) | 0);
  const m = new THREE.Mesh(g, rockMat(rng() > 0.5 ? '#7d7468' : '#6a6055', 0.95));
  m.scale.y = 0.7;
  m.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  return m;
}

function fernTuft(rng) {
  const g = new THREE.Group();
  const n = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.7 + rng() * 0.5, 5),
      pbr(i % 2 ? '#4f7d3a' : '#639444', 0.9));
    const a = (i / n) * Math.PI * 2 + rng();
    blade.position.set(Math.cos(a) * 0.18, 0.3, Math.sin(a) * 0.18);
    blade.rotation.set(Math.sin(a) * 0.35, 0, Math.cos(a) * -0.35);
    g.add(blade);
  }
  return g;
}

function mesa(w, h, d) {
  const g = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(w * 0.42, w * 0.62, h, 9);
  jitterGeo(baseGeo, 0.16, 1.8, w);
  mottleGeo(baseGeo, 0.14, w);
  const base = new THREE.Mesh(baseGeo, rockMat(MESA, 0.95));
  base.position.y = h / 2 - 0.5;
  g.add(base);
  const capGeo = new THREE.CylinderGeometry(w * 0.4, w * 0.37, h * 0.22, 9);
  jitterGeo(capGeo, 0.14, 2.2, w + 3);
  mottleGeo(capGeo, 0.14, w + 3);
  const cap = new THREE.Mesh(capGeo, rockMat(MESA_DK, 0.95));
  cap.position.y = h - 0.5;
  g.add(cap);
  // strata bands break the cooling-tower smoothness
  for (const f of [0.3, 0.5, 0.7]) {
    const r = w * (0.62 - 0.2 * f) + 0.12;
    const bandGeo = new THREE.CylinderGeometry(r - 0.02, r + 0.02, h * 0.07, 9);
    mottleGeo(bandGeo, 0.1, w + f * 100);
    const band = new THREE.Mesh(bandGeo, rockMat('#5e3a2c', 0.95));
    band.position.y = h * f - 0.5;
    band.rotation.y = f * 3;
    g.add(band);
  }
  return g;
}

function volcano() {
  const g = new THREE.Group();
  const coneGeo = new THREE.CylinderGeometry(2.2, 6.5, 9, 11);
  jitterGeo(coneGeo, 0.12, 1.6, 7);
  mottleGeo(coneGeo, 0.14, 7);
  const cone = new THREE.Mesh(coneGeo, rockMat('#54423a', 0.95));
  cone.position.y = 4;
  g.add(cone);
  const crater = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16),
    new THREE.MeshBasicMaterial({ color: LAVA, fog: false }));
  crater.rotation.x = -Math.PI / 2;
  crater.position.y = 8.55;
  g.add(crater);
  const glow = glowSprite('#ff7a2a', 0.45, 6);
  glow.position.y = 9.5;
  g.add(glow);
  // smoke column: stacked fading sprites
  const smokes = [];
  for (let i = 0; i < 5; i++) {
    const s = glowSprite('#4a423c', 0.4 - i * 0.06, 2.5 + i * 1.2, false);
    s.position.y = 10 + i * 1.8;
    s.userData.seed = i * 1.7;
    g.add(s);
    smokes.push(s);
  }
  return { group: g, smokes };
}

function cloud(rng, color = '#ecdcc8') {
  const g = new THREE.Group();
  // unlit: Lambert bottoms render mud-dark from the ground
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, fog: false });
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1.6 + rng() * 1.4, 10, 8), m);
    s.position.set(i * 2.2 - n, rng() * 0.8, rng() * 1.5);
    s.scale.y = 0.55;
    g.add(s);
  }
  return g;
}

function crow(color) {
  // Small generic bird for non-Stone skies: slim body, narrow flapping wings.
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
  const bodyM = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat);
  bodyM.scale.set(2.2, 0.8, 0.8);
  g.add(bodyM);
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1.1), mat);
    w.geometry.translate(0, s * 0.55, 0);
    g.add(w);
    wings.push(w);
  }
  return { group: g, wings };
}
function pterodactyl() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#4a3a30', side: THREE.DoubleSide });
  const bodyM = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 6), mat);
  bodyM.rotation.z = -Math.PI / 2;
  g.add(bodyM);
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.9), mat);
    w.geometry.translate(0, s * 0.95, 0);
    g.add(w);
    wings.push(w);
  }
  return { group: g, wings };
}

// --- Castle Age builders ---

function crenellate(w, mat) {
  const g = new THREE.Group();
  const n = Math.max(3, Math.floor(w / 1.2));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.5), mat);
    m.position.set(-w / 2 + ((i + 0.5) * w) / n, 0.3, 0);
    g.add(m);
  }
  return g;
}

function castleTower(r, h, stone, stoneDk, roofM) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 12), stone);
  body.position.y = h / 2;
  g.add(body);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.8, 12), stoneDk);
  rim.position.y = h + 0.4;
  g.add(rim);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(r + 0.7, r * 1.7, 12), roofM);
  roof.position.y = h + 0.8 + (r * 1.7) / 2;
  g.add(roof);
  // lit slit window faces the battlefield (+z)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9),
    new THREE.MeshBasicMaterial({ color: '#ffca6a' }));
  win.position.set(0, h * 0.65, r + 0.06);
  g.add(win);
  return g;
}

function castleBackdrop() {
  const g = new THREE.Group();
  const stone = pbr(KEEP_STONE, 0.95);
  const stoneDk = pbr(KEEP_STONE_DK, 0.95);
  const roofM = pbr(KEEP_ROOF, 0.8);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 1.6), stone);
  wall.position.y = 2.25;
  g.add(wall);
  const merlons = crenellate(16, stoneDk);
  merlons.position.y = 4.5;
  g.add(merlons);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(3, 3.6, 0.4),
    new THREE.MeshBasicMaterial({ color: '#0a0a12' }));
  gate.position.set(0, 1.8, 0.85);
  g.add(gate);
  for (const sx of [-1, 1]) {
    const t = castleTower(2.2, 8, stone, stoneDk, roofM);
    t.position.set(sx * 9.5, 0, 0);
    g.add(t);
  }
  const keep = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 6), stoneDk);
  keep.position.set(0, 4.5, -4);
  g.add(keep);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 3.2, 4), roofM);
  keepRoof.position.set(0, 10.6, -4);
  keepRoof.rotation.y = Math.PI / 4;
  g.add(keepRoof);
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9),
      new THREE.MeshBasicMaterial({ color: '#ffca6a' }));
    win.position.set(-2 + i * 2, 6.5, -0.94);
    g.add(win);
  }
  return g;
}

function broadleaf(rng) {
  const g = new THREE.Group();
  const h = 2.2 + rng() * 1.4;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, h, 7), pbr(TRUNK, 0.95));
  trunk.position.y = h / 2;
  g.add(trunk);
  const blobs = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < blobs; i++) {
    const r = 1.1 + rng() * 0.9;
    const geo = new THREE.IcosahedronGeometry(r, 1);
    jitterGeo(geo, 0.18, 3.1, r * 7 + i);
    const c = new THREE.Mesh(geo, canopyTint(LEAF[i % LEAF.length], rng));
    c.position.set((rng() - 0.5) * 1.6, h + (rng() - 0.2) * 0.9, (rng() - 0.5) * 1.6);
    g.add(c);
  }
  return g;
}

function brazier(seed) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.6, 7), pbr('#3a2a1a', 0.95));
  post.position.y = 0.8;
  g.add(post);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.3, 8), pbr('#2a2a30', 0.8));
  cup.position.y = 1.7;
  g.add(cup);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 7), glowMat('#ff9a3a', 0.95));
  flame.position.y = 2.0;
  flame.userData.seed = seed;
  g.add(flame);
  const glow = glowSprite('#ff8a2a', 0.5, 3);
  glow.position.y = 2.0;
  g.add(glow);
  return { group: g, flame };
}

// Renaissance: golden-dusk Italianate skyline — domed villa, campanile,
// terracotta roof rows — with cypress avenues and amber hills.
const VILLA = '#c8a878';
const VILLA_DK = '#8a6a44';
const DOME = '#3f7a5e';
const TERRA = '#a85a3a';
const CYPRESS = '#2c4426';

function cypress(rng) {
  const g = new THREE.Group();
  const h = 4.5 + rng() * 2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), pbr(TRUNK, 0.95));
  trunk.position.y = 0.6;
  g.add(trunk);
  for (const [r, y, dk] of [[0.75, 0.62, true], [0.55, 0.82, false], [0.3, 0.97, false]]) {
    const cypGeo = new THREE.ConeGeometry(r * (0.9 + rng() * 0.2), h * 0.42, 7);
    jitterGeo(cypGeo, 0.05, 3, h * 7 + y * 100);
    const c = new THREE.Mesh(cypGeo,
      canopyTint(dk ? '#243a20' : (rng() > 0.5 ? CYPRESS : '#35522e'), rng));
    c.position.y = h * y;
    g.add(c);
  }
  return g;
}

function villa() {
  const g = new THREE.Group();
  const wallM = pbr(VILLA, 0.95);
  const body = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), wallM);
  body.position.y = 1.5;
  g.add(body);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 12), pbr(VILLA_DK, 0.95));
  drum.position.y = 3.6;
  g.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(DOME, 0.7));
  dome.position.y = 4.2;
  g.add(dome);
  const winM = new THREE.MeshBasicMaterial({ color: '#ffca6a' });
  for (const wx of [-1.8, 0, 1.8]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.8), winM);
    win.position.set(wx, 1.6, 2.56);
    g.add(win);
  }
  return g;
}

function campanile() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9, 1.6), pbr(VILLA, 0.95));
  shaft.position.y = 4.5;
  g.add(shaft);
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), pbr(VILLA_DK, 0.95));
  belfry.position.y = 9.8;
  g.add(belfry);
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1),
    new THREE.MeshBasicMaterial({ color: '#0a0a12' }));
  arch.position.set(0, 9.8, 1.02);
  g.add(arch);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.6, 4), pbr(TERRA, 0.85));
  cap.position.y = 11.4;
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  return g;
}

function renaissanceBackdrop() {
  const g = new THREE.Group();
  for (const [w, x, z] of [[5, -8.5, 0.5], [4, 8.5, 0.5], [6, 13.5, -1]]) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 4), pbr(VILLA, 0.95));
    house.position.set(x, 1.3, z);
    g.add(house);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.42, 1.6, 4, 1),
      pbr(TERRA, 0.9));
    roof.position.set(x, 3.4, z);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 4 / (w * 0.84);
    g.add(roof);
  }
  const v = villa();
  v.position.set(0, 0, -2);
  g.add(v);
  const t = campanile();
  t.position.set(-5.5, 0, -3);
  g.add(t);
  return g;
}

// Modern: overcast ruined-city skyline — broken concrete towers, a bunker,
// sandbag lines and tilted utility poles along a churned olive-drab field.
const CONCRETE = '#7a7a72';
const CONCRETE_DK = '#54544e';
const RUST = '#7a4a2e';
const SANDBAG = '#8a7a5a';

function ruinTower(rng) {
  const g = new THREE.Group();
  const h = 5 + rng() * 4;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.4, h, 2.4), pbr(CONCRETE, 0.95));
  shaft.position.y = h / 2;
  shaft.rotation.y = (rng() - 0.5) * 0.2;
  g.add(shaft);
  // snapped top: tilted cap slab + exposed rebar
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 2.2), pbr(CONCRETE_DK, 0.95));
  cap.position.set((rng() - 0.5) * 0.8, h + 0.1, (rng() - 0.5) * 0.8);
  cap.rotation.set((rng() - 0.5) * 0.5, rng(), (rng() - 0.5) * 0.5);
  g.add(cap);
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5), pbr(RUST, 0.8));
    bar.position.set((rng() - 0.5) * 1.6, h + 0.5, (rng() - 0.5) * 1.6);
    bar.rotation.set((rng() - 0.5) * 0.9, 0, (rng() - 0.5) * 0.9);
    g.add(bar);
  }
  // dark blown-out window holes facing the lane
  const holeM = new THREE.MeshBasicMaterial({ color: '#0c0e0c' });
  for (const wy of [h * 0.35, h * 0.6]) {
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), holeM);
    hole.position.set(0, wy, 1.22);
    g.add(hole);
  }
  return g;
}

function ruinedWall(rng) {
  const g = new THREE.Group();
  const w = 3 + rng() * 3;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2 + rng() * 0.8, 0.5), pbr(CONCRETE, 0.95));
  wall.position.y = 0.6;
  wall.rotation.y = (rng() - 0.5) * 0.6;
  g.add(wall);
  return g;
}

function bunker() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.8, 3), pbr(CONCRETE_DK, 0.95));
  body.position.y = 0.9;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 3.2, 10, 1, false, 0, Math.PI),
    pbr(CONCRETE, 0.95));
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 1.8;
  g.add(roof);
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.35),
    new THREE.MeshBasicMaterial({ color: '#0c0e0c' }));
  slit.position.set(0, 1.1, 1.52);
  g.add(slit);
  return g;
}

function sandbagLine(n) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), pbr(SANDBAG, 1.0));
    bag.scale.set(1.25, 0.55, 0.8);
    bag.position.set(i * 0.85, 0.22 + (i % 2) * 0.38, (i % 2) * 0.1);
    bag.rotation.y = (i * 0.7) % 0.6;
    g.add(bag);
  }
  return g;
}

function utilityPole(rng) {
  const g = new THREE.Group();
  const h = 5.5 + rng() * 1.5;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, h, 6), pbr('#3a322a', 0.95));
  pole.position.y = h / 2;
  pole.rotation.z = (rng() - 0.5) * 0.22;
  g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.09, 0.09), pbr('#3a322a', 0.95));
  arm.position.y = h - 0.6;
  arm.rotation.z = pole.rotation.z;
  g.add(arm);
  return g;
}

function modernBackdrop(rng) {
  const g = new THREE.Group();
  for (const [x, z] of [[-9, -1], [9.5, -2], [0.5, -4]]) {
    const t = ruinTower(rng);
    t.position.set(x, 0, z);
    g.add(t);
  }
  for (const [x, z] of [[-5, 1.5], [5.5, 1]]) {
    const w = ruinedWall(rng);
    w.position.set(x, 0, z);
    g.add(w);
  }
  const b = bunker();
  b.position.set(15.5, 0, -3);
  b.rotation.y = -0.3;
  g.add(b);
  return g;
}

// Future: neon skyline over a dark steel plain — black-glass spires with lit
// window grids, a habitat dome and glowing cyan pylons along the lane.
const SPIRE = '#16283a';
const SPIRE_DK = '#0c1622';
const NEON = '#00e5ff';
const NEON_WARM = '#ff5ad0';

function spireTower(rng) {
  const g = new THREE.Group();
  const h = 7 + rng() * 5;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, h, 2.2), pbr(SPIRE, 0.7));
  shaft.position.y = h / 2;
  shaft.rotation.y = (rng() - 0.5) * 0.3;
  g.add(shaft);
  // lit window grid facing the lane
  const litM = new THREE.MeshBasicMaterial({ color: NEON });
  const litM2 = new THREE.MeshBasicMaterial({ color: NEON_WARM });
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (rng() < 0.35) continue;
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), rng() < 0.85 ? litM : litM2);
      w.position.set((c - 1) * 0.6, h * (0.2 + r * 0.18), 1.12);
      w.rotation.y = shaft.rotation.y;
      g.add(w);
    }
  }
  // antenna + beacon
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.6, 5), pbr(SPIRE_DK, 0.8));
  mast.position.y = h + 0.8;
  g.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowMat(NEON, 1));
  beacon.position.y = h + 1.6;
  g.add(beacon);
  return g;
}

function domeHab(rng) {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    pbr(SPIRE, 0.6));
  dome.position.y = 0;
  g.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.09, 8, 24), glowMat(NEON, 0.9));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  g.add(ring);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2),
    new THREE.MeshBasicMaterial({ color: NEON }));
  door.position.set(0, 0.6, 2.55);
  g.add(door);
  void rng;
  return g;
}

function pylon(seed) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 2.6, 6), pbr(SPIRE_DK, 0.8));
  post.position.y = 1.3;
  g.add(post);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), glowMat(NEON, 1));
  lamp.position.y = 2.8;
  lamp.userData.seed = seed;
  g.add(lamp);
  const halo = glowSprite(NEON, 0.5, 1.6);
  halo.position.y = 2.8;
  g.add(halo);
  return { group: g, flame: lamp };
}

function futureBackdrop(rng) {
  const g = new THREE.Group();
  for (const [x, z] of [[-9, -2], [9.5, -3], [0.5, -5]]) {
    const t = spireTower(rng);
    t.position.set(x, 0, z);
    g.add(t);
  }
  const d = domeHab(rng);
  d.position.set(-4.5, 0, 1);
  g.add(d);
  return g;
}

function scatter(rng, count, x0, x1, zBands, avoidLane) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + rng() * (x1 - x0);
    const band = zBands[Math.floor(rng() * zBands.length)];
    const z = band[0] + rng() * (band[1] - band[0]);
    if (avoidLane && Math.abs(z) < 2.6) continue;
    out.push([x, z]);
  }
  return out;
}

export function createEnvironment(scene, ageIndex) {
  const group = new THREE.Group();
  scene.add(group);
  const rng = mulberry32(1379);
  const animated = { clouds: [], birds: [], smokes: [], fires: [], lights: [] };
  let t = 0;

  function addSky(cloudColor, birdColor) {
    for (let i = 0; i < 5; i++) {
      const c = cloud(rng, cloudColor);
      c.position.set(-10 + i * 10 + rng() * 5, 16 + rng() * 6, -24 - rng() * 8);
      group.add(c);
      animated.clouds.push(c);
    }
    // Stone Age skies keep pterodactyls; later ages get small crows instead.
    for (let i = 0; i < 3; i++) {
      const p = birdColor ? crow(birdColor) : pterodactyl();
      p.group.userData = { r: 6 + i * 3, h: 11 + i * 1.5, ph: i * 2.1, cx: 12 + (i - 1) * 6 };
      group.add(p.group);
      animated.birds.push(p);
    }
  }

  function addRocks() {
    // boulders: low enough to sit in front of the lane without blocking it
    for (const [x, z] of scatter(rng, 16, -8, 32, [[-6, -3], [3, 6]], true)) {
      const b = boulder(rng);
      b.position.set(x, 0.15, z);
      group.add(b);
    }
  }

  function addUndergrowth() {
    // fern tufts hug the lane; foreground tufts stay short of the sightline
    for (const [x, z] of scatter(rng, 46, -6, 30, [[-4.5, -2.4], [2.4, 6]], true)) {
      const f = fernTuft(rng);
      f.position.set(x, 0, z);
      const s = 0.8 + rng() * 0.9;
      f.scale.setScalar(s);
      group.add(f);
    }
  }

  function buildCastle() {
    const castle = castleBackdrop();
    castle.position.set(11, 0, -32);
    group.add(castle);
    // rolling dark hills flank the fortress
    for (const [x, z, w, h] of [[-14, -30, 12, 4], [34, -31, 14, 5], [-2, -37, 18, 6]]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), pbr('#24351f', 1.0));
      m.scale.set(w, h, w * 0.5);
      m.position.set(x, 0, z);
      group.add(m);
    }
    // broadleaf treeline well behind the lane (10m+): crowns directly behind
    // the action bury units in foliage from the side camera
    for (const [x, z] of scatter(rng, 26, -14, 38, [[-24, -10]], true)) {
      const tr = broadleaf(rng);
      const s = 0.9 + rng() * 0.8;
      tr.scale.setScalar(s);
      tr.position.set(x, 0, z);
      tr.rotation.y = rng() * Math.PI * 2;
      tr.userData.treeline = true;
      group.add(tr);
    }
    addRocks();
    addUndergrowth();
    // braziers light both lane edges
    let seed = 0;
    for (const [x, z] of [[-6, -3.2], [6, 3.2], [18, -3.2], [30, 3.2]]) {
      const b = brazier(seed += 1.3);
      b.group.position.set(x, 0, z);
      group.add(b.group);
      animated.fires.push(b.flame);
    }
    addSky('#3a4666', '#14141c');
  }

  function build(age) {
    if (age === 4) {
      const skyline = futureBackdrop(rng);
      skyline.position.set(11, 0, -32);
      group.add(skyline);
      // dark steel swells flank the skyline
      for (const [x, z, w, h] of [[-14, -30, 12, 3], [34, -31, 14, 4], [-2, -37, 18, 5]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), pbr('#141f2e', 1.0));
        m.scale.set(w, h, w * 0.5);
        m.position.set(x, 0, z);
        group.add(m);
      }
      // glowing pylons light both lane edges
      let seed = 0;
      for (const [x, z] of [[-6, -3.2], [6, 3.2], [18, -3.2], [30, 3.2]]) {
        const p = pylon(seed += 1.3);
        p.group.position.set(x, 0, z);
        group.add(p.group);
        animated.fires.push(p.flame);
      }
      addRocks();
      addSky('#23234a', '#0a0a14');
      return;
    }
    if (age === 3) {
      const ruins = modernBackdrop(rng);
      ruins.position.set(11, 0, -32);
      group.add(ruins);
      // churned olive mounds flank the ruins
      for (const [x, z, w, h] of [[-14, -30, 12, 3], [34, -31, 14, 4], [-2, -37, 18, 5]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), pbr('#33331f', 1.0));
        m.scale.set(w, h, w * 0.5);
        m.position.set(x, 0, z);
        group.add(m);
      }
      // tilted utility poles well behind the lane (10m+)
      for (const [x, z] of scatter(rng, 10, -12, 36, [[-22, -10]], true)) {
        const p = utilityPole(rng);
        p.position.set(x, 0, z);
        p.rotation.y = rng() * Math.PI * 2;
        p.userData.treeline = true;
        group.add(p);
      }
      // sandbag lines guard both lane edges
      for (const [x, z, ry] of [[-4, -3.4, 0.2], [8, 3.4, -0.15], [20, -3.4, 0.15], [30, 3.4, -0.2]]) {
        const s = sandbagLine(7);
        s.position.set(x, 0, z);
        s.rotation.y = ry;
        group.add(s);
      }
      addRocks();
      addSky('#4a5248', '#1c1c20');
      return;
    }
    if (age === 2) {
      const town = renaissanceBackdrop();
      town.position.set(11, 0, -32);
      group.add(town);
      // amber hills flank the town
      for (const [x, z, w, h] of [[-14, -30, 12, 4], [34, -31, 14, 5], [-2, -37, 18, 6]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), pbr('#5a4a26', 1.0));
        m.scale.set(w, h, w * 0.5);
        m.position.set(x, 0, z);
        group.add(m);
      }
      // cypress avenue well behind the lane (10m+)
      for (const [x, z] of scatter(rng, 22, -14, 38, [[-24, -10]], true)) {
        const tr = cypress(rng);
        const s = 0.85 + rng() * 0.6;
        tr.scale.setScalar(s);
        tr.position.set(x, 0, z);
        tr.rotation.y = rng() * Math.PI * 2;
        tr.userData.treeline = true;
        group.add(tr);
      }
      addRocks();
      addUndergrowth();
      addSky('#e8c8a0', '#2a2018');
      return;
    }
    if (age === 1) {
      buildCastle();
      return;
    }
    // mesas on the horizon
    const mesaDefs = [[-14, -30, 10, 12], [6, -34, 14, 16], [26, -30, 9, 11], [40, -33, 12, 14]];
    for (const [x, z, w, h] of mesaDefs) {
      const m = mesa(w, h, 6);
      m.position.set(x, 0, z);
      group.add(m);
    }
    // volcano (right side backdrop)
    const v = volcano();
    v.group.position.set(33, 0, -26);
    group.add(v.group);
    animated.smokes.push(...v.smokes);

    // tree line well behind the lane (10m+): anything between the camera and
    // the action occludes the battle from the side view, and crowns directly
    // behind the action bury units in foliage
    for (const [x, z] of scatter(rng, 30, -14, 38, [[-24, -10]], true)) {
      const tr = araucaria(rng);
      const s = 0.8 + rng() * 0.7;
      tr.scale.setScalar(s);
      tr.position.set(x, 0, z);
      tr.rotation.y = rng() * Math.PI * 2;
      tr.userData.treeline = true;
      group.add(tr);
    }
    // boulders: low enough to sit in front of the lane without blocking it
    for (const [x, z] of scatter(rng, 16, -8, 32, [[-6, -3], [3, 6]], true)) {
      const b = boulder(rng);
      b.position.set(x, 0.15, z);
      group.add(b);
    }
    // fern tufts hug the lane; foreground tufts stay short of the sightline
    for (const [x, z] of scatter(rng, 46, -6, 30, [[-4.5, -2.4], [2.4, 6]], true)) {
      const f = fernTuft(rng);
      f.position.set(x, 0, z);
      const s = 0.8 + rng() * 0.9;
      f.scale.setScalar(s);
      group.add(f);
    }
    addSky();
  }

  build(ageIndex || 0);
  finalize();

  function finalize() {
    solidify(group);
    const skip = new Set(animated.clouds);
    for (const b of animated.birds) skip.add(b.group);
    for (const f of animated.fires) skip.add(f);
    mergeStatic(group, skip);
    // Lane firelight: one flickering point light per flame so night
    // fighters pick up warm modeling as they pass the braziers/pylons.
    for (const f of animated.fires) {
      const l = new THREE.PointLight(f.material?.color ?? '#ff9a3a', FIRE_BASE, 13, 2);
      l.position.copy(f.position);
      f.parent.add(l);
      animated.lights.push(l);
    }
    // backdrop should not eat the shadow budget
    group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  }

  return {
    group,
    setAge(i) {
      while (group.children.length) {
        const c = group.children.pop();
        disposeDeep(c);
      }
      animated.clouds.length = 0;
      animated.birds.length = 0;
      animated.smokes.length = 0;
      animated.fires.length = 0;
      animated.lights.length = 0;
      build(i);
      finalize();
    },
    update(dt) {
      t += dt;
      for (const c of animated.clouds) {
        c.position.x += dt * 0.35;
        if (c.position.x > 44) c.position.x = -18;
      }
      for (const b of animated.birds) {
        const u = b.group.userData;
        const a = t * 0.25 + u.ph;
        b.group.position.set(u.cx + Math.cos(a) * u.r, u.h + Math.sin(t * 0.7 + u.ph) * 0.8, -14);
        b.group.rotation.y = -a;
        const flap = Math.sin(t * 6 + u.ph) * 0.55;
        b.wings[0].rotation.x = flap;
        b.wings[1].rotation.x = -flap;
      }
      for (const s of animated.smokes) {
        s.position.x += Math.sin(t * 0.8 + s.userData.seed) * dt * 0.5;
        s.position.y += dt * 0.4;
        if (s.position.y > 20) s.position.y = 10;
      }
      for (let i = 0; i < animated.fires.length; i++) {
        const f = animated.fires[i];
        const s = 1 + Math.sin(t * 13 + f.userData.seed) * 0.18 + Math.sin(t * 29 + f.userData.seed) * 0.07;
        f.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
        if (animated.lights[i]) animated.lights[i].intensity = FIRE_BASE * (0.7 + 0.3 * s);
      }
    },
    dispose() {
      scene.remove(group);
      disposeDeep(group);
    },
  };
}
