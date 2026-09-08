// Procedural battlefield terrain: ground plane with painted PBR detail,
// packed-earth lane strip, gradient sky dome, and distance fog.
// Contract: createTerrain(scene, ageIndex) -> { group, update(dt), setAge(i), dispose() }
import * as THREE from 'three';
import { CONFIG } from '../simulation/config.js';
import { mulberry32 } from '../simulation/rng.js';
import { glowSprite } from '../core/pbr.js';

function makeGroundTexture(baseColor, seed) {
  const rng = mulberry32(seed);
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = baseColor;
  g.fillRect(0, 0, S, S);
  // Dry mottling: thousands of low-alpha splotches.
  for (let i = 0; i < 5200; i++) {
    const r = 1 + rng() * 5;
    const v = rng();
    g.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,240,210,0.08)';
    g.beginPath();
    g.arc(rng() * S, rng() * S, r, 0, Math.PI * 2);
    g.fill();
  }
  // Fine grit grain: dense single-pixel speckle for close-up definition.
  for (let i = 0; i < 14000; i++) {
    const v = rng();
    g.fillStyle = v < 0.55 ? 'rgba(0,0,0,0.14)' : 'rgba(255,244,220,0.10)';
    g.fillRect(rng() * S, rng() * S, 1.5, 1.5);
  }
  // Cracks: short dark craggy streaks for a grittier read.
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = 'rgba(10,8,5,0.28)';
    g.lineWidth = 1 + rng() * 1.5;
    let x = rng() * S;
    let y = rng() * S;
    const a = rng() * Math.PI * 2;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 3; s++) {
      x += Math.cos(a + (rng() - 0.5) * 1.2) * (8 + rng() * 18);
      y += Math.sin(a + (rng() - 0.5) * 1.2) * (8 + rng() * 18);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Grass tufts (dry savanna flecks).
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = rng() < 0.5 ? 'rgba(122,124,58,0.55)' : 'rgba(90,94,40,0.55)';
    g.lineWidth = 1.5;
    const x = rng() * S;
    const y = rng() * S;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rng() - 0.5) * 6, y - 3 - rng() * 5);
    g.stroke();
  }
  // Scattered stones, kept darker than the soil so they read as pebbles.
  for (let i = 0; i < 200; i++) {
    const r = 0.8 + rng() * 2;
    const shade = 52 + Math.floor(rng() * 42);
    g.fillStyle = `rgb(${shade},${shade - 8},${shade - 18})`;
    g.beginPath();
    g.arc(rng() * S, rng() * S, r, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeSkyTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, bottom);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function groundGrid(seed) {
  const rng = mulberry32(seed);
  const grid = [];
  for (let i = 0; i < 64; i++) grid.push(rng());
  return grid;
}

function groundH(lx, ly, grid, laneLocalY) {
  const h = Math.sin(lx * 0.31 + grid[Math.floor(Math.abs(lx)) % 64] * 6.28) * Math.cos(ly * 0.58 + 1.7) * 0.14;
  const laneFlatten = Math.min(1, Math.abs(ly - laneLocalY) / 2.5);
  return h * (0.25 + 0.75 * laneFlatten);
}

// Per-age scatter tints: pebble grey, grass tuft green.
const PEBBLE_TINT = ['#7d7468', '#8a8578', '#8d8574', '#6e6a5e', '#5a6a7a'];
const TUFT_TINT = ['#6b7f3f', '#4f7d3a', '#5f8440', '#5a5a34', '#3f6b6e'];

function displaceGround(geo, seed, laneLocalY) {
  const grid = groundGrid(seed);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // World z = slabCenterZ - localY; laneLocalY is the local Y of world z = 0.
    pos.setZ(i, groundH(pos.getX(i), pos.getY(i), grid, laneLocalY));
  }
    geo.computeVertexNormals();
}

