import * as THREE from 'three';
import { mulberry32 } from '../simulation/rng.js';

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
// Second high-frequency octave + slight height wobble for surface definition.
export function jitterGeo(geo, amt = 0.12, freq = 2.5, seed = 1) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const w = 1 + amt * Math.sin(x * freq + seed) * Math.cos(z * freq * 1.3 + seed * 2)
      + amt * 0.5 * Math.sin(y * freq * 2 + seed * 3)
      + amt * 0.35 * Math.sin(x * freq * 3.7 + seed * 5) * Math.cos(z * freq * 3.1 + seed * 7);
    const h = 1 + amt * 0.3 * Math.sin(x * freq * 2.3 + seed) * Math.cos(z * freq * 2.1 + seed * 4);
    pos.setXYZ(i, x * w, y * h, z * w);
  }
  geo.computeVertexNormals();
  return geo;
}

// Seeded per-vertex brightness jitter: mottled rock/earth variation. Writes a
// 'color' attribute, so the mesh MUST use a vertexColors material (rockMat).
export function mottleGeo(geo, amt = 0.12, seed = 1) {
  const rng = mulberry32((seed * 1e6) | 0);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = 1 + (rng() * 2 - 1) * amt;
    col[i * 3] = v;
    col[i * 3 + 1] = v;
    col[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// Fresh (uncached) faceted rock material: flatShading for crisp facets over
// jittered geometry, vertexColors for mottleGeo variation. Fresh per call
// because a shared instance would leak across geos with/without color
// attributes (missing attribute + vertexColors renders black).
export function rockMat(color, roughness = 0.95) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness: 0.0, flatShading: true, vertexColors: true,
  });
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

// Painted heraldic emblem: side-color field with a pale device, plus weave
// noise and a dark hem so it reads as dyed cloth, not a decal. kinds:
// 'disc' | 'cross' | 'chevron' | 'bolt' | 'crescent'. Returns a fresh
// CanvasTexture each call (caller owns disposal via disposeDeep).
export function emblemTexture(bg, fg, kind = 'disc') {
  const t = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // weave: horizontal thread shading
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    for (let y = 1; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
    // device, centered with margin for the hem
    ctx.fillStyle = fg;
    const cx = w / 2, cy = h / 2, s = w * 0.30;
    if (kind === 'disc') {
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.8, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'cross') {
      ctx.fillRect(cx - s * 0.22, cy - s, s * 0.44, s * 2);
      ctx.fillRect(cx - s, cy - s * 0.22, s * 2, s * 0.44);
    } else if (kind === 'chevron') {
      ctx.beginPath();
      ctx.moveTo(cx - s, cy + s * 0.7);
      ctx.lineTo(cx, cy - s * 0.5);
      ctx.lineTo(cx + s, cy + s * 0.7);
      ctx.lineTo(cx + s, cy + s * 0.1);
      ctx.lineTo(cx, cy - s * 1.1);
      ctx.lineTo(cx - s, cy + s * 0.1);
      ctx.closePath(); ctx.fill();
    } else if (kind === 'bolt') {
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.3, cy - s);
      ctx.lineTo(cx - s * 0.5, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.05, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.3, cy + s);
      ctx.lineTo(cx + s * 0.5, cy - s * 0.2);
      ctx.lineTo(cx + s * 0.05, cy - s * 0.2);
      ctx.closePath(); ctx.fill();
    } else { // crescent
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx + s * 0.4, cy - s * 0.15, s * 0.7, 0, Math.PI * 2); ctx.fill();
    }
    // grit speckle over everything
    for (let i = 0; i < 500; i++) {
      ctx.globalAlpha = 0.05 + Math.random() * 0.06;
      ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.globalAlpha = 1;
    // dark hem border
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 7;
    ctx.strokeRect(0, 0, w, h);
  });
  t.anisotropy = 4;
  return t;
}

// Fresh (uncached) banner material: emblem map on a standard material so it
// takes light like the rest of the base. Safe to pass to makeCloth (clones).
export function bannerMat(accent, kind) {
  return new THREE.MeshStandardMaterial({
    map: emblemTexture(accent, '#e8e2d4', kind),
    roughness: 0.8,
    metalness: 0.0,
  });
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
// 256x32 canvas with an iron border and segmented fill so the bar stays
// crisp at close camera range instead of smearing like the old 64x10.
export function makeHpBar(width = 1.4) {
  const W = 256;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })
  );
  sprite.scale.set(width, width * (H / W), 1);
  sprite.renderOrder = 20;
  let last = -1;
  return {
    sprite,
    set(frac) {
      const q = Math.round(THREE.MathUtils.clamp(frac, 0, 1) * 48);
      if (q === last) return;
      last = q;
      const g = c.getContext('2d');
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(8,8,10,0.78)';
      g.fillRect(0, 0, W, H);
      g.strokeStyle = '#1c1c22';
      g.lineWidth = 4;
      g.strokeRect(2, 2, W - 4, H - 4);
      g.fillStyle = q > 24 ? '#5dd35d' : q > 12 ? '#e8b53a' : '#e05252';
      const inner = W - 16;
      g.fillRect(8, 8, Math.ceil(inner * (q / 48)), H - 16);
      // segment gaps: gritty riveted-plate read
      g.fillStyle = 'rgba(8,8,10,0.78)';
      for (let i = 1; i < 12; i++) {
        const x = 8 + Math.round((inner * i) / 12);
        g.fillRect(x - 1, 8, 2, H - 16);
      }
      tex.needsUpdate = true;
    },
  };
}

// Rippling cloth banner shared by every age's base. Hoist edge pinned at
// local x=0, wave amplitude growing toward the fly end. The material is
// cloned so DoubleSide stays local to the banner. Returns { mesh, update(t) }.
export function makeCloth(w, h, segW, mat) {
  const geo = new THREE.PlaneGeometry(w, h, segW, 2);
  geo.translate(w / 2, 0, 0);
  const m = mat.clone();
  m.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, m);
  const base = geo.attributes.position.array.slice();
  return {
    mesh,
    update(t) {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const k = bx / w;
        pos.setZ(i, Math.sin(t * 5 + bx * 3 + by * 1.5) * 0.14 * k
          + Math.sin(t * 9 + by * 4) * 0.04 * k);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

// Flat team-color ground ring for unit/turret/base readability. Basic
// material ignores light and shadow, so it never darkens the ground or
// casts; add AFTER solidify() so it keeps castShadow off.
export function teamRing(radius, color, opacity = 0.8) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.82, radius, 40),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.07;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 1;
  return mesh;
}

export function disposeDeep(root) {  root.traverse((o) => {
    if (o.isMesh) {
      o.geometry?.dispose?.();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose?.());
      else m?.dispose?.();
    }
  });
}
