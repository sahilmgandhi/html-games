import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { fetchQuatCast, setQuatTemplates, QuatUnitMesh } from '../src/units/gltf-cast.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUAT = path.join(ROOT, '..', 'assets', 'quat');

function stripImages(jsonText) {
  const json = JSON.parse(jsonText);
  delete json.images;
  delete json.textures;
  for (const m of json.materials || []) {
    delete m.map;
    delete m.normalTexture;
    delete m.occlusionTexture;
    delete m.emissiveTexture;
    delete m.metallicRoughnessTexture;
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

// BUG-005: the musketeer fires on the Punch clip, and the muzzle point
// plunges with the punching rifle. The flash and tracer must stay above
// the dirt on a level shot line, never stab the ground.
export default [
  {
    name: 'muzzle FX stays above ground through the punch',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const e = {
        side: 'player', type: 'ranged', isHero: false,
        hp: 100, maxHp: 100, hitFlash: 0, dying: false, alive: true,
        deathTimer: 0, walkPhase: 0, attackSpeed: 1, attackCooldown: 0,
        x: 0, z: 0,
      };
      const inst = QuatUnitMesh(e, 'musketeer', tpl);
      inst.update(1 / 60, e);
      e.attackCooldown = 0.5;
      let worst = Infinity;
      for (let f = 0; f < 30; f++) {
        inst.update(1 / 60, e);
        e.attackCooldown = Math.max(0.01, e.attackCooldown - 1 / 60);
        inst.mesh.updateMatrixWorld(true);
        inst.mesh.traverse((o) => {
          if ((o.name === 'tracer' || o.name === 'muzzleflash') && o.isMesh) {
            o.geometry.computeBoundingBox();
            const bb = o.geometry.boundingBox;
            const el = o.matrixWorld.elements;
            worst = Math.min(worst,
              el[5] * bb.min.y + el[13], el[5] * bb.max.y + el[13]);
          }
        });
      }
      t.assert('muzzle FX never breaches 15cm', worst >= 0.15, `worst=${worst.toFixed(2)}m`);
      setQuatTemplates(null);
    },
  },
];
