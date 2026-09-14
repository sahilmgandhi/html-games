import * as THREE from 'three';
import { UnitMesh } from '../src/units/units.js';
import { TowerMesh } from '../src/turrets/tower.js';
import { BaseMesh } from '../src/bases/bases.js';
import { TurretMesh } from '../src/turrets/turrets.js';
import { SIDE_ACCENT } from '../src/core/pbr.js';

function fakeUnit(over = {}) {
  return {
    x: 500, z: 0, side: 'player', type: 'melee', ageIndex: 0,
    hp: 55, maxHp: 55, damage: 16, speed: 0.8, range: 28,
    attackSpeed: 1, attackCooldown: 0, alive: true, dying: false,
    walkPhase: 0, hitFlash: 0, isHero: false, ...over,
  };
}

function fakeTurret(over = {}) {
  return {
    x: 140, z: 0, side: 'player', turretIndex: 0, slotIndex: 0,
    hp: 150, maxHp: 150, alive: true, hitFlash: 0, ...over,
  };
}

function ringCount(root) {
  let n = 0;
  root.traverse((o) => { if (o.isMesh && o.geometry?.type === 'RingGeometry') n++; });
  return n;
}

// Merged shells bake part colors into vertices: scan triangles for a hex.
function hasColor(root, hex, tol = 0.3) {
  const want = new THREE.Color(hex);
  let found = false;
  const c = new THREE.Color();
  root.traverse((o) => {
    if (found || !o.isMesh) return;
    const col = o.geometry?.attributes?.color;
    const idx = o.geometry?.index;
    const tris = (idx?.count ?? o.geometry?.attributes?.position?.count ?? 0) / 3;
    for (let ti = 0; ti < tris && !found; ti++) {
      c.setRGB(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
        if (col) { c.r += col.getX(vi); c.g += col.getY(vi); c.b += col.getZ(vi); }
        else if (o.material?.color) { c.r += o.material.color.r; c.g += o.material.color.g; c.b += o.material.color.b; }
      }
      c.multiplyScalar(1 / 3);
      if (Math.abs(c.r - want.r) + Math.abs(c.g - want.g) + Math.abs(c.b - want.b) < tol) found = true;
    }
  });
  return found;
}

// Player asked for zero ground rings anywhere; team readability stays on
// garments, tower trim, base banners and HP bars.
export default [
  {
    name: 'no ground rings on units, heroes, towers, bases, turrets',
    run(t) {
      const u = UnitMesh(fakeUnit(), 0);
      t.assert('unit ringless', ringCount(u.mesh) === 0, `rings=${ringCount(u.mesh)}`);
      u.dispose();
      const h = UnitMesh(fakeUnit({ isHero: true }), 0);
      t.assert('hero ringless (incl. gold)', ringCount(h.mesh) === 0, `rings=${ringCount(h.mesh)}`);
      h.dispose();
      const tw = TowerMesh('player', 0);
      t.assert('tower ringless', ringCount(tw.mesh) === 0, `rings=${ringCount(tw.mesh)}`);
      tw.dispose();
      const b = BaseMesh('enemy', 1);
      t.assert('base ringless', ringCount(b.mesh) === 0, `rings=${ringCount(b.mesh)}`);
      b.dispose();
      const tm = TurretMesh(fakeTurret(), 0);
      t.assert('turret ringless', ringCount(tm.mesh) === 0, `rings=${ringCount(tm.mesh)}`);
      tm.dispose();
    },
  },
  {
    name: 'team color survives on garments, trim and banners',
    run(t) {
      const u = UnitMesh(fakeUnit(), 0);
      t.assert('unit keeps accent garment', hasColor(u.mesh, SIDE_ACCENT.player), 'no player-blue on unit');
      u.dispose();
      const tw = TowerMesh('player', 0);
      t.assert('tower keeps accent trim', hasColor(tw.mesh, SIDE_ACCENT.player), 'no player-blue on tower');
      let cloth = 0;
      tw.mesh.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry') cloth++; });
      t.assert('tower keeps pennant', cloth > 0, 'no cloth');
      tw.dispose();
      const b = BaseMesh('player', 0);
      let banner = 0;
      b.mesh.traverse((o) => { if (o.isMesh && o.geometry?.type === 'PlaneGeometry') banner++; });
      t.assert('base keeps banner', banner > 0, 'no banner cloth');
      b.dispose();
    },
  },
];
