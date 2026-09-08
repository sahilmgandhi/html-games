// Sun + shadows + ambient fill. One 2048px PCF-soft directional map.
// Contract: createLighting(scene) -> { update(dt), dispose() }
import * as THREE from 'three';

export function createLighting(scene) {
  const sun = new THREE.DirectionalLight(0xffdfb2, 2.6);
  sun.position.set(4, 15, 13);
  sun.target.position.set(12, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0x9a86b8, 0x5a4a3a, 0.55);
  scene.add(hemi);

  return {
    sun,
    update() {},
    dispose() {
      scene.remove(sun);
      scene.remove(sun.target);
      scene.remove(hemi);
      sun.shadow.map?.dispose();
    },
  };
}
