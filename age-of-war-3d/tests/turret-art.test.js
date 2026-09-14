import { TurretMesh } from '../src/turrets/turrets.js';

function fakeTurret(over = {}) {
  return {
    x: 140, z: 0, side: 'player', turretIndex: 0, slotIndex: 0,
    hp: 150, maxHp: 150, alive: true, hitFlash: 0, ...over,
  };
}

// Turret art pass: every procedural rig flies a rippling side pennon
// (flat quads do not ship), so deck guns read as crewed war machines.
export default [
  {
    name: 'every age flies a rippling pennon',
    run(t) {
      for (let age = 0; age < 5; age++) {
        const tm = TurretMesh(fakeTurret({ turretIndex: 0 }), age);
        let cloth = null;
        tm.mesh.traverse((o) => {
          if (!cloth && o.isMesh && o.geometry?.type === 'PlaneGeometry') cloth = o;
        });
        t.assert(`age ${age} has cloth pennon`, !!cloth, 'no PlaneGeometry');
        if (cloth) {
          const before = cloth.geometry.attributes.position.array.slice();
          tm.update(0.05);
          tm.update(0.05);
          const after = cloth.geometry.attributes.position.array;
          t.assert(`age ${age} pennon ripples`, before.some((v, i) => Math.abs(v - after[i]) > 1e-6), 'static cloth');
        }
        tm.dispose();
      }
    },
  },
];
