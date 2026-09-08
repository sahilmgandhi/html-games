import * as THREE from 'three';
import { pbr, glowMat, glowSprite, solidify, disposeDeep } from '../core/pbr.js';

// Pooled 3D projectiles. Kinds: 'rock' (sling stone), 'egg' (white, wobbles),
// 'boulder' (catapult shot, burning trail, splash).
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
    g.add(new THREE.Mesh(rockGeo(0.38, 3), pbr('#5a5a62', 0.9)));
    const crack = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 12),
      new THREE.MeshBasicMaterial({ color: '#ff8a2a', fog: false }));
    crack.rotation.set(0.7, 0.4, 0);
    g.add(crack);
    return g;
  }
  return new THREE.Mesh(rockGeo(0.16, 1), pbr('#8d8d94', 0.85));
}

export function ProjectileMesh(kind) {
  const style = KIND_STYLE[kind] || KIND_STYLE.rock;
  const mesh = new THREE.Group();

  const core = buildCore(kind);
  mesh.add(core);

  const glow = glowSprite(kind === 'boulder' ? '#ff9a3a' : '#fff2c8', 0.75, style.glowScale);
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
