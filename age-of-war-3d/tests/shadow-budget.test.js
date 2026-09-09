import * as THREE from 'three';
import { solidify } from '../src/core/pbr.js';

function groupWith(bigR, smallR) {
  const g = new THREE.Group();
  const big = new THREE.Mesh(new THREE.BoxGeometry(bigR, bigR, bigR));
  const small = new THREE.Mesh(new THREE.SphereGeometry(smallR, 8, 6));
  g.add(big, small);
  return { g, big, small };
}

export default [
  {
    name: 'solidify skips shadow casting on pebble-size meshes (draw-call budget)',
    run(t) {
      const { g, big, small } = groupWith(1, 0.042);
      solidify(g);
      t.assert('structural mesh still casts', big.castShadow === true, String(big.castShadow));
      t.assert('structural mesh still receives', big.receiveShadow === true, String(big.receiveShadow));
      t.assert('pebble mesh (r=0.042) does not cast', small.castShadow === false, String(small.castShadow));
      t.assert('pebble mesh still receives', small.receiveShadow === true, String(small.receiveShadow));
    },
  },
  {
    name: 'solidify Infinity override restores legacy all-cast behavior',
    run(t) {
      const { g, small } = groupWith(1, 0.042);
      solidify(g, true, true, Infinity);
      t.assert('override keeps small caster', small.castShadow === true, String(small.castShadow));
    },
  },
];
