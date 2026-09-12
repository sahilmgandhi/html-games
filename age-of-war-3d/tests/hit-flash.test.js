import * as THREE from 'three';
import { UnitMesh } from '../src/units/units.js';
import { TurretMesh } from '../src/turrets/turrets.js';
import { FLASH_PEAK } from '../src/core/pbr.js';

// Hit flash must decay across its 0.1s window, not sit at peak. A binary
// full-window flash blows whole meshes to white in night-still frames
// (track-castle / track-future sheets: full-white horse, white mechs).
function flashLevels(root) {
  const out = [];
  root.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      if (m && 'emissive' in m && 'emissiveIntensity' in m) out.push(m.emissiveIntensity);
    }
  });
  return out;
}

function fakeUnit(over = {}) {
  return {
    side: 'player', type: 'melee', isHero: false,
    hp: 100, maxHp: 100, hitFlash: 0, dying: false, alive: true,
    deathTimer: 0, walkPhase: 0, attackSpeed: 1, attackCooldown: 0,
    x: 0, z: 0, ...over,
  };
}

export default [
  {
    name: 'procedural flash peaks at onset',
    async run(t) {
      const e = fakeUnit({ hitFlash: 0.1 });
      const um = await TurretMesh(e, 0);
      um.update(0.016, e);
      const lv = flashLevels(um.mesh);
      t.assert('mats found', lv.length > 0, JSON.stringify(lv.length));
      t.assert('peak at onset', lv.every((v) => v === FLASH_PEAK), JSON.stringify(lv.slice(0, 4)));
      um.dispose();
    },
  },
  {
    name: 'procedural flash decays before the window ends',
    async run(t) {
      const e = fakeUnit({ hitFlash: 0.02 });
      const um = await TurretMesh(e, 0);
      um.update(0.016, e);
      const lv = flashLevels(um.mesh);
      t.assert('still flashing', lv.every((v) => v > 0), JSON.stringify(lv.slice(0, 4)));
      t.assert('decayed below peak', lv.every((v) => v < FLASH_PEAK), JSON.stringify(lv.slice(0, 4)));
      um.dispose();
    },
  },
  {
    name: 'procedural flash clears when the window ends',
    async run(t) {
      const e = fakeUnit({ hitFlash: 0.1 });
      const um = await TurretMesh(e, 0);
      um.update(0.016, e);
      e.hitFlash = 0;
      um.update(0.016, e);
      const lv = flashLevels(um.mesh);
      t.assert('back to rest intensity', lv.every((v) => v === 1), JSON.stringify(lv.slice(0, 4)));
      um.dispose();
    },
  },
  {
    name: 'turret flash decays before the window ends',
    async run(t) {
      const tur = { side: 'player', turretIndex: 0, x: 0, z: 0, hp: 100, maxHp: 100, alive: true, hitFlash: 0.02 };
      const tm = await TurretMesh(tur, 0);
      tm.update(0.016);
      const lv = flashLevels(tm.mesh);
      t.assert('mats found', lv.length > 0, JSON.stringify(lv.length));
      t.assert('decayed below peak', lv.every((v) => v < FLASH_PEAK), JSON.stringify(lv.slice(0, 4)));
      tm.dispose();
    },
  },
];
