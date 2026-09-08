// Sun + shadows + ambient fill. One 2048px PCF-soft directional map.
// Contract: createLighting(scene) -> { sun, update(dt), setAge(i), dispose() }
// Per-age mood: Stone warm day, Castle cold moonlit night, Renaissance golden
// day, Modern overcast steel, Future neon dusk. Unknown ages reuse Stone.
import * as THREE from 'three';

const AGE_MOOD = [
  { sun: 0xffdfb2, sunI: 2.6, pos: [4, 15, 13], sky: 0x9a86b8, gnd: 0x5a4a3a, hemiI: 0.55 },
  { sun: 0x8fa8ff, sunI: 1.7, pos: [-7, 12, 9], sky: 0x2a3a6e, gnd: 0x141a28, hemiI: 0.62 },
  { sun: 0xffe8c0, sunI: 2.8, pos: [8, 16, 10], sky: 0xa898c0, gnd: 0x6a5a44, hemiI: 0.55 },
  { sun: 0xd8e0ea, sunI: 2.0, pos: [0, 18, 6], sky: 0x8a94a8, gnd: 0x4a4a52, hemiI: 0.6 },
  { sun: 0xbfa8ff, sunI: 2.2, pos: [-8, 14, 12], sky: 0x6a5ac8, gnd: 0x2a2a44, hemiI: 0.5 },
];

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
    setAge(i) {
      const m = AGE_MOOD[i] || AGE_MOOD[0];
      sun.color.setHex(m.sun);
      sun.intensity = m.sunI;
      sun.position.set(...m.pos);
      hemi.color.setHex(m.sky);
      hemi.groundColor.setHex(m.gnd);
      hemi.intensity = m.hemiI;
    },
    dispose() {
      scene.remove(sun);
      scene.remove(sun.target);
      scene.remove(hemi);
      sun.shadow.map?.dispose();
    },
  };
}
