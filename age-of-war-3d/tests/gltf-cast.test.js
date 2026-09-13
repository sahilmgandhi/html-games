// Quaternius CC0 stone-age cast: templates parse from the vendored
// assets/quat files, instances mirror the UnitMesh {mesh, update, dispose}
// contract with real skeletal clips (Walk/attack/Death) instead of
// procedural limb swings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchQuatCast, setQuatTemplates, QuatUnitMesh, QUAT_ROLES, CASTLE_ROLES, RENAISSANCE_ROLES, MODERN_ROLES, FUTURE_ROLES, tintGold, nightPrep, quatRoleFor } from '../src/units/gltf-cast.js';
import { UnitMesh } from '../src/units/units.js';
import * as THREE from 'three';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUAT = path.join(ROOT, '..', 'assets', 'quat');

// Same loading path as the browser: a fetch shim reading the vendored files.
// Node cannot decode the pirates' embedded PNG atlas (no ImageBitmap), so
// the shim strips image-bearing JSON keys before parse. Geometry, rigs and
// clips parse identically; tests measure structure, never pixels.
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

      setQuatTemplates(null);
      const future = UnitMesh(fakeEntity(), 4);
      t.assert('future procedural before templates load', future.currentClip === undefined, '');
      future.dispose();
      setQuatTemplates(null);
    },
  },
  {
    name: 'castle templates parse with walk, attack and death clips',
    async run(t) {
      const tpl = await loadTemplates();
      for (const role of ['swordsman', 'archer', 'paladin']) {
        t.assert(`${role} template loaded`, !!tpl[role] && tpl[role].clips.size > 0, `${tpl[role]?.clips.size} clips`);
        t.assert(`${role} has Walk`, tpl[role].clips.has('Walk'), '');
        t.assert(`${role} has Death`, tpl[role].clips.has('Death'), '');
      }
      t.assert('swordsman attacks with SwordSlash', tpl.swordsman.clips.has('SwordSlash'), '');
      t.assert('archer attacks with Shoot_OneHanded', tpl.archer.clips.has('Shoot_OneHanded'), '');
      t.assert('horse walks', tpl.knight.clips.has('Walk'), '');
      t.assert('horse runs', tpl.knight.clips.has('Run'), '');
      t.assert('horse dies', tpl.knight.clips.has('Death'), '');
    },
  },
  {
    name: 'castle instances scale to procedural castle heights',
    async run(t) {
      const tpl = await loadTemplates();
      // procedural rig.height targets: swordsman 2.15, archer 2.0, paladin-hero 2.5*1.18, knight 2.9
      const targets = { swordsman: 2.15, archer: 2.0, paladin: 2.5 * 1.18, knight: 2.9 };
      for (const [role, want] of Object.entries(targets)) {
        const got = tpl[role].height;
        t.assert(`${role} height ~${want}m`, Math.abs(got - want) / want < 0.05, `${got.toFixed(2)}m`);
      }
    },
  },
  {
    name: 'UnitMesh delegates castle age to the cast once loaded',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const q = UnitMesh(fakeEntity(), 1);
      t.assert('quat castle mesh', q.currentClip === 'Idle', q.currentClip);
      q.dispose();
      t.assert('melee maps to swordsman', quatRoleFor(fakeEntity({ type: 'melee' }), 1) === CASTLE_ROLES.melee, '');
      t.assert('ranged maps to archer', quatRoleFor(fakeEntity({ type: 'ranged' }), 1) === CASTLE_ROLES.ranged, '');
      t.assert('fast maps to knight', quatRoleFor(fakeEntity({ type: 'fast' }), 1) === CASTLE_ROLES.fast, '');
      t.assert('hero maps to paladin', quatRoleFor(fakeEntity({ isHero: true }), 1) === CASTLE_ROLES.hero, '');
      t.assert('stone mapping unchanged', quatRoleFor(fakeEntity({ type: 'melee' }), 0) === QUAT_ROLES.melee, '');
      setQuatTemplates(null);
    },
  },
  {
    name: 'stone fighters carry hand props: club, slingshot, shaman staff',
    async run(t) {
      const tpl = await loadTemplates();
      const club = QuatUnitMesh(fakeEntity({ type: 'melee' }), QUAT_ROLES.melee, tpl);
      const fistR = club.mesh.getObjectByName('FistR');
      t.assert('clubman has a right fist bone', !!fistR, '');
      t.assert('club hangs off the right fist', !!fistR && !!fistR.getObjectByName('club'), '');
      club.dispose();
      const sling = QuatUnitMesh(fakeEntity({ type: 'ranged' }), QUAT_ROLES.ranged, tpl);
      t.assert('slingshot present', !!sling.mesh.getObjectByName('slingshot'), '');
      sling.dispose();
      const shaman = QuatUnitMesh(fakeEntity({ isHero: true }), QUAT_ROLES.hero, tpl);
      const wfist = shaman.mesh.getObjectByName('FistR');
      t.assert('shaman has a right fist bone', !!wfist, '');
      t.assert('staff hangs off the right fist', !!wfist && !!wfist.getObjectByName('staff'), '');
      shaman.dispose();
    },
  },
  {
    name: 'castle fighters carry steel: swordsman sword, paladin sword+shield, rider sword',
    async run(t) {
      const tpl = await loadTemplates();
      const sword = QuatUnitMesh(fakeEntity({ type: 'melee' }), CASTLE_ROLES.melee, tpl);
      const fistR = sword.mesh.getObjectByName('FistR');
      t.assert('swordsman has a right fist bone', !!fistR, '');
      t.assert('sword hangs off the right fist', !!fistR && !!fistR.getObjectByName('sword'), '');
      sword.dispose();
      const pal = QuatUnitMesh(fakeEntity({ isHero: true }), CASTLE_ROLES.hero, tpl);
      const pfist = pal.mesh.getObjectByName('FistR');
      t.assert('paladin sword hangs off the right fist', !!pfist && !!pfist.getObjectByName('sword'), '');
      const farm = pal.mesh.getObjectByName('LowerArmL') || pal.mesh.getObjectByName('UpperArmL');
      t.assert('paladin shield rides the left arm', !!farm && !!farm.getObjectByName('shield'), '');
      pal.dispose();
      const knight = QuatUnitMesh(fakeEntity({ type: 'fast' }), CASTLE_ROLES.fast, tpl);
      const rider = knight.mesh.children[1];
      const rfist = rider && rider.getObjectByName('FistR');
      t.assert('knight rider sword hangs off the right fist', !!rfist && !!rfist.getObjectByName('sword'), '');
      knight.dispose();
    },
  },
  {
    name: 'archer carries a longbow in the fist and a quiver on the back',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'ranged' }), CASTLE_ROLES.ranged, tpl);
      const bow = inst.mesh.getObjectByName('longbow');
      t.assert('longbow present', !!bow, '');
      const fist = inst.mesh.getObjectByName('FistL');
      t.assert('bow hangs off the left fist', !!fist && (bow === fist || fist.children.includes(bow) || !!fist.getObjectByName('longbow')), '');
      t.assert('quiver present', !!inst.mesh.getObjectByName('quiver'), '');
      inst.dispose();
    },
  },
  {
    name: 'knight rider sits mid-back with feet dangling past the barrel',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'fast' }), CASTLE_ROLES.fast, tpl);
      const body = inst.mesh.children[0];
      const rider = inst.mesh.children[1];
      t.assert('rider present', !!rider && rider.isGroup, inst.mesh.children.length);
      const bb = new THREE.Box3().setFromObject(body);
      const rb = new THREE.Box3().setFromObject(rider);
      const len = bb.max.x - bb.min.x;
      const frac = ((rb.min.x + rb.max.x) / 2 - bb.min.x) / len;
      t.assert('rider centered on mid-back', frac > 0.4 && frac < 0.65, frac.toFixed(2));
      t.assert('rider feet dangle below the back line', rb.min.y < bb.max.y, `${rb.min.y.toFixed(2)} vs top ${bb.max.y.toFixed(2)}`);
      // rider fights with a sword while the horse drives
      const e = fakeEntity({ type: 'fast', walkPhase: 0 });
      inst.update(0.016, e);
      e.attackCooldown = 0.5;
      inst.update(0.016, e);
      t.assert('rider slashes on attack', inst.riderClip === 'SwordSlash', inst.riderClip);
      inst.dispose();
    },
  },
  {
    name: 'horse phong has no white specular wash',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'fast' }), CASTLE_ROLES.fast, tpl);
      const specs = [];
      inst.mesh.traverse((o) => {
        if (o.isMesh) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) if ('specular' in m) specs.push(m.specular.getHex());
        }
      });
      t.assert('horse has phong materials', specs.length > 0, specs.length);
      t.assert('no white specular wash', specs.every((s) => s < 0x808080), specs.map((s) => s.toString(16)).join(','));
      inst.dispose();
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
      // Hips-anchored mid-back sits slightly past box middle on long-tailed
      // mounts (verified seated in gallery close-up, not tail-sitting).
      t.assert('rider centered on mid-back', frac > 0.4 && frac < 0.78, frac.toFixed(2));
      // Feet zone around the hips: straddling the barrel, clear of both
      // dirt and crest (box-top fractions encoded the old float).
      const hips = body.getObjectByName('Hips');
      const hv = new THREE.Vector3();
      (hips || body).getWorldPosition(hv);
      inst.mesh.updateMatrixWorld(true);
      t.assert('rider feet straddle the hips', rb.min.y > hv.y - 0.2 && rb.min.y < hv.y + 0.5,
        `${rb.min.y.toFixed(2)} vs hips ${hv.y.toFixed(2)}`);
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
  {
    name: 'castle dark authored colors lifted for night readability',
    async run(t) {
      const tpl = await loadTemplates();
      const maxByte = (root) => {
        let mx = 0;
        root.traverse((o) => {
          if (o.isMesh) {
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of ms) {
              if (!m.color) continue;
              const h = m.color.getHex();
              mx = Math.max(mx, (h >> 16) & 255, (h >> 8) & 255, h & 255);
            }
          }
        });
        return mx;
      };
      // horse coat #2d130c reads as silhouette at night without lift;
      // knight/paladin runtime colors already clear the bar, locked in here
      t.assert('knight armor readable', maxByte(tpl.swordsman.object) >= 100, maxByte(tpl.swordsman.object));
      t.assert('horse coat readable', maxByte(tpl.knight.object) >= 100, maxByte(tpl.knight.object));
      t.assert('paladin armor readable', maxByte(tpl.paladin.object) >= 100, maxByte(tpl.paladin.object));
    },
  },
  {
    name: 'renaissance templates parse with walk, attack and death clips',
    async run(t) {
      const tpl = await loadTemplates();
      for (const role of ['dueler', 'musketeer', 'cannoneer', 'engineer']) {
        t.assert(`${role} template loaded`, !!tpl[role] && tpl[role].clips.size > 0, `${tpl[role]?.clips.size} clips`);
        t.assert(`${role} has Walk`, tpl[role].clips.has('Walk'), '');
        t.assert(`${role} has Death`, tpl[role].clips.has('Death'), '');
      }
      t.assert('dueler attacks with Sword', tpl.dueler.clips.has('Sword'), '');
      t.assert('musketeer punches (no shoot clip authored)', tpl.musketeer.clips.has('Punch'), '');
      t.assert('cannon mount template loaded', !!tpl.cannon && !!tpl.cannon.object, '');
      t.assert('rifle prop template loaded', !!tpl.rifleProp && !!tpl.rifleProp.object, '');
    },
  },
  {
    name: 'renaissance instances scale to procedural heights',
    async run(t) {
      const tpl = await loadTemplates();
      // procedural rig.height targets: dueler 2.1, musketeer 2.15, cannoneer crew 2.2, engineer-hero 2.6*1.18
      const targets = { dueler: 2.1, musketeer: 2.15, cannoneer: 2.2, engineer: 2.6 * 1.18 };
      for (const [role, want] of Object.entries(targets)) {
        const got = tpl[role].height;
        t.assert(`${role} height ~${want}m`, Math.abs(got - want) / want < 0.05, `${got.toFixed(2)}m`);
      }
      t.assert('cannon mount stays authored size', Math.abs(tpl.cannon.scale - 1.0) < 0.05, tpl.cannon.scale.toFixed(2));
    },
  },
  {
    name: 'UnitMesh delegates renaissance age to the cast once loaded',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const q = UnitMesh(fakeEntity(), 2);
      t.assert('quat renaissance mesh', q.currentClip === 'Idle', q.currentClip);
      q.dispose();
      t.assert('melee maps to dueler', quatRoleFor(fakeEntity({ type: 'melee' }), 2) === RENAISSANCE_ROLES.melee, '');
      t.assert('ranged maps to musketeer', quatRoleFor(fakeEntity({ type: 'ranged' }), 2) === RENAISSANCE_ROLES.ranged, '');
      t.assert('siege maps to cannoneer', quatRoleFor(fakeEntity({ type: 'siege' }), 2) === RENAISSANCE_ROLES.siege, '');
      t.assert('hero maps to engineer', quatRoleFor(fakeEntity({ isHero: true }), 2) === RENAISSANCE_ROLES.hero, '');
      t.assert('castle mapping unchanged', quatRoleFor(fakeEntity({ type: 'melee' }), 1) === CASTLE_ROLES.melee, '');
      setQuatTemplates(null);
    },
  },
  {
    name: 'musketeer hides the sword and shoulders the rifle',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'ranged' }), RENAISSANCE_ROLES.ranged, tpl);
      const rifle = inst.mesh.getObjectByName('rifle');
      t.assert('rifle present', !!rifle, '');
      const hand = inst.mesh.getObjectByName('Middle1R');
      t.assert('rifle hangs off the firing hand', !!hand && !!hand.getObjectByName('rifle'), '');
      let swordVisible = false;
      inst.mesh.traverse((o) => { if (o.name === 'Weapon_Sword' && o.visible) swordVisible = true; });
      t.assert('cutlass hidden', !swordVisible, '');
      inst.dispose();
    },
  },
  {
    name: 'musketeer muzzle flash and tracer fire on the attack edge, then expire',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'ranged' }), RENAISSANCE_ROLES.ranged, tpl);
      inst.update(0.016, fakeEntity({ type: 'ranged', attackCooldown: 0 }));
      t.assert('no flash before the edge', !inst.mesh.getObjectByName('muzzleflash'), '');
      inst.update(0.016, fakeEntity({ type: 'ranged', attackCooldown: 1.5 }));
      t.assert('flash appears on the edge', !!inst.mesh.getObjectByName('muzzleflash'), '');
      t.assert('tracer appears on the edge', !!inst.mesh.getObjectByName('tracer'), '');
      for (let i = 0; i < 30; i++) inst.update(0.1, fakeEntity({ type: 'ranged', attackCooldown: 0 }));
      t.assert('flash expires', !inst.mesh.getObjectByName('muzzleflash'), '');
      t.assert('tracer expires', !inst.mesh.getObjectByName('tracer'), '');
      inst.dispose();
    },
  },
  {
    name: 'cannon recoils, flashes and smokes on the attack edge, then recovers',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'siege' }), RENAISSANCE_ROLES.siege, tpl);
      const cannon = inst.mesh.getObjectByName('cannon');
      const restX = cannon.position.x;
      inst.update(0.016, fakeEntity({ type: 'siege', attackCooldown: 0 }));
      inst.update(0.016, fakeEntity({ type: 'siege', attackCooldown: 2.5 }));
      // recoil runs mesh-backward: the PI turn maps prop-local +X to
      // mesh-local -X, away from the forward-pointing muzzle.
      t.assert('cannon kicks back on the edge', cannon.position.x > restX + 0.05, cannon.position.x.toFixed(2));
      t.assert('cannon flash appears', !!inst.mesh.getObjectByName('cannonflash'), '');
      t.assert('cannon smoke appears', !!inst.mesh.getObjectByName('cannonsmoke'), '');
      for (let i = 0; i < 40; i++) inst.update(0.1, fakeEntity({ type: 'siege', attackCooldown: 0 }));
      t.assert('cannon recovers', Math.abs(cannon.position.x - restX) < 0.05, cannon.position.x.toFixed(2));
      t.assert('cannon flash expires', !inst.mesh.getObjectByName('cannonflash'), '');
      inst.dispose();
    },
  },
  {
    name: 'cannoneer crew stands beside the cannon, lute hidden',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'siege' }), RENAISSANCE_ROLES.siege, tpl);
      const cannon = inst.mesh.getObjectByName('cannon');
      t.assert('cannon mount present', !!cannon, '');
      const dz = Math.abs(cannon.position.z);
      t.assert('cannon offset to the side of the crew', dz > 0.5 && dz < 2.5, dz.toFixed(2));
      const ch = new THREE.Box3().setFromObject(cannon);
      t.assert('cannon stays authored size', Math.abs((ch.max.y - ch.min.y) - 1.13) < 0.25, (ch.max.y - ch.min.y).toFixed(2));
      let luteVisible = false;
      inst.mesh.traverse((o) => { if (o.name === 'Weapon_Lute' && o.visible) luteVisible = true; });
      t.assert('lute hidden', !luteVisible, '');
      inst.dispose();
    },
  },
  {
    name: 'modern templates parse with walk, attack and death clips',
    async run(t) {
      const tpl = await loadTemplates();
      for (const role of ['meleeinf', 'infantry', 'commander']) {
        t.assert(`${role} template loaded`, !!tpl[role] && tpl[role].clips.size > 0, `${tpl[role]?.clips.size} clips`);
        t.assert(`${role} has Walk`, tpl[role].clips.has('Walk'), '');
        t.assert(`${role} has Death`, tpl[role].clips.has('Death'), '');
      }
      t.assert('infantry holds an aimed shot', tpl.infantry.clips.has('Idle_Shoot'), '');
      t.assert('tank drive template loaded', !!tpl.tank && tpl.tank.clips.has('Tank_Forward'), '');
      t.assert('AK prop template loaded', !!tpl.akProp && !!tpl.akProp.object, '');
    },
  },
  {
    name: 'modern instances scale to procedural heights',
    async run(t) {
      const tpl = await loadTemplates();
      // procedural rig.height targets: meleeinf 2.15, infantry 2.15, commander-hero 2.3*1.18, tank 2.4
      const targets = { meleeinf: 2.15, infantry: 2.15, commander: 2.3 * 1.18, tank: 2.4 };
      for (const [role, want] of Object.entries(targets)) {
        const got = tpl[role].height;
        t.assert(`${role} height ~${want}m`, Math.abs(got - want) / want < 0.05, `${got.toFixed(2)}m`);
      }
    },
  },
  {
    name: 'UnitMesh delegates modern age to the cast once loaded',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const q = UnitMesh(fakeEntity(), 3);
      t.assert('quat modern mesh', q.currentClip === 'Idle', q.currentClip);
      q.dispose();
      t.assert('melee maps to meleeinf', quatRoleFor(fakeEntity({ type: 'melee' }), 3) === MODERN_ROLES.melee, '');
      t.assert('ranged maps to infantry', quatRoleFor(fakeEntity({ type: 'ranged' }), 3) === MODERN_ROLES.ranged, '');
      t.assert('armored maps to tank', quatRoleFor(fakeEntity({ type: 'armored' }), 3) === MODERN_ROLES.armored, '');
      t.assert('hero maps to commander', quatRoleFor(fakeEntity({ isHero: true }), 3) === MODERN_ROLES.hero, '');
      t.assert('renaissance mapping unchanged', quatRoleFor(fakeEntity({ type: 'melee' }), 2) === RENAISSANCE_ROLES.melee, '');
      setQuatTemplates(null);
    },
  },
  {
    name: 'modern infantry shoulders the AK',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'ranged' }), MODERN_ROLES.ranged, tpl);
      const hand = inst.mesh.getObjectByName('Middle1R');
      t.assert('AK hangs off the firing hand', !!hand && !!hand.getObjectByName('ak'), '');
      inst.dispose();
    },
  },
  {
    name: 'tank is a vehicle, not a fighter',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'armored' }), MODERN_ROLES.armored, tpl);
      t.assert('tank rolls on Tank_Forward', inst.currentClip === 'Tank_Forward', inst.currentClip);
      inst.dispose();
    },
  },
  {
    name: 'modern melee carries a blade, not a rifle',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'melee' }), MODERN_ROLES.melee, tpl);
      // shooter rigs have no Fist bones (LowerArmR runs straight into the
      // fingers); the sword hangs off the finger base like the infantry AK.
      const hand = inst.mesh.getObjectByName('Middle1R');
      t.assert('sword hangs off the sword hand', !!hand && !!hand.getObjectByName('sword'), '');
      t.assert('no AK on the melee fighter', !inst.mesh.getObjectByName('ak'), '');
      inst.dispose();
    },
  },
  {
    name: 'tank gun runs along the facing axis',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ type: 'armored' }), MODERN_ROLES.armored, tpl);
      inst.mesh.updateMatrixWorld(true);
      let gun = null, best = 0;
      inst.mesh.traverse((o) => {
        if (!o.isMesh) return;
        const b = new THREE.Box3().setFromObject(o);
        const x = b.max.x - b.min.x, z = b.max.z - b.min.z;
        if (x > best) { best = x; gun = { x, z }; }
      });
      t.assert('gun part found', !!gun, '');
      t.assert('gun long axis is mesh +X, not sideways +Z', gun.x > gun.z * 2, `${gun.x.toFixed(1)}x${gun.z.toFixed(1)}`);
      inst.dispose();
    },
  },
  {
    name: 'commander reads as command: cap, baton, gold trim',
    async run(t) {
      const tpl = await loadTemplates();
      const inst = QuatUnitMesh(fakeEntity({ isHero: true }), MODERN_ROLES.hero, tpl);
      t.assert('peaked cap on the head', !!inst.mesh.getObjectByName('cap'), '');
      t.assert('baton in the fist', !!inst.mesh.getObjectByName('baton'), '');
      t.assert('gold collar trim', !!inst.mesh.getObjectByName('collartrim'), '');
      inst.dispose();
    },
  },
  {
    name: 'future templates parse with walk, attack and death clips',
    async run(t) {
      const tpl = await loadTemplates();
      for (const [role, walk, attack, death] of [
        ['warmachine', 'Walk', 'Punch', 'Death'],
        ['supersoldier', 'Walk', 'SwordSlash', 'Death'],
        ['titan', 'Walk', 'Shoot', 'Death'],
        ['godsblade', 'Robot_Walking', 'Robot_Punch', 'Robot_Death'],
        ['blaster', 'Alien_Walk', 'Alien_Punch', 'Alien_Death'],
      ]) {
        for (const clip of [walk, attack, death]) {
          t.assert(`${role} has ${clip}`, tpl[role].clips.has(clip), [...tpl[role].clips.keys()].join(','));
        }
      }
      t.assert('robot has a right hand bone', !!tpl.godsblade.object.getObjectByName('HandR'), '');
      t.assert('alien has a right palm bone', !!tpl.blaster.object.getObjectByName('PalmR'), '');
    },
  },
  {
    name: 'future instances scale to procedural heights',
    async run(t) {
      const tpl = await loadTemplates();
      // procedural rig.height targets: godsblade 2.3, blaster 2.15,
      // warmachine 2.6, supersoldier 2.8, titan-hero 3.0*1.18
      const targets = { godsblade: 2.3, blaster: 2.15, warmachine: 2.6, supersoldier: 2.8, titan: 3.0 * 1.18 };
      for (const [role, want] of Object.entries(targets)) {
        const got = tpl[role].height;
        t.assert(`${role} height ~${want}m`, Math.abs(got - want) / want < 0.05, `${got.toFixed(2)}m`);
      }
    },
  },
  {
    name: 'UnitMesh delegates future age to the cast once loaded',
    async run(t) {
      const tpl = await loadTemplates();
      setQuatTemplates(tpl);
      const q = UnitMesh(fakeEntity(), 4);
      t.assert('quat future mesh', q.currentClip === 'Robot_Idle', q.currentClip);
      q.dispose();
      t.assert('melee maps to godsblade', quatRoleFor(fakeEntity({ type: 'melee' }), 4) === FUTURE_ROLES.melee, '');
      t.assert('ranged maps to blaster', quatRoleFor(fakeEntity({ type: 'ranged' }), 4) === FUTURE_ROLES.ranged, '');
      t.assert('armored maps to warmachine', quatRoleFor(fakeEntity({ type: 'armored' }), 4) === FUTURE_ROLES.armored, '');
      t.assert('elite maps to supersoldier', quatRoleFor(fakeEntity({ type: 'elite' }), 4) === FUTURE_ROLES.elite, '');
      t.assert('hero maps to titan', quatRoleFor(fakeEntity({ isHero: true }), 4) === FUTURE_ROLES.hero, '');
      t.assert('modern mapping unchanged', quatRoleFor(fakeEntity({ type: 'melee' }), 3) === MODERN_ROLES.melee, '');
      setQuatTemplates(null);
    },
  },
  {
    name: 'godsblade carries an energy blade, blaster a gun',
    async run(t) {
      const tpl = await loadTemplates();
      const blade = QuatUnitMesh(fakeEntity({ type: 'melee' }), FUTURE_ROLES.melee, tpl);
      const hand = blade.mesh.getObjectByName('HandR');
      t.assert('blade hangs off the right hand', !!hand && !!hand.getObjectByName('energyblade'), '');
      blade.dispose();
      const gun = QuatUnitMesh(fakeEntity({ type: 'ranged' }), FUTURE_ROLES.ranged, tpl);
      const palm = gun.mesh.getObjectByName('PalmR');
      t.assert('gun sits in the right palm', !!palm && !!palm.getObjectByName('blastergun'), '');
      gun.dispose();
    },
  },
  {
    name: 'blaster gun barrel runs along the fingers',
    async run(t) {
      const tpl = await loadTemplates();
      const gun = QuatUnitMesh(fakeEntity({ type: 'ranged' }), FUTURE_ROLES.ranged, tpl);
      gun.mesh.updateMatrixWorld(true);
      const prop = gun.mesh.getObjectByName('blastergun');
      t.assert('gun prop present', !!prop, '');
      // barrel is built along prop-local +Z; it should track the finger chain.
      const e = prop.matrixWorld.elements;
      const barrel = new THREE.Vector3(e[8], e[9], e[10]).normalize();
      const palm = gun.mesh.getObjectByName('PalmR');
      let tip = palm;
      for (let i = 0; i < 6; i++) {
        const kids = tip.children.filter((c) => c.isBone);
        if (!kids.length) break;
        tip = kids.sort((a, b) => a.name.localeCompare(b.name))[0];
      }
      const bp = new THREE.Vector3().setFromMatrixPosition(palm.matrixWorld);
      const tp = new THREE.Vector3().setFromMatrixPosition(tip.matrixWorld);
      const fingers = tp.sub(bp).normalize();
      const deg = (barrel.angleTo(fingers) * 180) / Math.PI;
      t.assert('barrel tracks fingers', deg < 35, `${deg.toFixed(1)}deg`);
      gun.dispose();
    },
  },
  {
    name: 'hand props stay body-scale (no x100 blowup)',
    async run(t) {
      const tpl = await loadTemplates();
      const cases = [
        ['clubman', QUAT_ROLES.melee, { type: 'melee' }],
        ['slinger', QUAT_ROLES.ranged, { type: 'ranged' }],
        ['shaman', QUAT_ROLES.hero, { isHero: true }],
        ['archer', CASTLE_ROLES.ranged, { type: 'ranged' }],
        ['godsblade', FUTURE_ROLES.melee, { type: 'melee' }],
        ['blaster', FUTURE_ROLES.ranged, { type: 'ranged' }],
        ['titan', FUTURE_ROLES.hero, { isHero: true }],
      ];
      for (const [label, role, over] of cases) {
        const inst = QuatUnitMesh(fakeEntity(over), role, tpl);
        inst.mesh.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(inst.mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const cap = tpl[role].height * 1.5 + 0.5;
        t.assert(`${label} fits in its height`, maxDim < cap, `${maxDim.toFixed(2)}m vs cap ${cap.toFixed(2)}m`);
        inst.dispose();
      }
    },
  },
  {
    name: 'supersoldier reads golden',
    async run(t) {
      const tpl = await loadTemplates();
      const cols = [];
      tpl.supersoldier.object.traverse((o) => {
        if (o.isMesh) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) if (m.color) cols.push(m.color);
        }
      });
      t.assert('super has tinted materials', cols.length > 0, '');
      for (const c of cols) t.assert('warm gold tint', c.r > c.b, `${c.r.toFixed(2)}/${c.b.toFixed(2)}`);
    },
  },
  {
    name: 'tintGold pulls colors toward gold',
    async run(t) {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.5, 0.5) });
      const group = new THREE.Group();
      group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
      tintGold(group);
      const want = new THREE.Color(0.5, 0.5, 0.5).lerp(new THREE.Color(0xc9a227), 0.55);
      t.assert('lerped toward gold', mat.color.equals(want), mat.color.getHexString());
    },
  },
  {
    name: 'future night readability prep',
    async run(t) {
      const tpl = await loadTemplates();
      const matByName = (root, name) => {
        let found = null;
        root.traverse((o) => {
          if (o.isMesh) {
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of ms) if (m.name === name) found = m;
          }
        });
        return found;
      };
      const lum = (c) => { const l = new THREE.Color(c).getHSL({ h: 0, s: 0, l: 0 }); return l.l; };
      // NOTE: getHSL measures linear-space lightness, so floors look small:
      // raw alien Main reads ~0.026, raw Stan Main ~0.12 on this scale.
      const alienMain = matByName(tpl.blaster.object, 'Main');
      t.assert('alien main lifted out of silhouette', lum(alienMain.color.getHex()) > 0.06, alienMain.color.getHexString());
      const alienEyes = matByName(tpl.blaster.object, 'Eyes');
      t.assert('alien eyes glow', alienEyes.emissive && alienEyes.emissive.getHex() !== 0, alienEyes.emissive?.getHexString());
      const mechEye = matByName(tpl.warmachine.object, 'Eye');
      t.assert('mech visor glows', mechEye.emissive && mechEye.emissive.getHex() !== 0, mechEye.emissive?.getHexString());
      const mechMain = matByName(tpl.warmachine.object, 'Main');
      t.assert('mech panels lifted', lum(mechMain.color.getHex()) > 0.18, mechMain.color.getHexString());
    },
  },
  {
    name: 'nightPrep lifts panels and glows eyes',
    async run(t) {
      const main = new THREE.MeshStandardMaterial({ color: 0x404040 });
      main.name = 'Main';
      const black = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      black.name = 'Black';
      const eyes = new THREE.MeshStandardMaterial({ color: 0x060606 });
      eyes.name = 'Eyes';
      const group = new THREE.Group();
      for (const m of [main, black, eyes]) group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
      const lum = (c) => new THREE.Color(c).getHSL({ h: 0, s: 0, l: 0 }).l;
      const before = lum(main.color.getHex());
      nightPrep(group, 2, 0x35f0e0);
      t.assert('panels lift', lum(main.color.getHex()) > before, main.color.getHexString());
      t.assert('black stays dark', lum(black.color.getHex()) < 0.2, black.color.getHexString());
      t.assert('eyes glow', eyes.emissive.getHex() === 0x35f0e0, eyes.emissive.getHexString());
    },
  },
  {
    name: 'castle night readability prep',
    async run(t) {
      const tpl = await loadTemplates();
      const lum = (c) => { const l = new THREE.Color(c).getHSL({ h: 0, s: 0, l: 0 }); return l.l; };
      // NOTE: linear-space lightness again: raw Skin reads ~0.012 here.
      // Materials are pooled across the knight + horse scenes, so search both.
      const pool = new Map();
      for (const root of [tpl.swordsman.object, tpl.knight.object]) {
        root.traverse((o) => {
          if (o.isMesh) {
            const ms = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of ms) if (m.name && !pool.has(m.name)) pool.set(m.name, m);
          }
        });
      }
      for (const name of ['Skin', 'Armor_Dark', 'Material.006']) {
        t.assert(`${name} present`, pool.has(name), [...pool.keys()].join(','));
      }
      t.assert('knight skin lifted out of silhouette', lum(pool.get('Skin').color.getHex()) > 0.04, pool.get('Skin').color.getHexString());
      t.assert('knight armor lifted', lum(pool.get('Armor_Dark').color.getHex()) > 0.05, pool.get('Armor_Dark').color.getHexString());
      t.assert('dark trim lifted', lum(pool.get('Material.006').color.getHex()) > 0.02, pool.get('Material.006').color.getHexString());
    },
  },
];
