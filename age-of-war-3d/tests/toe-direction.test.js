import * as THREE from 'three';
import { QuatUnitMesh } from '../src/units/gltf-cast.js';
import {
  fakeEntity, footBones, loadTemplates, selectSoleVerts, soleVertWorld,
} from './mount-walk.test.js';

// Mount feet must point where the mount walks. The anatomical toe set is
// tagged at rest (front third by x); if its mean ever falls behind the heel
// set mean mid-stride, the foot reads backwards.
export default [
  {
    name: 'anatomical toes stay ahead of heels through the stride',
    async run(t) {
      const tpl = await loadTemplates();
      for (const [role, speed, skipFront, type] of [
        ['dino', 1.8, true, 'fast'],
        ['knight', 1.4, false, 'fast'],
        ['clubman', 0.8, false, 'melee'],
      ]) {
        const e = fakeEntity({ speed, type });
        const inst = QuatUnitMesh(e, role, tpl);
        for (const foot of footBones(inst, skipFront)) {
          const entry = selectSoleVerts(inst, foot);
          if (!entry || !entry.idx.length) {
            t.assert(`${role} ${foot.name} has sole verts`, false, 'no sole');
            continue;
          }
          const v = new THREE.Vector3();
          const restX = entry.idx.map((i) => {
            inst.mesh.updateMatrixWorld(true);
            soleVertWorld(entry, i, v);
            return { i, x: v.x - inst.mesh.position.x };
          });
          restX.sort((a, b) => b.x - a.x);
          const toe = restX.slice(0, Math.max(2, Math.floor(restX.length / 3))).map((r) => r.i);
          const heel = restX.slice(-Math.max(2, Math.floor(restX.length / 3))).map((r) => r.i);
          const spread = restX[0].x - restX[restX.length - 1].x;
          const ee = fakeEntity({ speed, type });
          const dt = 1 / 60;
          let worst = Infinity;
          for (let f = 0; f < 300; f++) {
            ee.x += ee.speed * dt * 60;
            ee.walkPhase += dt * ee.speed * 4;
            inst.update(dt, ee);
            inst.mesh.updateMatrixWorld(true);
            let tx = 0;
            for (const i of toe) { soleVertWorld(entry, i, v); tx += v.x; }
            let hx = 0;
            for (const i of heel) { soleVertWorld(entry, i, v); hx += v.x; }
            const lead = tx / toe.length - hx / heel.length;
            if (lead < worst) worst = lead;
          }
          t.assert(`${role} ${foot.name} keeps toes ahead`,
            worst > -0.05 * Math.max(spread, 0.05),
            `worst lead ${(worst).toFixed(3)}m (foot ${(spread).toFixed(2)}m)`);
        }
        inst.dispose();
      }
    },
  },
];
