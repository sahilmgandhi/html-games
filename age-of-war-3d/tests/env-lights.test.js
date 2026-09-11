import * as THREE from 'three';
import { createEnvironment } from '../src/environment/environment.js';
function lights(root) {
  const out = [];
  root.traverse((o) => { if (o.isPointLight) out.push(o); });
  return out;
}
function flameScales(root) {
  const out = [];
  root.traverse((o) => {
    if (o.isMesh && o.userData && o.userData.seed !== undefined) {
      out.push([o.scale.x, o.scale.y, o.scale.z]);
    }
  });
  return out;
}

// Night firelight: lane braziers/pylons carry real point lights that
// flicker with their flames, and no flame scale ever goes NaN (the future
// pylon lamp missed its seed, vanishing its lamp on the first update).
export default [1, 4].map((age) => ({
  name: `age ${age} firelight flickers and stays finite`,
  run(t) {
    const scene = new THREE.Scene();
    const env = createEnvironment(scene, age);
    for (let i = 0; i < 5; i++) env.update(0.05);
    const fires = lights(env.group);
    t.assert('point lights match flames', fires.length > 0, `lights=${fires.length}`);
    const seen = new Set();
    for (let i = 0; i < 5; i++) {
      env.update(0.05);
      for (const l of lights(env.group)) seen.add(l.intensity.toFixed(3));
    }
    t.assert('intensity flickers', seen.size > 1, [...seen].slice(0, 3).join(','));
    t.assert('intensity in range', [...seen].every((v) => +v > 0 && +v < 60), [...seen].slice(0, 4).join(','));
    const bad = flameScales(env.group).filter((s) => !s.every(Number.isFinite));
    t.assert('no NaN flame scales', bad.length === 0, JSON.stringify(bad.slice(0, 2)));
    env.dispose();
  },
}));
