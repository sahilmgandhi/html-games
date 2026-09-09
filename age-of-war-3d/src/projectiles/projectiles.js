import * as THREE from 'three';
import { pbr, glowMat, glowSprite, mottleGeo, rockMat, solidify, disposeDeep } from '../core/pbr.js';

// Pooled 3D projectiles. Stone kinds: 'rock' (sling stone), 'egg' (white,
// wobbles), 'boulder' (catapult shot, burning trail, splash). Castle kinds:
// 'arrow' (archer shaft, pale streak), 'fireball' (burning shot, long flame
// trail), 'oil' (dark glossy glob, sickly trail, splash). Renaissance kinds:
// 'musketball' (fast bright tracer), 'cannonball' (iron ball, grey smoke
// trail), 'shell' (explosive shot, spark trail, splash). Modern kinds:
// 'bullet' (tracer round, hot core, thin streak), 'rocket' (finned body,
// exhaust glow, grey smoke trail).
//
// Contract: ProjectileMesh(kind) -> { mesh, update(dt), dispose() }
// The battle sync sets mesh.position each frame; update() derives velocity
// from the position delta to aim the trail, spins the core and ages the glow.

function rockGeo(r, seed) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const w = 1 + 0.18 * Math.sin(pos.getX(i) * 9 + seed) * Math.cos(pos.getY(i) * 7 + seed);
    pos.setXYZ(i, pos.getX(i) * w, pos.getY(i) * w, pos.getZ(i) * w);
  }
  g.computeVertexNormals();
  return g;
}

const KIND_STYLE = {
  rock: { build: null, trailColor: '#c9bfa8', trailLen: 0.9, glowScale: 0.7, spin: 9 },
  egg: { build: null, trailColor: '#fff4d6', trailLen: 0.7, glowScale: 0.6, spin: 5 },
  boulder: { build: null, trailColor: '#ff7a2a', trailLen: 2.2, glowScale: 1.6, spin: 6 },
  arrow: { build: null, trailColor: '#ffe9b8', trailLen: 1.4, glowScale: 0.5, spin: 0 },
  fireball: { build: null, trailColor: '#ff7a2a', trailLen: 2.4, glowScale: 1.8, spin: 7 },
  oil: { build: null, trailColor: '#6a7a2a', trailLen: 1.2, glowScale: 0.9, spin: 5 },
  musketball: { build: null, trailColor: '#fff2b8', trailLen: 1.8, glowScale: 0.6, spin: 0 },
  cannonball: { build: null, trailColor: '#9a9aa2', trailLen: 1.6, glowScale: 0.7, spin: 8 },
  shell: { build: null, trailColor: '#ff9a3a', trailLen: 2.0, glowScale: 1.4, spin: 6 },
  bullet: { build: null, trailColor: '#ff6a4a', trailLen: 1.1, glowScale: 0.8, spin: 0 },
  rocket: { build: null, trailColor: '#b8b8b0', trailLen: 2.2, glowScale: 1.5, spin: 0 },
  laser: { build: null, trailColor: '#00e5ff', trailLen: 2.0, glowScale: 1.2, spin: 0 },
  plasma: { build: null, trailColor: '#ff5ad0', trailLen: 1.8, glowScale: 1.7, spin: 4 },
};

const GLOW_COLOR = {
  boulder: '#ff9a3a', fireball: '#ff6a2a', oil: '#8a9a3a',
  musketball: '#fff2b8', cannonball: '#c8c8d0', shell: '#ff8a3a',
  bullet: '#ffd28a', rocket: '#ff9a3a',
  laser: '#00e5ff', plasma: '#ff5ad0',
};

