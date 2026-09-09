import * as THREE from 'three';
import { createEnvironment } from '../src/environment/environment.js';

// Tall trees directly behind the lane bury the action in foliage from the
// side camera. Treeline trees must stay 10m+ behind the lane (z <= -10).
function treelineReport(age) {
  const scene = new THREE.Scene();
  const env = createEnvironment(scene, age);
  scene.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  let tagged = 0;
  const bad = [];
  env.group.traverse((o) => {
    if (o.userData && o.userData.treeline) {
      tagged++;
      o.getWorldPosition(v);
      if (v.z > -10) bad.push(`z=${v.z.toFixed(1)}`);
    }
  });
  return { tagged, bad };
}

// Future (4) has a skyline backdrop and no treeline at all.
const MIN_TAGGED = { 0: 10, 1: 10, 2: 10, 3: 10, 4: 0 };

export default [0, 1, 2, 3, 4].map((age) => ({
  name: `age ${age}: treeline stays 10m+ behind the lane`,
  run(t) {
    const { tagged, bad } = treelineReport(age);
    t.assert('treeline trees are tagged', tagged >= MIN_TAGGED[age], `tagged=${tagged}`);
    t.assert('no treeline tree crowds the lane', bad.length === 0, bad.slice(0, 3).join('; '));
  },
}));
