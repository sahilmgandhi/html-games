import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import {
  fetchQuatCast, setQuatTemplates, QuatUnitMesh,
  QUAT_ROLES, CASTLE_ROLES, RENAISSANCE_ROLES, MODERN_ROLES, FUTURE_ROLES,
} from '../src/units/gltf-cast.js';
import { UnitMesh } from '../src/units/units.js';

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
    side: 'player', type: 'melee', isHero: false,
    hp: 100, maxHp: 100, hitFlash: 0, dying: false, alive: true,
    deathTimer: 0, walkPhase: 0, attackSpeed: 1, attackCooldown: 0,
    x: 0, z: 0, ...over,
  };
}

// Lowest rigid mesh point in world metres. Skinned parts, HP sprites,
// team rings and transient muzzle FX excluded: this measures planted feet
// and hand props.
function lowestPoint(mesh) {
  const root = new THREE.Group();
  root.add(mesh);
  root.updateMatrixWorld(true);
  let m = Infinity;
  let what = '';
  mesh.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    if (o.name === 'tracer') return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    const e = o.matrixWorld.elements;
    const lo = Math.min(e[5] * bb.min.y + e[13], e[5] * bb.max.y + e[13]);
    if (lo < m) { m = lo; what = `${o.name || o.geometry.type}@y=${o.position.y.toFixed(2)}`; }
  });
  root.remove(mesh);
  return { min: m, what };
}

const ROLE_SETS = [QUAT_ROLES, CASTLE_ROLES, RENAISSANCE_ROLES, MODERN_ROLES, FUTURE_ROLES];

export default [
  {
    name: 'quat casts plant feet and props at or above ground',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const seen = new Set();
      for (const roles of ROLE_SETS) {
        for (const role of Object.values(roles)) {
          if (seen.has(role)) continue;
          seen.add(role);
          const { mesh } = QuatUnitMesh(fakeEntity(), role, tpl);
          const { min, what } = lowestPoint(mesh);
          t.assert(`${role} lowest point above -6cm`, min >= -0.06, `${role}: ${min.toFixed(2)}m (${what})`);
        }
      }
      setQuatTemplates(null);
    },
  },
  {
    name: 'quat casts stay above ground through walk and attack',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const seen = new Set();
      for (const roles of ROLE_SETS) {
        for (const role of Object.values(roles)) {
          if (seen.has(role)) continue;
          seen.add(role);
          const e = fakeEntity();
          const inst = QuatUnitMesh(e, role, tpl);
          let worst = Infinity;
          let worstWhat = '';
          for (let f = 0; f < 90; f++) {
            e.walkPhase += 0.12;
            e.attackCooldown = f >= 60 ? 0.5 : 0;
            e.attackSpeed = 1;
            inst.update(1 / 60, e);
            const { min, what } = lowestPoint(inst.mesh);
            if (min < worst) { worst = min; worstWhat = `${f < 60 ? 'walk' : 'attack'}:${what}`; }
          }
          t.assert(`${role} never breaches -6cm in motion`, worst >= -0.06,
            `${role}: ${worst.toFixed(2)}m (${worstWhat})`);
        }
      }
      setQuatTemplates(null);
    },
  },
  {
    name: 'procedural fallback rigs plant feet at or above ground',
    run(t) {
      for (let age = 0; age < 5; age++) {
        const um = UnitMesh(fakeEntity(), age);
        um.update(0, fakeEntity());
        const { min, what } = lowestPoint(um.mesh);
        t.assert(`procedural age ${age} lowest point above -6cm`, min >= -0.06, `age${age}: ${min.toFixed(2)}m (${what})`);
        um.dispose();
      }
    },
  },
];
