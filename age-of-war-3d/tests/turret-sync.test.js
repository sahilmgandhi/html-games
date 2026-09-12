import { TurretMesh } from '../src/turrets/turrets.js';

function fakeTurret(over = {}) {
  return {
    x: 140, z: 0, side: 'player', turretIndex: 0, slotIndex: 0,
    hp: 150, maxHp: 150, alive: true, hitFlash: 0, ...over,
  };
}

// Regression: the hybrid-turret change made TurretMesh async, so the sync
// callers (battle-view syncMap, gallery, turrets showcase) received a
// Promise and crashed with "tm.update is not a function". The contract is
// sync: a usable handle on return, env-model upgrade lands in background.
export default [
  {
    name: 'TurretMesh returns a usable handle synchronously (no await)',
    run(t) {
      const tm = TurretMesh(fakeTurret(), 0);
      t.assert('handle, not a promise', typeof tm?.update === 'function', String(tm?.constructor?.name || tm));
      t.assert('mesh is an Object3D', !!tm?.mesh?.isObject3D, String(tm?.mesh));
      t.assert('aimAt present', typeof tm?.aimAt === 'function', typeof tm?.aimAt);
      t.assert('fire present', typeof tm?.fire === 'function', typeof tm?.fire);
      tm.update(0.016);
      tm.aimAt(1, 1.4, 0);
      tm.fire();
      tm.update(0.016);
      t.assert('survives update/aim/fire cycle', tm.mesh.visible !== undefined, 'no mesh');
      tm.dispose();
    },
  },
];
