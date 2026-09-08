import * as THREE from 'three';
import { mulberry32 } from '../simulation/rng.js';
import { pbr, glowMat, glowSprite, solidify, disposeDeep, jitterGeo } from '../core/pbr.js';

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

function araucaria(rng) {
  const g = new THREE.Group();
  const h = 3.5 + rng() * 2.5;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, h, 7), pbr(TRUNK, 0.95));
  trunk.position.y = h / 2;
  g.add(trunk);
  const tiers = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < tiers; i++) {
    const r = (1.7 - i * 0.32) * (0.9 + rng() * 0.2);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.1, 9),
      pbr(i % 2 ? PINE : PINE_DK, 0.9));
    cone.position.y = h * 0.55 + i * 0.85;
    g.add(cone);
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), pbr(PINE, 0.9));
  top.position.y = h * 0.55 + tiers * 0.85;
  g.add(top);
  return g;
}

function boulder(rng) {
  const r = 0.4 + rng() * 1.1;
  const g = new THREE.IcosahedronGeometry(r, 0);
  const m = new THREE.Mesh(g, pbr(rng() > 0.5 ? '#7d7468' : '#6a6055', 0.95));
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

function mesa(w, h, d, mat) {
  const g = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(w * 0.42, w * 0.62, h, 9);
  jitterGeo(baseGeo, 0.1, 1.8, w);
  const base = new THREE.Mesh(baseGeo, mat);
  base.position.y = h / 2 - 0.5;
  g.add(base);
  const capGeo = new THREE.CylinderGeometry(w * 0.4, w * 0.37, h * 0.22, 9);
  jitterGeo(capGeo, 0.08, 2.2, w + 3);
  const cap = new THREE.Mesh(capGeo, pbr(MESA_DK, 0.95));
  cap.position.y = h - 0.5;
  g.add(cap);
  // strata bands break the cooling-tower smoothness
  for (const f of [0.35, 0.62]) {
    const r = w * (0.62 - 0.2 * f) + 0.12;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(r - 0.02, r + 0.02, h * 0.07, 9),
      pbr('#5e3a2c', 0.95));
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
  const cone = new THREE.Mesh(coneGeo, pbr('#54423a', 0.95));
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
    const c = new THREE.Mesh(geo, pbr(LEAF[i % LEAF.length], 0.95));
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
  flame.position.y = 2.2;
  flame.userData.seed = seed;
  g.add(flame);
  const glow = glowSprite('#ff8a2a', 0.5, 3);
  glow.position.y = 2.2;
  g.add(glow);
  return { group: g, flame };
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
  const animated = { clouds: [], birds: [], smokes: [], fires: [] };
  let t = 0;

  function addSky(cloudColor) {
    for (let i = 0; i < 5; i++) {
      const c = cloud(rng, cloudColor);
      c.position.set(-10 + i * 10 + rng() * 5, 16 + rng() * 6, -24 - rng() * 8);
      group.add(c);
      animated.clouds.push(c);
    }
    for (let i = 0; i < 3; i++) {
      const p = pterodactyl();
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
    // broadleaf treeline strictly behind the lane
    for (const [x, z] of scatter(rng, 26, -14, 38, [[-16, -4]], true)) {
      const tr = broadleaf(rng);
      const s = 0.9 + rng() * 0.8;
      tr.scale.setScalar(s);
      tr.position.set(x, 0, z);
      tr.rotation.y = rng() * Math.PI * 2;
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
    addSky('#3a4666');
  }

  function build(age) {
    if (age === 1) {
      buildCastle();
      return;
    }
    // mesas on the horizon
    const mesaMat = pbr(MESA, 0.95);
    const mesaDefs = [[-14, -30, 10, 12], [6, -34, 14, 16], [26, -30, 9, 11], [40, -33, 12, 14]];
    for (const [x, z, w, h] of mesaDefs) {
      const m = mesa(w, h, 6, mesaMat);
      m.position.set(x, 0, z);
      group.add(m);
    }
    // volcano (right side backdrop)
    const v = volcano();
    v.group.position.set(33, 0, -26);
    group.add(v.group);
    animated.smokes.push(...v.smokes);

    // tree line strictly behind the lane: anything between the camera and
    // the action occludes the battle from the side view
    for (const [x, z] of scatter(rng, 30, -14, 38, [[-16, -4]], true)) {
      const tr = araucaria(rng);
      const s = 0.8 + rng() * 0.7;
      tr.scale.setScalar(s);
      tr.position.set(x, 0, z);
      tr.rotation.y = rng() * Math.PI * 2;
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
  solidify(group);
  // backdrop should not eat the shadow budget
  group.traverse((o) => { if (o.isMesh) o.castShadow = false; });

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
      build(i);
      solidify(group);
      group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
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
      for (const f of animated.fires) {
        const s = 1 + Math.sin(t * 13 + f.userData.seed) * 0.18 + Math.sin(t * 29 + f.userData.seed) * 0.07;
        f.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      }
    },
    dispose() {
      scene.remove(group);
      disposeDeep(group);
    },
  };
}
