// Sun + shadows + ambient fill. One 2048px PCF-soft directional map.
// Contract: createLighting(scene) -> { sun, update(dt), setAge(i), dispose() }
// Per-age mood: Stone warm day, Castle cold moonlit night, Renaissance golden
// day, Modern overcast steel, Future neon dusk. Unknown ages reuse Stone.
// A dim counter-directional rim light (no shadows) lifts backlit faces so
// silhouettes separate from the background, most visibly on moonlit nights.
import * as THREE from 'three';

const AGE_MOOD = [
  { sun: 0xffdfb2, sunI: 2.6, pos: [4, 15, 13], sky: 0x9a86b8, gnd: 0x5a4a3a, hemiI: 0.7, rim: 0xb0c4de, rimI: 0.85 },
  { sun: 0x8fa8ff, sunI: 1.7, pos: [-7, 12, 9], sky: 0x2a3a6e, gnd: 0x141a28, hemiI: 0.62, rim: 0x5a76c8, rimI: 0.65 },
  { sun: 0xffe8c0, sunI: 2.8, pos: [8, 16, 10], sky: 0xa898c0, gnd: 0x6a5a44, hemiI: 0.65, rim: 0xc8b49a, rimI: 0.7 },
  { sun: 0xd8e0ea, sunI: 2.0, pos: [0, 18, 6], sky: 0x8a94a8, gnd: 0x4a4a52, hemiI: 0.7, rim: 0x9aa4b8, rimI: 0.7 },
  { sun: 0xbfa8ff, sunI: 2.2, pos: [-8, 14, 12], sky: 0x6a5ac8, gnd: 0x2a2a44, hemiI: 0.6, rim: 0x8a7ae8, rimI: 0.7 },
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

  // Counter-directional rim: mirrors the sun's azimuth so faces the sun
  // never touches get a cool modeling lift instead of flat black.
  const rim = new THREE.DirectionalLight(0xb0c4de, 0.45);
  rim.position.set(-4, 7, -13);
  rim.target.position.set(12, 0, 0);
  scene.add(rim);
  scene.add(rim.target);

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
      rim.color.setHex(m.rim);
      rim.intensity = m.rimI;
      rim.position.set(-m.pos[0], 7, -m.pos[2]);
    },
    dispose() {
      scene.remove(sun);
      scene.remove(sun.target);
      scene.remove(hemi);
      scene.remove(rim);
      scene.remove(rim.target);
      sun.shadow.map?.dispose();
    },
  };
}
