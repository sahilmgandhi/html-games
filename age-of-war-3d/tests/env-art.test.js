import * as THREE from 'three';
import { createEnvironment } from '../src/environment/environment.js';
import { createTerrain } from '../src/terrain/terrain.js';

function detailCount(root, kind) {
  let n = 0;
  root.traverse((o) => { if (o.userData && o.userData.detail === kind) n++; });
  return n;
}

// Background/ground pass: mesas sit on talus skirts instead of floating
// trunks, trees carry dark under-skirts that break the cone read, and the
// lane seats into the ground on edged borders with denser scatter.
export default [
  {
    name: 'mesas carry talus, trees carry under-skirts',
    run(t) {
      for (const age of [0, 1, 2]) {
        const scene = new THREE.Scene();
        const env = createEnvironment(scene, age);
        t.assert(`age ${age} trees skirted`, detailCount(env.group, 'skirt-tree') >= 10,
          `skirts=${detailCount(env.group, 'skirt-tree')}`);
        env.dispose();
      }
      const scene = new THREE.Scene();
      const env = createEnvironment(scene, 0);
      t.assert('stone mesas on talus', detailCount(env.group, 'mesa-talus') >= 4,
        `talus=${detailCount(env.group, 'mesa-talus')}`);
      env.dispose();
    },
  },
  {
    name: 'lane seats on edged borders with dense scatter',
    run(t) {
      const scene = new THREE.Scene();
      const terrain = createTerrain(scene, 0);
      t.assert('two lane-edge borders', detailCount(terrain.group, 'lane-edge') === 2,
        `edges=${detailCount(terrain.group, 'lane-edge')}`);
      let inst = 0;
      terrain.group.traverse((o) => { if (o.isInstancedMesh) inst += o.count; });
      t.assert('dense pebble/tuft scatter', inst >= 580, `inst=${inst}`);
      terrain.dispose();
    },
  },
];