// Trampled-center wear strip: soft-edged dark band down the lane middle.
function makeWearTexture(seed) {
  const rng = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 32;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 32);
  for (let i = 0; i < 1000; i++) {
    const x = rng() * 256;
    const y = 16 + (rng() - 0.5) * 22;
    const edge = 1 - Math.abs(y - 16) / 16;
    if (edge <= 0) continue;
    g.fillStyle = `rgba(20,12,6,${0.16 * edge})`;
    g.beginPath();
    g.arc(x, y, 1 + rng() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// One InstancedMesh of pebbles or tufts scattered off-lane, seated on the
// analytic ground height so nothing floats or sinks.
function makeScatter(grid, geo, tint, count, seed, sMin, sMax) {
  const rng = mulberry32(seed);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1.0, metalness: 0.0 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < count * 20) {
    const wx = -14 + rng() * 52;
    const wz = -15 + rng() * 42;
    if (Math.abs(wz) < 3.4) continue; // keep the lane clear
    dummy.position.set(wx, groundH(wx - 12, 6 - wz, grid, 6) + 0.02, wz);
    dummy.rotation.y = rng() * Math.PI * 2;
    const s = sMin + rng() * (sMax - sMin);
    dummy.scale.set(s, s * (0.5 + rng() * 0.3), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    col.set(tint).multiplyScalar(0.75 + rng() * 0.5);
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createTerrain(scene, ageIndex = 0) {
  const group = new THREE.Group();
  group.name = 'terrain';
  let owned = [];

  const build = (age) => {
    for (const o of owned) {
      group.remove(o);
      if (o.isInstancedMesh) o.dispose();
      o.geometry?.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          for (const k of ['map', 'roughnessMap']) m[k]?.dispose?.();
          m.dispose();
        });
      }
    }
    owned = [];
    const cfg = CONFIG.AGES[age] || CONFIG.AGES[0];

    // Main ground slab. Wide enough that no camera preset sees past its
    // near edge (world z up to +28); the lane (world z = 0) sits at localY 6.
    const groundGeo = new THREE.PlaneGeometry(56, 44, 96, 64);
    displaceGround(groundGeo, 1000 + age, 6);
    const groundMat = new THREE.MeshStandardMaterial({
      map: makeGroundTexture(cfg.groundColor, 2000 + age),
      roughness: 0.96,
      metalness: 0.0,
    });
    groundMat.map.repeat.set(8, 6);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(12, 0, 6);
    ground.receiveShadow = true;
    group.add(ground);
    owned.push(ground);

    // Packed-earth lane strip where units march. Flat color variants use
    // multiplyScalar (linear-safe); offsetHSL would operate in linear space
    // and shift perceptual lightness far more than intended.
    const laneGeo = new THREE.PlaneGeometry(48, 4.6);
    const laneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.groundColor).multiplyScalar(1.35),
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(12, 0.06, 0);
    lane.receiveShadow = true;
    group.add(lane);
    owned.push(lane);

    // Trampled center: soft dark wear band down the lane middle.
    const wearTex = makeWearTexture(5000 + age);
    wearTex.repeat.set(6, 1);
    const wear = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 2.2),
      new THREE.MeshStandardMaterial({
        map: wearTex, transparent: true, roughness: 1.0, metalness: 0.0,
        polygonOffset: true, polygonOffsetFactor: -2,
      })
    );
    wear.rotation.x = -Math.PI / 2;
    wear.position.set(12, 0.09, 0);
    wear.receiveShadow = true;
    group.add(wear);
    owned.push(wear);

    // Instanced ground detail, seated on the same height field as the slab.
    const grid = groundGrid(1000 + age);
    const pebbles = makeScatter(grid, new THREE.IcosahedronGeometry(0.09, 0),
      PEBBLE_TINT[age] || PEBBLE_TINT[0], 220, 6000 + age, 0.6, 1.6);
    group.add(pebbles);
    owned.push(pebbles);
    const tufts = makeScatter(grid, new THREE.ConeGeometry(0.09, 0.4, 5),
      TUFT_TINT[age] || TUFT_TINT[0], 260, 7000 + age, 0.5, 0.9);
    group.add(tufts);
    owned.push(tufts);

    // Far skirt to meet the horizon. Same painted texture so it reads as
    // continuous land; sits below the deepest ground dip (-0.14).
    const skirtMat = new THREE.MeshStandardMaterial({
      map: makeGroundTexture(cfg.groundColor, 3000 + age),
      color: new THREE.Color(0xffffff).multiplyScalar(0.8),
      roughness: 1,
    });
    skirtMat.map.repeat.set(30, 18);
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(400, 240), skirtMat);
    skirt.rotation.x = -Math.PI / 2;
    skirt.position.set(12, -0.3, -20);
    group.add(skirt);
    owned.push(skirt);

    // Sky dome.
    const skyTex = makeSkyTexture(cfg.skyGradient[0], cfg.skyGradient[1]);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(190, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    sky.position.set(12, 0, 0);
    group.add(sky);
    owned.push(sky);

    // Night-age celestial bodies (Castle, Future): moon disc + halo + stars.
    if (age === 1 || age === 4) {
      const center = new THREE.Vector3(12, 0, 0);
      const moonPos = new THREE.Vector3(-0.45, 0.62, -0.64).normalize()
        .multiplyScalar(170).add(center);
      const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 24),
        new THREE.MeshBasicMaterial({
          color: age === 1 ? '#e8ecf5' : '#d5e4ff', fog: false,
        }));
      moon.position.copy(moonPos);
      moon.lookAt(center);
      group.add(moon);
      owned.push(moon);
      const halo = glowSprite(age === 1 ? '#aebedd' : '#9fc4ff', 0.5, 26);
      halo.position.copy(moonPos);
      group.add(halo);
      owned.push(halo);
      // Starfield: seeded points on the upper dome, brighter overhead.
      const srng = mulberry32(9000 + age);
      const N = 350;
      const sp = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const a = srng() * Math.PI * 2;
        const e = Math.asin(srng()); // elevation 0..90deg, denser overhead
        const r = 178;
        sp[i * 3] = 12 + r * Math.cos(e) * Math.cos(a);
        sp[i * 3 + 1] = r * Math.sin(e) + 4;
        sp[i * 3 + 2] = r * Math.cos(e) * Math.sin(a);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: '#cfe0ff', size: 1.6, sizeAttenuation: false,
        transparent: true, opacity: 0.9, fog: false, depthWrite: false,
      }));
      stars.frustumCulled = false;
      group.add(stars);
      owned.push(stars);
    }

    scene.fog = new THREE.Fog(new THREE.Color(cfg.skyGradient[1]), 45, 170);
  };

  build(ageIndex);
  scene.add(group);

  return {
    group,
    update() {},
    setAge(i) { build(i); },
    dispose() {
      scene.remove(group);
      scene.fog = null;
    },
  };
}
