// Procedural battlefield terrain: ground plane with painted PBR detail,
// packed-earth lane strip, gradient sky dome, and distance fog.
// Contract: createTerrain(scene, ageIndex) -> { group, update(dt), setAge(i), dispose() }
import * as THREE from 'three';
import { CONFIG } from '../simulation/config.js';
import { mulberry32 } from '../simulation/rng.js';

function makeGroundTexture(baseColor, seed) {
  const rng = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = baseColor;
  g.fillRect(0, 0, 512, 512);
  // Dry mottling: thousands of low-alpha splotches.
  for (let i = 0; i < 5200; i++) {
    const r = 1 + rng() * 5;
    const v = rng();
    g.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,240,210,0.08)';
    g.beginPath();
    g.arc(rng() * 512, rng() * 512, r, 0, Math.PI * 2);
    g.fill();
  }
  // Grass tufts (dry savanna flecks).
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = rng() < 0.5 ? 'rgba(122,124,58,0.55)' : 'rgba(90,94,40,0.55)';
    g.lineWidth = 1.5;
    const x = rng() * 512;
    const y = rng() * 512;
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
    g.arc(rng() * 512, rng() * 512, r, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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

function displaceGround(geo, seed, laneLocalY) {
  const rng = mulberry32(seed);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const grid = [];
  for (let i = 0; i < 64; i++) grid.push(rng());
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // World z = slabCenterZ - localY; laneLocalY is the local Y of world z = 0.
    const h = Math.sin(x * 0.31 + grid[Math.floor(Math.abs(x)) % 64] * 6.28) * Math.cos(y * 0.58 + 1.7) * 0.14;
    const laneFlatten = Math.min(1, Math.abs(y - laneLocalY) / 2.5);
    pos.setZ(i, h * (0.25 + 0.75 * laneFlatten));
  }
  geo.computeVertexNormals();
}

export function createTerrain(scene, ageIndex = 0) {
  const group = new THREE.Group();
  group.name = 'terrain';
  let owned = [];

  const build = (age) => {
    for (const o of owned) {
      group.remove(o);
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
