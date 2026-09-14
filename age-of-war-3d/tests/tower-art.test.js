import * as THREE from 'three';
import { TowerMesh } from '../src/turrets/tower.js';
import { SIDE_ACCENT } from '../src/core/pbr.js';

// Shared-tower art pass: the shaft reads as laid masonry with a painted
// heater shield, not an unmodified primitive box/cylinder.
export default [
  {
    name: 'tower wears a painted heater shield and timber bond-beams',
    run(t) {
      const tower = TowerMesh('player', 0);
      let shield = 0;
      let beamTris = 0;
      const wood = new THREE.Color('#4c3018');
      const tri = new THREE.Color();
      tower.mesh.traverse((o) => {
        if (!o.isMesh) return;
        if (o.material?.map && o.geometry?.type === 'CylinderGeometry') shield++;
        // Bond-beams merge into the shell: count wood-dark baked triangles
        // sitting at the two beam courses.
        const col = o.geometry?.attributes?.color;
        const pos = o.geometry?.attributes?.position;
        const idx = o.geometry?.index;
        if (!col || !pos) return;
        const n = (idx?.count ?? pos.count) / 3;
        for (let ti = 0; ti < n; ti++) {
          tri.setRGB(0, 0, 0);
          let y = 0;
          for (let k = 0; k < 3; k++) {
            const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
            tri.r += col.getX(vi); tri.g += col.getY(vi); tri.b += col.getZ(vi);
            y += pos.getY(vi);
          }
          tri.multiplyScalar(1 / 3);
          y /= 3;
          if (Math.abs(tri.r - wood.r) + Math.abs(tri.g - wood.g) + Math.abs(tri.b - wood.b) < 0.35
            && (Math.abs(y - 2.2) < 0.3 || Math.abs(y - 3.1) < 0.3)) beamTris++;
        }
      });
      t.assert('painted shield with device map', shield > 0, `mapped=${shield}`);
      t.assert('timber bond-beams wrap the shaft', beamTris >= 16, `beamTris=${beamTris}`);
      // Accent trim survives the art pass (post-ring readability).
      const want = new THREE.Color(SIDE_ACCENT.player);
      let trim = 0;
      const c = new THREE.Color();
      tower.mesh.traverse((o) => {
        if (!o.isMesh || trim) return;
        const col = o.geometry?.attributes?.color;
        if (!col) return;
        for (let i = 0; i < col.count; i += 7) {
          c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
          if (Math.abs(c.r - want.r) + Math.abs(c.g - want.g) + Math.abs(c.b - want.b) < 0.3) { trim++; break; }
        }
      });
      t.assert('accent trim survives', trim > 0, 'no player-blue trim');
      tower.dispose();
    },
  },
];
