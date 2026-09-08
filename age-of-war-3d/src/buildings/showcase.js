import { BuildingMesh } from './buildings.js';
import { Building } from '../simulation/entities.js';
import { UnitMesh } from '../units/units.js';
import { Unit } from '../simulation/entities.js';

// Homestead showcase: gold mine + barracks with a guard detail.
// Exercises banner ripple, campfire flicker, healer crosses, HP bars.
export function runShowcase(game) {
  const mine = new Building(330, 440, 'player', 0, 0);
  const mineMesh = BuildingMesh(mine);
  game.scene.add(mineMesh.mesh);

  const rax = new Building(640, 440, 'player', 1, 1);
  const raxMesh = BuildingMesh(rax);
  game.scene.add(raxMesh.mesh);

  const guards = [];
  [[180, 0.8, 0], [500, -1.0, 1]].forEach(([x, z, ui]) => {
    const e = new Unit(x, 440, 'player', 0, ui, 0, false, z);
    const um = UnitMesh(e, 0);
    game.scene.add(um.mesh);
    guards.push({ e, um });
  });

  game.renderer.camera.position.set(5, 3.5, 11);
  game.renderer.camera.lookAt(5, 1.5, 0);

  let t = 0;
  game.onUpdate((dt) => {
    t += dt;
    mineMesh.update(dt);
    raxMesh.update(dt);
    for (const { e, um } of guards) {
      e.walkPhase += dt * 0.6; // idle sway
      um.update(dt, e);
    }
  });
}
