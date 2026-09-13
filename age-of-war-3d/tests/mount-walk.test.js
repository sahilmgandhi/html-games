import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { fetchQuatCast, QuatUnitMesh } from '../src/units/gltf-cast.js';
import { toMeters } from '../src/simulation/config.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUAT = path.join(ROOT, '..', 'assets', 'quat');

const TEX_KEYS = ['map', 'normalTexture', 'occlusionTexture', 'emissiveTexture', 'metallicRoughnessTexture'];
function stripImages(jsonText) {
  const json = JSON.parse(jsonText);
  delete json.images;
  delete json.textures;
  for (const m of json.materials || []) {
    for (const k of TEX_KEYS) delete m[k];
    if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness.baseColorTexture;
    delete m.extensions;
  }
  return JSON.stringify(json);
}
async function loadTemplates() {
  const shim = async (url) => {
    const file = path.join(QUAT, path.basename(url));
    return {
      text: async () => (url.endsWith('.gltf') ? stripImages(fs.readFileSync(file, 'utf8')) : fs.readFileSync(file, 'utf8')),
      arrayBuffer: async () => {
        const buf = fs.readFileSync(file);
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      },
    };
  };
  return fetchQuatCast(shim, `${QUAT}${path.sep}`);
}

function fakeEntity(over = {}) {
  return {
    side: 'player', type: 'fast', isHero: false, speed: 1.4,
    hp: 100, maxHp: 100, hitFlash: 0, dying: false, alive: true,
    deathTimer: 0, walkPhase: 0, attackSpeed: 1, attackCooldown: 0,
    x: 0, z: 0, ...over,
  };
}

function riderFeet(inst) {
  inst.mesh.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(inst.mesh.children[1]).min.y;
}

export function footBones(inst, skipFront) {
  const out = [];
  // children[0] is the mount/body; children[1] would be a rider's feet.
  inst.mesh.children[0].traverse((o) => {
    if (o.isBone && /foot/i.test(o.name) && !/end/i.test(o.name)) {
      if (skipFront && /^front/i.test(o.name)) return;
      out.push(o);
    }
  });
  return out;
}

// Visible sole motion: skinned-vertex mean for verts dominated by the foot
// bone. Bone origins lie (flat rigs never translate them), the skin is truth.
export function soleTracker(inst, footBone) {
  let entry = null;
  inst.mesh.traverse((o) => {
    if (entry || !o.isSkinnedMesh) return;
    const k = o.skeleton.bones.indexOf(footBone);
    if (k < 0) return;
    const si = o.geometry.attributes.skinIndex;
    const sw = o.geometry.attributes.skinWeight;
    const pos = o.geometry.attributes.position;
    const idx = [];
    for (let i = 0; i < si.count; i++) {
      let bk = -1;
      let bw = 0;
      for (let j = 0; j < 4; j++) {
        const wj = sw.getComponent(i, j);
        if (wj > bw) { bw = wj; bk = si.getComponent(i, j); }
      }
      if (bk === k && bw > 0.6) idx.push(i);
    }
    if (idx.length) entry = { mesh: o, idx, k };
  });
  if (!entry) return null;
  // Hoof bottom, not ankle: among foot-weighted verts keep the lowest
  // quartile by current height (dominant-weight picks joint verts whose
  // lever arm is ~17mm and cannot see rotation).
  const ys = entry.idx.map((i) => {
    const p = new THREE.Vector3().fromBufferAttribute(entry.mesh.geometry.attributes.position, i);
    p.applyMatrix4(entry.mesh.matrixWorld);
    return { i, y: p.y };
  });
  ys.sort((a, b) => a.y - b.y);
  entry.idx = ys.slice(0, Math.max(8, Math.floor(ys.length / 4))).map((e) => e.i);
  const m = new THREE.Matrix4();
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  return {
    count: entry.idx.length,
    sample() {
      const sk = entry.mesh.skeleton;
      inst.mesh.updateMatrixWorld(true);
      let sx = 0, sy = 0;
      for (const i of entry.idx) {
        v.fromBufferAttribute(entry.mesh.geometry.attributes.position, i);
        // world = mesh.matrixWorld * bindMatrixInverse * Σ w·B·bindMatrix·v
        w.set(0, 0, 0);
        const si = entry.mesh.geometry.attributes.skinIndex;
        const sw = entry.mesh.geometry.attributes.skinWeight;
        for (let j = 0; j < 4; j++) {
          const bj = si.getComponent(i, j);
          const wj = sw.getComponent(i, j);
          if (wj <= 0) continue;
          const bone = sk.bones[bj];
          if (!bone) continue;
          m.copy(bone.matrixWorld).multiply(sk.boneInverses[bj]);
          const t = v.clone().applyMatrix4(entry.mesh.bindMatrix).applyMatrix4(m);
          w.addScaledVector(t, wj);
        }
        w.applyMatrix4(entry.mesh.bindMatrixInverse).applyMatrix4(entry.mesh.matrixWorld);
        sx += w.x;
        sy += w.y;
      }
      return { x: sx / entry.idx.length, y: sy / entry.idx.length };
    },
  };
}

