import { BaseMesh } from '../src/bases/bases.js';
import * as THREE from 'three';

const BONE = new THREE.Color('#e8dcc0');
const WOODS = [new THREE.Color('#8a5f36'), new THREE.Color('#654522')];

function close(a, b, eps = 0.16) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < eps;
}

// The skull totems (dark pole + white skull) read as an egg on a stick at
// gameplay distance, so they go. The menhir core, palisade and trophy
// crossbeam stay. Static shells merge (mergeStatic), so this asserts
// material presence by triangle count, not part count.
function stoneReport() {
  const base = BaseMesh('player', 0);
  let skullBalls = 0;
  let boneTris = 0;
  let woodTris = 0;
  let tallCore = 0;
  base.mesh.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    const geo = o.geometry ? o.geometry.type : '';
    // Merged shells carry white materials with color baked per-vertex
    // (plus mottle jitter), so classify per-triangle, not per-material.
    const colAttr = o.geometry?.attributes?.color;
    const idx = o.geometry?.index;
    const triCount = (idx?.count ?? o.geometry?.attributes?.position?.count ?? 0) / 3;
    const c = new THREE.Color();
    for (let ti = 0; ti < triCount; ti++) {
      c.setRGB(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
        if (colAttr) c.r += colAttr.getX(vi), c.g += colAttr.getY(vi), c.b += colAttr.getZ(vi);
        else c.r += o.material.color.r, c.g += o.material.color.g, c.b += o.material.color.b;
      }
      c.multiplyScalar(1 / 3);
      if (close(c, BONE)) {
        boneTris++;
        if (geo === 'SphereGeometry') skullBalls++;
      }
      if (WOODS.some((w) => close(c, w))) woodTris++;
    }
    if (geo === 'CylinderGeometry' && o.geometry.parameters &&
        o.geometry.parameters.height > 6) tallCore++;
  });
  base.dispose();
  return { skullBalls, boneTris, woodTris, tallCore };
}

export default [
  {
    name: 'stone hold keeps its core structures without skull totems',
    run(t) {
      const r = stoneReport();
      t.assert('no skull balls (egg-on-pole read)', r.skullBalls === 0, `found=${r.skullBalls}`);
      t.assert('trophy tusks stay', r.boneTris >= 50, `boneTris=${Math.round(r.boneTris)}`);
      t.assert('menhir core stays', r.tallCore >= 1, `found=${r.tallCore}`);
      t.assert('palisade stays', r.woodTris >= 400, `woodTris=${Math.round(r.woodTris)}`);
    },
  },
];
