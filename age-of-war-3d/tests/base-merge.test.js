import { BaseMesh } from '../src/bases/bases.js';

// Base shells merge static parts (mergeStatic): damage overlays must still
// toggle by HP, cloth must still ripple, and the part count stays capped.
function meshCount(root) {
  let n = 0;
  root.traverse((o) => { if (o.isMesh) n++; });
  return n;
}
function hiddenSubtreeMeshes(root) {
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (let p = o.parent; p; p = p.parent) {
      if (!p.visible) { n++; break; }
    }
  });
  return n;
}
function clothChecksum(base) {
  let flag = null;
  base.mesh.traverse((o) => {
    if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && o.material?.side === 2) flag = o;
  });
  if (!flag) return null;
  const a = flag.geometry.attributes.position.array;
  let s = 0;
  for (let j = 0; j < a.length; j += 3) s += a[j + 2];
  return s.toFixed(5);
}

export default [0, 1, 2, 3, 4].map((age) => ({
  name: `age ${age} base keeps damage states and cloth after merge`,
  run(t) {
    const base = BaseMesh('player', age);
    const n = meshCount(base.mesh);
    t.assert(`part count under cap (${n})`, n <= 48, `meshes=${n}`);
    base.setHp(1);
    const hiddenFull = hiddenSubtreeMeshes(base.mesh);
    base.setHp(0.2);
    base.update(0.016);
    const hiddenLow = hiddenSubtreeMeshes(base.mesh);
    t.assert('damage overlays hidden at full hp', hiddenFull > 0, `hidden=${hiddenFull}`);
    t.assert('damage overlays reveal at low hp', hiddenLow < hiddenFull, `${hiddenFull}->${hiddenLow}`);
    const before = clothChecksum(base);
    base.update(0.05);
    base.update(0.05);
    t.assert('cloth still ripples', before !== null && clothChecksum(base) !== before,
      `${before} vs ${clothChecksum(base)}`);
    base.dispose();
  },
}));
