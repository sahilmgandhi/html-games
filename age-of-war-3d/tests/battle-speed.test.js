import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BattleSim } from '../src/simulation/battle.js';
import { attachBattleView } from '../src/demo-battle/battle-view.js';
import { fetchQuatCast, setQuatTemplates, QuatUnitMesh, QUAT_ROLES } from '../src/units/gltf-cast.js';

// Render-side skeletal animation must run on sim time, not wall time: at
// gameSpeed 3 the sim advances 3x per frame, so mixer updates must also
// advance 3x or feet slide across the ground (stone-batch foot-slide bug).
// NOTE: the procedural rig ignores the update dt entirely (limbs are driven
// by sim-advanced walkPhase), so this test measures SKINNED BONE motion from
// the shipped Quaternius cast, the only path that consumes the dt argument.
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

let tplCache = null;
async function loadTemplates() {
  if (tplCache) return tplCache;
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
  tplCache = await fetchQuatCast(shim, `${QUAT}${path.sep}`);
  return tplCache;
}

function makeGame(captured) {
  let fn = null;
  const position = {
    x: 0, y: 0, z: 0,
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; },
    lerp() { return this; },
  };
  return {
    scene: { add(m) { captured.push(m); }, remove() {} },
    camera: { position, lookAt() {} },
    onUpdate(f) { fn = f; return () => { fn = null; }; },
    frame(dt) { fn(dt); },
  };
}

function boneAngles(mesh) {
  const arr = [];
  mesh.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) {
      for (const b of o.skeleton.bones) arr.push(b.quaternion.clone());
    }
  });
  return arr;
}

// Angular distance travelled from bind pose: cancels the large constant of
// rest-pose rotations so the assertion measures mixer advancement only.
function boneTravel(mesh, bind) {
  const live = boneAngles(mesh);
  if (live.length === 0 || live.length !== bind.length) return -1;
  let sum = 0;
  for (let i = 0; i < live.length; i++) sum += live[i].angleTo(bind[i]);
  return sum;
}

export default [
  {
    name: 'skeletal walk animation advances on sim time (3x speed = 3x bone motion)',
    async run(t) {
      const tpl = await loadTemplates();
      const motions = [];
      const fake = {
        side: 'player', type: 'melee', isHero: false,
        hp: 100, maxHp: 100, hitFlash: 0, dying: false, alive: true,
        deathTimer: 0, walkPhase: 0, attackSpeed: 1, attackCooldown: 0, x: 0, z: 0,
      };
      for (const speed of [1, 3]) {
        setQuatTemplates(tpl);
        const sim = new BattleSim({ seed: 7, autoAI: false });
        sim.gameSpeed = speed;
        sim.spawnUnit(0);
        t.assert('unit spawned', sim.units.length === 1, `units=${sim.units.length}`);
        const captured = [];
        const game = makeGame(captured);
        const view = attachBattleView(game, sim, null, { lockCamera: true });
        game.frame(1 / 60);
        const bind = boneAngles(QuatUnitMesh({ ...fake }, QUAT_ROLES.melee, tpl).mesh);
        let motion = -1;
        for (const m of captured) {
          const s = boneTravel(m, bind);
          if (s > 0) { motion = s; break; }
        }
        motions.push(motion);
        view.dispose();
        setQuatTemplates(null);
      }
      t.assert('skinned bone motion measured at both speeds', motions[0] > 0 && motions[1] > 0,
        JSON.stringify(motions.map((s) => s.toFixed(4))));
      t.assert('3x speed advances skeletal walk ~3x (sim time, not wall time)',
        motions[0] > 0 && motions[1] / motions[0] > 1.5,
        `motions=${motions.map((s) => s.toFixed(4)).join(',')}`);
    },
  },
];
