import * as THREE from 'three';
import { createEnvironment } from '../src/environment/environment.js';

// The modern mid-field must not read as bare dirt: rubble drift (broken
// slabs + rebar) dresses the churn between the lane and the ruins.
export default [
  {
    name: 'modern scatters mid-field rubble',
    run(t) {
      const scene = new THREE.Scene();
      const env = createEnvironment(scene, 3);
      scene.updateMatrixWorld(true);
      let allMeshes = 0;
      let concreteAnywhere = 0;
      env.group.traverse((o) => {
        if (!o.isMesh) return;
        allMeshes++;
        const col = o.geometry?.attributes?.color;
        if (col) concreteAnywhere++;
      });
      const want = new THREE.Color('#7a7a72');
      let rubbleTris = 0;
      const el = (m) => m.matrixWorld.elements;
      env.group.traverse((o) => {
        if (!o.isMesh) return;
        const col = o.geometry?.attributes?.color;
        const pos = o.geometry?.attributes?.position;
        const idx = o.geometry?.index;
        const tris = (idx?.count ?? pos?.count ?? 0) / 3;
        const c = new THREE.Color();
        const e = el(o);
        for (let ti = 0; ti < tris; ti++) {
          c.setRGB(0, 0, 0);
          let cx = 0;
          let cz = 0;
          for (let k = 0; k < 3; k++) {
            const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
            const vx = pos.getX(vi);
            const vy = pos.getY(vi);
            const vz = pos.getZ(vi);
            cx += e[0] * vx + e[4] * vy + e[8] * vz + e[12];
            cz += e[2] * vx + e[6] * vy + e[10] * vz + e[14];
            if (col) { c.r += col.getX(vi); c.g += col.getY(vi); c.b += col.getZ(vi); }
            else { c.r += o.material.color.r; c.g += o.material.color.g; c.b += o.material.color.b; }
          }
          c.multiplyScalar(1 / 3);
          cx /= 3;
          cz /= 3;
          // Mid-field only: the ruin backdrop shares the tone far behind.
          if (Math.abs(cz) < 4 || Math.abs(cz) > 10) continue;
          if (Math.abs(c.r - want.r) + Math.abs(c.g - want.g) + Math.abs(c.b - want.b) < 0.2) rubbleTris++;
        }
      });
      t.assert('rubble dresses the mid-field', rubbleTris >= 300, `rubbleTris=${rubbleTris} meshes=${allMeshes} colored=${concreteAnywhere}`);
      env.dispose();
    },
  },
];
