import * as THREE from 'three';
import { TowerMesh } from '../src/turrets/tower.js';

// The shared outpost tower wears its age's palette, ripples its pennant,
// and merges its static shell: same silhouette, five moods, few calls.
const SKINS = {
  0: '#8d8d94',
  1: '#6e6e76',
  2: '#c8a878',
  3: '#7a7a72',
  4: '#1c2940',
};

// Merged shells carry white materials with baked vertex colors, so scan
// triangles (mottle-tolerant) instead of part materials.
function hasSkin(tower, hex) {
  const want = new THREE.Color(hex);
  let found = false;
  tower.mesh.traverse((o) => {
    if (found || !o.isMesh) return;
    const col = o.geometry?.attributes?.color;
    const idx = o.geometry?.index;
    const tris = (idx?.count ?? o.geometry?.attributes?.position?.count ?? 0) / 3;
    const c = new THREE.Color();
    for (let ti = 0; ti < tris && !found; ti++) {
      c.setRGB(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
        if (col) { c.r += col.getX(vi); c.g += col.getY(vi); c.b += col.getZ(vi); }
        else { c.r += o.material.color.r; c.g += o.material.color.g; c.b += o.material.color.b; }
      }
      c.multiplyScalar(1 / 3);
      if (Math.abs(c.r - want.r) + Math.abs(c.g - want.g) + Math.abs(c.b - want.b) < 0.2) found = true;
    }
  });
  return found;
}
function meshCount(tower) {
  let n = 0;
  tower.mesh.traverse((o) => { if (o.isMesh) n++; });
  return n;
}

export default [
  {
    name: 'tower shaft wears the age palette',
    run(t) {
      for (const [age, want] of Object.entries(SKINS)) {
        const tower = TowerMesh('player', Number(age));
        t.assert(`age ${age} shell wears ${want}`, hasSkin(tower, want), `age=${age}`);
        tower.dispose();
      }
    },
  },
  {
    name: 'pennant ripples and shell stays lean',
    run(t) {
      const tower = TowerMesh('player', 1);
      t.assert('static shell merged', meshCount(tower) <= 14, `meshes=${meshCount(tower)}`);
      let cloth = null;
      tower.mesh.traverse((o) => {
        if (o.isMesh && o.geometry?.type === 'PlaneGeometry') cloth = o;
      });
      t.assert('pennant is cloth, not a flat quad', !!cloth, '');
      const before = cloth.geometry.attributes.position.array.slice();
      tower.update(0.05);
      tower.update(0.05);
      const after = cloth.geometry.attributes.position.array;
      t.assert('pennant ripples', before.some((v, i) => Math.abs(v - after[i]) > 1e-6), '');
      t.assert('four mounts keep anchors', tower.mounts.length === 4, '');
      // Iron cradles seat every mount: scan baked triangles for the mount tone.
      const want = new THREE.Color('#2e2e36');
      let cradleTris = 0;
      tower.mesh.traverse((o) => {
        if (!o.isMesh) return;
        const col = o.geometry?.attributes?.color;
        const idx = o.geometry?.index;
        const tris = (idx?.count ?? o.geometry?.attributes?.position?.count ?? 0) / 3;
        const c = new THREE.Color();
        for (let ti = 0; ti < tris; ti++) {
          c.setRGB(0, 0, 0);
          for (let k = 0; k < 3; k++) {
            const vi = idx ? idx.getX(ti * 3 + k) : ti * 3 + k;
            if (col) { c.r += col.getX(vi); c.g += col.getY(vi); c.b += col.getZ(vi); }
            else { c.r += o.material.color.r; c.g += o.material.color.g; c.b += o.material.color.b; }
          }
          c.multiplyScalar(1 / 3);
          if (Math.abs(c.r - want.r) + Math.abs(c.g - want.g) + Math.abs(c.b - want.b) < 0.2) cradleTris++;
        }
      });
      t.assert('cradles seat the mounts', cradleTris >= 200, `cradleTris=${cradleTris}`);
      tower.dispose();
    },
  },
];