// March exactly like the sim: x advances, walkPhase advances, 1/60 steps.
function march(e, inst, frames) {
  const dt = 1 / 60;
  for (let f = 0; f < frames; f++) {
    e.x += e.speed * dt * 60;
    e.walkPhase += dt * e.speed * 4;
    inst.update(dt, e);
  }
  inst.mesh.updateMatrixWorld(true);
}

// dino rider straddles the raptor, knight rider dangles on the horse;
// both faults below read as "not mounted" in battle and gallery.
export default [
  {
    name: 'riders settle on the first frame, no spawn drop',
    async run(t) {
      const tpl = await loadTemplates();
      for (const [role, speed] of [['dino', 1.8], ['knight', 1.4]]) {
        const e = fakeEntity({ speed });
        const inst = QuatUnitMesh(e, role, tpl);
        const y0 = riderFeet(inst);
        for (let f = 0; f < 12; f++) inst.update(1 / 60, e);
        const y1 = riderFeet(inst);
        t.assert(`${role} rider settled at build`, Math.abs(y1 - y0) < 0.12, `${y0.toFixed(2)} -> ${y1.toFixed(2)}`);
        inst.dispose();
      }
    },
  },
  {
    name: 'planted feet stay planted while marching (no skate)',
    async run(t) {
      const tpl = await loadTemplates();
      const roles = [
        ['dino', 1.8, true],
        ['knight', 1.4, false],
        ['clubman', 0.8, false],
      ];
      for (const [role, speed, skipFront] of roles) {
        const e = fakeEntity({ speed, type: role === 'dino' || role === 'knight' ? 'fast' : 'melee' });
        const inst = QuatUnitMesh(e, role, tpl);
        const dt = 1 / 60;
        const bodyStep = toMeters(speed * dt * 60);
        for (const foot of footBones(inst, skipFront)) {
          const sole = soleTracker(inst, foot);
          t.assert(`${role} ${foot.name} has skinned sole verts`, sole && sole.count > 0, String(sole && sole.count));
          if (!sole) continue;
          const ee = fakeEntity({ speed, type: e.type });
          // Contact = the overlay's own stance window (f01 < 0.6), not a
          // height guess: height minima mix clip lifts with stance.
          const fb = /^front/i.test(foot.name) ? 'front' : (/^back/i.test(foot.name) ? 'back' : null);
          const off = (foot.name.endsWith('R') ? Math.PI : 0) + (fb === 'back' ? Math.PI : 0);
          let slide = 0;
          let n = 0;
          let swing = 0;
          let m = 0;
          let lastX = null;
          for (let f = 0; f < 300; f++) {
            ee.x += ee.speed * dt * 60;
            ee.walkPhase += dt * ee.speed * 4;
            inst.update(dt, ee);
            const p = sole.sample();
            const cyc = (ee.walkPhase + off) / (Math.PI * 2);
            const f01 = cyc - Math.floor(cyc);
            if (lastX !== null) {
              if (f01 < 0.6) {
                slide += Math.abs(p.x - lastX);
                n++;
              } else {
                swing += p.x - lastX;
                m++;
              }
            }
            lastX = p.x;
          }
          const ratio = n > 0 ? slide / n / bodyStep : 99;
          t.assert(`${role} ${foot.name} plants (slip ${(ratio * 100).toFixed(0)}%)`, ratio < 0.6, `slip ${ratio.toFixed(2)} over ${n} frames`);
          t.assert(`${role} ${foot.name} swings forward`, swing > 0, `swing ${swing.toFixed(2)}`);
        }
        inst.dispose();
      }
    },
  },
];
