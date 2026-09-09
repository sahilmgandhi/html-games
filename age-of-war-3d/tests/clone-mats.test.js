import * as THREE from 'three';
import { cloneMats } from '../src/core/pbr.js';

// Multi-material glTF/FBX parts (the raptor) crashed cloneMats, which
// assumed o.material.clone exists. The showcase quatSwap died mid-loop.
export default [
  {
    name: 'clones multi-material arrays without throwing',
    run(t) {
      const root = new THREE.Group();
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const a = new THREE.MeshStandardMaterial({ color: '#ff0000' });
      const b = new THREE.MeshStandardMaterial({ color: '#00ff00' });
      root.add(new THREE.Mesh(geo, [a, b]));
      const mats = cloneMats(root);
      t.assert('flat list of both clones', mats.length === 2, JSON.stringify(mats.length));
      t.assert('independent of originals', mats[0] !== a && mats[1] !== b, '');
      t.assert('mesh keeps an array', root.children[0].material.length === 2, '');
      t.assert('originals untouched', a.color.getHex() === 0xff0000, '');
    },
  },
  {
    name: 'single materials still clone independently',
    run(t) {
      const root = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: '#0000ff' });
      root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
      const mats = cloneMats(root);
      t.assert('one clone', mats.length === 1, JSON.stringify(mats.length));
      t.assert('independent', mats[0] !== m, '');
      t.assert('original untouched', m.color.getHex() === 0x0000ff, '');
    },
  },
];
