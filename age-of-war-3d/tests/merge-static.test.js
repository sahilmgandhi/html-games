import * as THREE from 'three';
import { mergeStatic, pbr } from '../src/core/pbr.js';

// Static scenery (treelines, backdrops, bases) costs one draw call per part.
// mergeStatic bakes same-material parts into one mesh: identical pixels,
// a fraction of the calls. Skinned meshes, sprites, points, multi-material
// parts and animated (skipped) subtrees are never touched.
function box(mat, x = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
  m.position.x = x;
  return m;
}
function meshes(root) {
  let n = 0;
  root.traverse((o) => { if (o.isMesh) n++; });
  return n;
}

export default [
  {
    name: 'same-material parts merge into one baked mesh',
    run(t) {
      const root = new THREE.Group();
      const mat = pbr('#ff0000', 0.9);
      root.add(box(mat, 0), box(mat, 5));
      const r = mergeStatic(root);
      t.assert('one mesh left', meshes(root) === 1, `meshes=${meshes(root)}`);
      t.assert('reports merged count', r.merged === 2 && r.kept === 0, JSON.stringify(r));
      const bb = new THREE.Box3().setFromObject(root);
      t.assert('spans both parts', bb.min.x < -0.4 && bb.max.x > 5.4,
        `${bb.min.x.toFixed(2)}..${bb.max.x.toFixed(2)}`);
    },
  },
  {
    name: 'incompatible material classes stay separate',
    run(t) {
      const root = new THREE.Group();
      root.add(box(pbr('#ff0000', 0.9), 0));
      root.add(box(new THREE.MeshBasicMaterial({ color: '#00ff00' }), 5));
      mergeStatic(root);
      t.assert('two meshes left', meshes(root) === 2, `meshes=${meshes(root)}`);
    },
  },
  {
    name: 'skinned meshes, sprites and points are untouched',
    run(t) {
      const root = new THREE.Group();
      const mat = pbr('#ff0000', 0.9);
      root.add(box(mat, 0), box(mat, 3));
      const sk = new THREE.SkinnedMesh(new THREE.BoxGeometry(1, 1, 1), mat);
      root.add(sk);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial());
      root.add(sp);
      const pt = new THREE.Points(new THREE.BufferGeometry(),
        new THREE.PointsMaterial());
      root.add(pt);
      const r = mergeStatic(root);
      t.assert('skinned kept', root.children.includes(sk), '');
      t.assert('sprite kept', root.children.includes(sp), '');
      t.assert('points kept', root.children.includes(pt), '');
      t.assert('only plain boxes merged', r.merged === 2, JSON.stringify(r));
    },
  },
  {
    name: 'skipped animated subtrees are untouched',
    run(t) {
      const root = new THREE.Group();
      const mat = pbr('#ff0000', 0.9);
      const bird = new THREE.Group();
      const wing = box(mat, 9);
      bird.add(wing);
      root.add(bird, box(mat, 0));
      const r = mergeStatic(root, new Set([bird]));
      t.assert('wing kept under bird', bird.children.includes(wing), '');
      t.assert('lone static box kept as-is', r.merged === 0 && r.kept === 1, JSON.stringify(r));
    },
  },
  {
    name: 'mismatched attributes never merge and never throw',
    run(t) {
      const root = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: '#888888', vertexColors: true });
      const plain = box(pbr('#ff0000', 0.9), 0);
      const tinted = box(mat, 5);
      const col = new Float32Array(24 * 3).fill(1);
      tinted.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
      root.add(plain, tinted);
      let threw = null;
      try {
        mergeStatic(root);
      } catch (e) { threw = e; }
      t.assert('no throw', threw === null, String(threw && threw.message));
      t.assert('stays two meshes', meshes(root) === 2, `meshes=${meshes(root)}`);
    },
  },
  {
    name: 'same flags with different colors bake into one vertex-colored mesh',
    run(t) {
      const root = new THREE.Group();
      root.add(box(pbr('#ff0000', 0.9), 0), box(pbr('#00ff00', 0.9), 5));
      const r = mergeStatic(root);
      t.assert('one mesh left', meshes(root) === 1, `meshes=${meshes(root)}`);
      t.assert('reports merged count', r.merged === 2, JSON.stringify(r));
      let merged = null;
      root.traverse((o) => { if (o.isMesh) merged = o; });
      t.assert('vertex colors on', merged.material.vertexColors === true, '');
      const bb = new THREE.Box3().setFromObject(root);
      const pos = merged.geometry.attributes.position;
      const col = merged.geometry.attributes.color;
      t.assert('color attr baked', !!col && col.count === pos.count, '');
      let red = 0;
      let green = 0;
      for (let i = 0; i < col.count; i++) {
        if (col.getX(i) > 0.9 && col.getY(i) < 0.1) red++;
        if (col.getY(i) > 0.9 && col.getX(i) < 0.1) green++;
      }
      t.assert('red part stays red', red > 10, `red=${red}`);
      t.assert('green part stays green', green > 10, `green=${green}`);
      t.assert('spans both parts', bb.min.x < -0.4 && bb.max.x > 5.4,
        `${bb.min.x.toFixed(2)}..${bb.max.x.toFixed(2)}`);
    },
  },
  {
    name: 'different roughness or maps never color-merge',
    run(t) {
      const root = new THREE.Group();
      root.add(box(pbr('#ff0000', 0.9), 0), box(pbr('#ff0000', 0.5), 5));
      const r = mergeStatic(root);
      t.assert('stays two meshes', meshes(root) === 2, `meshes=${meshes(root)}`);
      t.assert('nothing merged', r.merged === 0, JSON.stringify(r));
    },
  },
  {
    name: 'sibling mode merges per parent and bakes bone-local',
    run(t) {
      const root = new THREE.Group();
      const boneA = new THREE.Group();
      const boneB = new THREE.Group();
      boneA.position.set(10, 0, 0);
      boneB.position.set(-10, 0, 0);
      const mat = pbr('#ff0000', 0.9);
      boneA.add(box(mat, 0), box(mat, 2));
      boneB.add(box(mat, 0));
      root.add(boneA, boneB);
      const before = new THREE.Box3().setFromObject(root);
      const r = mergeStatic(root, new Set(), { local: true });
      t.assert('two meshes left (one per bone)', meshes(root) === 2, `meshes=${meshes(root)}`);
      t.assert('reports merged count', r.merged === 2 && r.kept === 1, JSON.stringify(r));
      const after = new THREE.Box3().setFromObject(root);
      t.assert('same world bounds',
        before.min.x.toFixed(3) === after.min.x.toFixed(3) &&
        before.max.x.toFixed(3) === after.max.x.toFixed(3),
        `${before.min.x.toFixed(2)}..${before.max.x.toFixed(2)} vs ${after.min.x.toFixed(2)}..${after.max.x.toFixed(2)}`);
      boneA.rotation.y = Math.PI / 2;
      const moved = new THREE.Box3().setFromObject(root);
      t.assert('merged mesh still follows its bone', moved.max.x.toFixed(2) !== after.max.x.toFixed(2),
        `${moved.max.x.toFixed(2)} vs ${after.max.x.toFixed(2)}`);
    },
  },
];
