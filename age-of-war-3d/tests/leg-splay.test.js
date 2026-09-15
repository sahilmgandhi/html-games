import { QuatUnitMesh } from '../src/units/gltf-cast.js';
import { fakeEntity, footBones, loadTemplates, soleTracker } from './mount-walk.test.js';

// Jelly/inverted legs: feet must stride fore-aft (mesh x), not sideways.
// Sole motion is measured relative to the mesh so body travel cancels;
// the existing slip test only watches x and cannot see lateral splay.
export default [
  {
    name: 'marching feet stride forward, not sideways',
    async run(t) {
      const tpl = await loadTemplates();
      const roles = [
        ['clubman', 0.8, false, 'melee'],
        ['slinger', 0.6, false, 'ranged'],
        ['dino', 1.8, true, 'fast'],
        ['knight', 1.4, false, 'fast'],
      ];
      for (const [role, speed, skipFront, type] of roles) {
        const e = fakeEntity({ speed, type });
        const inst = QuatUnitMesh(e, role, tpl);
        for (const foot of footBones(inst, skipFront)) {
          const sole = soleTracker(inst, foot);
          if (!sole || !sole.count) {
            t.assert(`${role} ${foot.name} has skinned sole verts`, false, 'no sole');
            continue;
          }
          const ee = fakeEntity({ speed, type });
          const dt = 1 / 60;
          let ax = 0;
          let az = 0;
          let px = null;
          let pz = null;
          for (let f = 0; f < 300; f++) {
            ee.x += ee.speed * dt * 60;
            ee.walkPhase += dt * ee.speed * 4;
            inst.update(dt, ee);
            const p = sole.sample();
            const rx = p.x - inst.mesh.position.x;
            const rz = p.z - inst.mesh.position.z;
            if (px !== null) {
              ax += Math.abs(rx - px);
              az += Math.abs(rz - pz);
            }
            px = rx;
            pz = rz;
          }
          t.assert(`${role} ${foot.name} strides`, ax > 0.5, `forward ${ax.toFixed(2)}m`);
          t.assert(`${role} ${foot.name} keeps lateral under 30%`,
            az < 0.3 * ax, `lateral ${az.toFixed(2)}m vs forward ${ax.toFixed(2)}m`);
        }
        inst.dispose();
      }
    },
  },
];