function buildCore(kind) {
  if (kind === 'egg') {
    const egg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), pbr('#efe6d0', 0.45));
    egg.scale.set(1, 1.35, 1);
    const speck = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), pbr('#b09a6a', 0.7));
    speck.position.set(0.12, 0.1, 0.1);
    const g = new THREE.Group();
    g.add(egg, speck);
    return g;
  }
  if (kind === 'boulder') {
    const g = new THREE.Group();
    const bg = rockGeo(0.38, 3);
    mottleGeo(bg, 0.12, 3);
    g.add(new THREE.Mesh(bg, rockMat('#5a5a62', 0.9)));
    const crack = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 12),
      new THREE.MeshBasicMaterial({ color: '#ff8a2a', fog: false }));
    crack.rotation.set(0.7, 0.4, 0);
    g.add(crack);
    return g;
  }
  if (kind === 'arrow') {
    // Shaft along +X (the aim axis); spin stays 0 so it never tumbles.
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), pbr('#7a5a34', 0.8));
    shaft.rotation.z = -Math.PI / 2;
    g.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), pbr('#b8bcc4', 0.35));
    head.rotation.z = -Math.PI / 2;
    head.position.x = 0.55;
    g.add(head);
    for (let i = 0; i < 3; i++) {
      const fletch = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), pbr('#a83a3a', 0.7));
      fletch.position.x = -0.36;
      fletch.rotation.x = i * Math.PI * 2 / 3;
      g.add(fletch);
    }
    return g;
  }
  if (kind === 'fireball') {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), glowMat('#ff7a2a', 0.9)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glowMat('#ffd23a', 0.95)));
    return g;
  }
  if (kind === 'oil') {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), pbr('#2a2418', 0.25)));
    const sheen = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pbr('#6a7a3a', 0.4));
    sheen.position.set(0.12, 0.12, 0.1);
    g.add(sheen);
    return g;
  }
  if (kind === 'musketball') {
    // tiny bright slug; spin 0, the streak carries the motion
    const g = new THREE.Group();
    const slug = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pbr('#d8d0b8', 0.4));
    slug.scale.set(2.2, 1, 1);
    g.add(slug);
    return g;
  }
  if (kind === 'cannonball') {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), pbr('#2a2a30', 0.45)));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 14), pbr('#4a4a52', 0.5));
    band.rotation.set(0.7, 0.4, 0);
    g.add(band);
    return g;
  }
  if (kind === 'shell') {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), pbr('#3a3028', 0.5)));
    // fuse stub + spark riding on top; the tumble reads as shell rotation.
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 6), pbr('#7a5a34', 0.8));
    fuse.position.y = 0.32;
    g.add(fuse);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glowMat('#ff8a3a', 0.95));
    spark.position.y = 0.42;
    g.add(spark);
    return g;
  }
  if (kind === 'bullet') {
    // hot tracer core; spin 0, the thin streak carries the motion
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat('#ffd28a', 0.95));
    core.scale.set(2.4, 1, 1);
    g.add(core);
    return g;
  }
  if (kind === 'rocket') {
    // finned body along +X (the aim axis); spin 0 so it never tumbles
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), pbr('#5a6068', 0.4));
    body.rotation.z = -Math.PI / 2;
    g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.25, 8), pbr('#8a2a2a', 0.5));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 0.47;
    g.add(nose);
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), pbr('#3a3f46', 0.5));
      fin.position.x = -0.3;
      fin.rotation.x = s * Math.PI / 2;
      g.add(fin);
    }
    const exhaust = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glowMat('#ff9a3a', 0.95));
    exhaust.position.x = -0.4;
    g.add(exhaust);
    return g;
  }
  if (kind === 'laser') {
    // cyan beam bolt along +X (the aim axis); spin 0 so it never tumbles
    const g = new THREE.Group();
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), glowMat('#00e5ff', 0.95));
    bolt.rotation.z = -Math.PI / 2;
    g.add(bolt);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6),
      new THREE.MeshBasicMaterial({ color: '#e8feff', fog: false }));
    core.rotation.z = -Math.PI / 2;
    g.add(core);
    return g;
  }
  if (kind === 'plasma') {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), glowMat('#ff5ad0', 0.9)));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), glowMat('#ffe8f8', 0.95)));
    return g;
  }
  const rg = rockGeo(0.16, 1);
  mottleGeo(rg, 0.12, 1);
  return new THREE.Mesh(rg, rockMat('#8d8d94', 0.85));
}

export function ProjectileMesh(kind) {
  const style = KIND_STYLE[kind] || KIND_STYLE.rock;
  const mesh = new THREE.Group();

  const core = buildCore(kind);
  mesh.add(core);

  const glow = glowSprite(GLOW_COLOR[kind] || '#fff2c8', 0.75, style.glowScale);
  mesh.add(glow);

  // stretched additive trail, aimed along -velocity each frame
  const trailGeo = new THREE.CylinderGeometry(0.06, 0.13, 1, 8, 1, true);
  trailGeo.rotateZ(Math.PI / 2); // length along X
  trailGeo.translate(-0.5, 0, 0); // extends toward -X from origin
  const trail = new THREE.Mesh(trailGeo, glowMat(style.trailColor, 0.5).clone());
  trail.scale.x = style.trailLen;
  mesh.add(trail);

  solidify(mesh, false, false);
  mesh.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  glow.frustumCulled = false;

  const _prev = new THREE.Vector3();
  let init = false;
  const _dir = new THREE.Vector3();

  return {
    mesh,
    update(dt) {
      core.rotation.x += dt * style.spin;
      core.rotation.z += dt * style.spin * 0.6;
      if (!init) {
        _prev.copy(mesh.position);
        init = true;
        return;
      }
      _dir.subVectors(mesh.position, _prev);
      const speed = _dir.length() / Math.max(dt, 1e-4);
      _prev.copy(mesh.position);
      if (speed > 0.5) {
        trail.visible = true;
        // yaw/pitch the group so +X follows velocity (roll stays zero)
        const yaw = Math.atan2(-_dir.z, _dir.x);
        const pitch = Math.atan2(_dir.y, Math.hypot(_dir.x, _dir.z));
        mesh.rotation.set(0, yaw, pitch);
        trail.scale.x = style.trailLen * THREE.MathUtils.clamp(speed / 8, 0.4, 1.6);
        trail.material.opacity = 0.35 + Math.min(0.3, speed / 40);
      } else {
        trail.visible = false;
      }
    },
    dispose() {
      disposeDeep(mesh);
      trailGeo.dispose();
    },
  };
}
