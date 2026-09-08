import * as THREE from 'three';

// Shared procedural-PBR helpers (integrator-owned). Every gameplay module builds
// meshes from these so palette, roughness and shadow flags stay consistent.
// Cached materials are SHARED — a module that needs per-instance emissive
// (hit flash) must call cloneMats() on its own root first.

const _cache = new Map();

export function pbr(color, roughness = 0.85, metalness = 0.0) {
  const key = `${color}|${roughness}|${metalness}`;
  let m = _cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    _cache.set(key, m);
  }
  return m;
}

export function basic(color, { transparent = false, opacity = 1, fog = true } = {}) {
  return new THREE.MeshBasicMaterial({ color, transparent, opacity, fog });
}

export function glowMat(color, opacity = 0.6) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
}

// Soft radial sprite texture, shared by every glow/puff sprite. Sprites must
// use SpriteMaterial (MeshBasicMaterial on a Sprite renders as a hard quad).
let _glowTex = null;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  _glowTex = canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });
  return _glowTex;
}

export function glowSprite(color, opacity = 0.7, scale = 1, additive = true) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
    fog: false,
  }));
  s.scale.set(scale, scale, 1);
  return s;
}

// Deterministic rock jitter: breaks smooth lathe/cylinder silhouettes.
export function jitterGeo(geo, amt = 0.12, freq = 2.5, seed = 1) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const w = 1 + amt * Math.sin(x * freq + seed) * Math.cos(z * freq * 1.3 + seed * 2)
      + amt * 0.5 * Math.sin(y * freq * 2 + seed * 3);
    pos.setXYZ(i, x * w, y, z * w);
  }
  geo.computeVertexNormals();
  return geo;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function solidify(root, cast = true, receive = true) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
  return root;
}

// Deep-clone every material under root so the instance can flash/fade
// independently. Returns the list of cloned materials.
export function cloneMats(root) {
  const mats = [];
  root.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.clone();
      mats.push(o.material);
    }
  });
  return mats;
}

export const SIDE_ACCENT = {
  player: '#4a8af4',
  enemy: '#f44a4a',
};

// Floating HP bar billboard. set(frac) redraws only on visible change.
export function makeHpBar(width = 1.4) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 10;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })
  );
  sprite.scale.set(width, width * (10 / 64), 1);
  sprite.renderOrder = 20;
  let last = -1;
  return {
    sprite,
    set(frac) {
      const q = Math.round(THREE.MathUtils.clamp(frac, 0, 1) * 24);
      if (q === last) return;
      last = q;
      const g = c.getContext('2d');
      g.clearRect(0, 0, 64, 10);
      g.fillStyle = 'rgba(0,0,0,0.65)';
      g.fillRect(0, 0, 64, 10);
      g.fillStyle = q > 12 ? '#5dd35d' : q > 6 ? '#e8b53a' : '#e05252';
      g.fillRect(1, 1, Math.ceil(62 * (q / 24)), 8);
      tex.needsUpdate = true;
    },
  };
}

export function disposeDeep(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.geometry?.dispose?.();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose?.());
      else m?.dispose?.();
    }
  });
}
