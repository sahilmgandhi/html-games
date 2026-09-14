import * as THREE from 'three';
import * as TurretMod from '../src/turrets/turrets.js';
import * as BattleView from '../src/demo-battle/battle-view.js';

const { TurretMesh } = TurretMod;

function fakeTurret(over = {}) {
  return {
    x: 140, z: 0, side: 'player', turretIndex: 0, slotIndex: 0,
    hp: 150, maxHp: 150, alive: true, hitFlash: 0, ...over,
  };
}

// BUG-008: env-path aim assigned rotation.y = world-x meters. Both paths
// must share one yaw helper that points the head at the target.
// BUG-009: muzzle flash was parked at build-time coords; it must ride the
// barrel tip through yaw/recoil.
// BUG-010: sim fires before the mesh syncs; missed visuals must queue and
// flush once the wrapper exists.
export default [
  {
    name: 'shared turretYaw helper aims both paths',
    run(t) {
      t.assert('turretYaw exported', typeof TurretMod.turretYaw === 'function', typeof TurretMod.turretYaw);
      if (typeof TurretMod.turretYaw !== 'function') return;
      const yawEast = TurretMod.turretYaw({ x: 0, z: 0 }, 10, 0, 'player');
      t.assert('player +X aims ~0', Math.abs(yawEast) < 1e-6, String(yawEast));
      const yawWest = TurretMod.turretYaw({ x: 0, z: 0 }, -10, 0, 'player');
      t.assert('player -X aims ~PI', Math.abs(Math.abs(yawWest) - Math.PI) < 1e-6, String(yawWest));
      const yawEnemy = TurretMod.turretYaw({ x: 0, z: 0 }, -10, 0, 'enemy');
      const norm = Math.atan2(Math.sin(yawEnemy), Math.cos(yawEnemy));
      t.assert('enemy mirrors player', Math.abs(norm) < 1e-6, String(yawEnemy));
    },
  },
  {
    name: 'muzzle flash tracks the barrel tip after aim',
    run(t) {
      const tm = TurretMesh(fakeTurret(), 0);
      tm.update(0.016);
      tm.aimAt(1.4, 1.4, 10);
      tm.update(0.016);
      tm.mesh.updateMatrixWorld(true);
      const mp = new THREE.Vector3();
      tm.muzzle.getWorldPosition(mp);
      let sp = null;
      tm.mesh.traverse((o) => { if (!sp && o.isPoints) sp = o; });
      t.assert('spark points exist', !!sp, 'no Points in turret mesh');
      if (!sp) { tm.dispose(); return; }
      const fp = new THREE.Vector3();
      sp.getWorldPosition(fp);
      t.assert('flash rides the muzzle', fp.distanceTo(mp) < 0.6, `gap=${fp.distanceTo(mp).toFixed(2)}m`);
      tm.dispose();
    },
  },
  {
    name: 'missed fire visuals queue and flush on sync',
    run(t) {
      t.assert('createPendingFires exported', typeof BattleView.createPendingFires === 'function', typeof BattleView.createPendingFires);
      if (typeof BattleView.createPendingFires !== 'function') return;
      const pf = BattleView.createPendingFires();
      pf.push({ id: 7 });
      let fired = 0;
      pf.flush(new Map());
      t.assert('unknown id stays pending', pf.size() === 1, `size=${pf.size()}`);
      pf.flush(new Map([[7, { fire: () => { fired++; } }]]));
      t.assert('flush fires once then clears', fired === 1 && pf.size() === 0, `fired=${fired} size=${pf.size()}`);
    },
  },
];
