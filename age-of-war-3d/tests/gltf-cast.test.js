// Quaternius CC0 stone-age cast: templates parse from the vendored
// assets/quat files, instances mirror the UnitMesh {mesh, update, dispose}
// contract with real skeletal clips (Walk/attack/Death) instead of
// procedural limb swings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchQuatCast, setQuatTemplates, QuatUnitMesh, QUAT_ROLES } from '../src/units/gltf-cast.js';
import { UnitMesh } from '../src/units/units.js';
import * as THREE from 'three';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUAT = path.join(ROOT, '..', 'assets', 'quat');

// Same loading path as the browser: a fetch shim reading the vendored files.
async function loadTemplates() {
  const shim = async (url) => {
    const file = path.join(QUAT, path.basename(url));
    return {
      text: async () => fs.readFileSync(file, 'utf8'),
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

export default [
  {
    name: 'quat templates parse with walk, attack and death clips',
    async run(t) {
      const tpl = await loadTemplates();
      for (const role of ['clubman', 'slinger', 'hero']) {
        t.assert(`${role} template loaded`, !!tpl[role] && tpl[role].clips.size > 0, `${tpl[role]?.clips.size} clips`);
        t.assert(`${role} has Walk`, tpl[role].clips.has('Walk'), '');
        t.assert(`${role} has Death`, tpl[role].clips.has('Death'), '');
      }
      t.assert('clubman attacks with SwordSlash', tpl.clubman.clips.has('SwordSlash'), '');
      t.assert('slinger attacks with Shoot_OneHanded', tpl.slinger.clips.has('Shoot_OneHanded'), '');
      t.assert('raptor attacks with Velociraptor_Attack', tpl.dino.clips.has('Velociraptor_Attack'), '');
      t.assert('raptor walks with Velociraptor_Walk', tpl.dino.clips.has('Velociraptor_Walk'), '');
    },
  },
  {
    name: 'quat instances scale to procedural stone-age heights',
    async run(t) {
      const tpl = await loadTemplates();
      // procedural rig.height targets: clubman 2.1, slinger 1.95, shaman-hero 2.4*1.18, dino 3.1
      const targets = { clubman: 2.1, slinger: 1.95, hero: 2.4 * 1.18, dino: 3.1 };
      for (const [role, want] of Object.entries(targets)) {
        const got = tpl[role].height;
        t.assert(`${role} height ~${want}m`, Math.abs(got - want) / want < 0.05, `${got.toFixed(2)}m`);
      }
    },
  },
  {
    name: 'quat unit mirrors the UnitMesh contract and clip states',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity(), QUAT_ROLES.melee, tpl);
      t.assert('mesh is a Group', !!inst.mesh && inst.mesh.isGroup, '');
      t.assert('has update', typeof inst.update === 'function', '');
      t.assert('has dispose', typeof inst.dispose === 'function', '');

      // walking entity advances the mixer on the Walk clip
      const e = fakeEntity({ walkPhase: 0 });
      inst.update(0.016, e);
      e.walkPhase = 1;
      inst.update(0.05, e);
      t.assert('walk clip active while moving', inst.currentClip === 'Walk', inst.currentClip);

      // attack cooldown triggers the attack clip
      e.attackCooldown = 0.5;
      inst.update(0.016, e);
      t.assert('attack clip on strike', inst.currentClip === 'SwordSlash', inst.currentClip);

      // death plays Death and fades like the procedural rig
      e.dying = true; e.deathTimer = 0.2; e.attackCooldown = 0;
      inst.update(0.016, e);
      t.assert('death clip on dying', inst.currentClip === 'Death', inst.currentClip);

      // a second instance runs its own mixer independently
      const other = QuatUnitMesh(fakeEntity(), QUAT_ROLES.melee, tpl);
      other.update(0.016, fakeEntity({ walkPhase: 5 }));
      t.assert('instances independent', other !== inst && other.currentClip === 'Walk' && inst.currentClip === 'Death',
        `${other.currentClip} vs ${inst.currentClip}`);

      t.assert('dispose does not throw', (() => { try { inst.dispose(); other.dispose(); return true; } catch { return false; } })(), '');
    },
  },
  {
    name: 'UnitMesh delegates stone age to the cast once loaded',
    async run(t) {
      setQuatTemplates(null);
      const proc = UnitMesh(fakeEntity(), 0);
      t.assert('procedural fallback without templates', proc.currentClip === undefined, '');
      proc.dispose();

      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const quat = UnitMesh(fakeEntity(), 0);
      t.assert('quat mesh with templates', quat.currentClip === 'Idle', quat.currentClip);
      quat.dispose();

      const castle = UnitMesh(fakeEntity(), 1);
      t.assert('other ages stay procedural', castle.currentClip === undefined, '');
      castle.dispose();
      setQuatTemplates(null);
    },
  },
  {
    name: 'dino rider sits on the back, not sunk into the body',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'fast' }), QUAT_ROLES.fast, tpl);
      const body = inst.mesh.children[0];
      const rider = inst.mesh.children[1];
      t.assert('rider present', !!rider && rider.isGroup, inst.mesh.children.length);
      const bb = new THREE.Box3().setFromObject(body);
      const rb = new THREE.Box3().setFromObject(rider);
      const len = bb.max.x - bb.min.x;
      const cx = (rb.min.x + rb.max.x) / 2;
      const frac = (cx - bb.min.x) / len;
      t.assert('rider centered on mid-back', frac > 0.4 && frac < 0.65, frac.toFixed(2));
      t.assert('rider feet near the back line', rb.min.y >= bb.max.y * 0.85, `${rb.min.y.toFixed(2)} vs top ${bb.max.y.toFixed(2)}`);
      inst.dispose();
    },
  },
  {
    name: 'fbx specular wash neutralized (ghost-pale raptor)',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'fast' }), QUAT_ROLES.fast, tpl);
      const specs = [];
      inst.mesh.traverse((o) => {
        if (o.isMesh) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) if ('specular' in m) specs.push(m.specular.getHex());
        }
      });
      t.assert('dino has phong materials', specs.length > 0, specs.length);
      t.assert('no white specular wash', specs.every((s) => s < 0x808080), specs.map((s) => s.toString(16)).join(','));
      inst.dispose();
    },
  },
];
