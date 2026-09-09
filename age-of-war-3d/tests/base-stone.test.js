import { BaseMesh } from '../src/bases/bases.js';

const BONE = '#e8dcc0';

// The skull totems (dark pole + white skull) read as an egg on a stick at
// gameplay distance, so they go. The menhir core, palisade and trophy
// crossbeam stay.
function stoneReport() {
  const base = BaseMesh('player', 0);
  let skullBalls = 0;
  let boneCones = 0;
  let tallCore = 0;
  let palisadeLogs = 0;
  base.mesh.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    const hex = `#${o.material.color.getHexString()}`;
    const geo = o.geometry ? o.geometry.type : '';
    if (hex === BONE && geo === 'SphereGeometry') skullBalls++;
    if (hex === BONE && geo === 'ConeGeometry') boneCones++;
    if (geo === 'CylinderGeometry' && o.geometry.parameters &&
        o.geometry.parameters.height > 6) tallCore++;
    if (geo === 'CylinderGeometry' && o.geometry.parameters &&
        o.geometry.parameters.height > 2 &&
        o.geometry.parameters.height < 5) palisadeLogs++;
  });
  base.dispose();
  return { skullBalls, boneCones, tallCore, palisadeLogs };
}

export default [
  {
    name: 'stone hold keeps its core structures without skull totems',
    run(t) {
      const r = stoneReport();
      t.assert('no skull balls (egg-on-pole read)', r.skullBalls === 0, `found=${r.skullBalls}`);
      t.assert('trophy tusks stay', r.boneCones >= 3, `found=${r.boneCones}`);
      t.assert('menhir core stays', r.tallCore >= 1, `found=${r.tallCore}`);
      t.assert('palisade stays', r.palisadeLogs >= 5, `found=${r.palisadeLogs}`);
    },
  },
];
