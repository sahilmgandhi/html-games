import { QuatUnitMesh } from '../src/units/gltf-cast.js';
import { fakeEntity, loadTemplates } from './mount-walk.test.js';

// Walk clips play leg-stripped while marching (procedural legs own the
// stride). Every bone the leg solver poses — thigh, shin, foot — must lose
// its authored tracks, or the mixer fights the solver out of phase.
const LEG_RE = /(upleg|upperleg|thigh|lowleg|lowerleg|shin|knee|foot)/i;

export default [
  {
    name: 'stripped walk clips carry no leg tracks',
    async run(t) {
      const tpl = await loadTemplates();
      for (const [role, speed, type] of [
        ['clubman', 0.8, 'melee'],
        ['slinger', 0.6, 'ranged'],
        ['dino', 1.8, 'fast'],
        ['knight', 1.4, 'fast'],
      ]) {
        const e = fakeEntity({ speed, type });
        const inst = QuatUnitMesh(e, role, tpl); // building caches the strip
        const spec = tpl[role].spec;
        const stripped = tpl[role].clips.get(`${spec.walk}_nolegs`);
        t.assert(`${role} has a stripped walk clip`, !!stripped, spec.walk);
        const leftovers = (stripped?.tracks || [])
          .map((tr) => tr.name.split('.')[0])
          .filter((node) => LEG_RE.test(node))
          // Dino front limbs are arms, not legs: the solver skips them on
          // purpose (hindOnly) so authored motion there is correct.
          .filter((node) => !(role === 'dino' && /^front/i.test(node)));
        t.assert(`${role} keeps no leg tracks`,
          leftovers.length === 0, [...new Set(leftovers)].join(','));
        inst.dispose();
      }
    },
  },
];
