import { TurretMesh } from './turrets.js';
import { Turret, Unit } from '../simulation/entities.js';
import { UnitMesh } from '../units/units.js';

// Gun line showcase: all three Stone Age turrets track a pacing warband and
// fire on rotation. Exercises aimAt yaw, recoil, muzzle flash, HP bars.
export function runShowcase(game) {
  const guns = [];
  [320, 560, 800].forEach((x, i) => {
    const t = new Turret(x, 440, 'player', 0, i, i);
    const tm = TurretMesh(t, 0);
    game.scene.add(tm.mesh);
    guns.push({ t, tm });
  });

  const targets = [];
  for (let i = 0; i < 3; i++) {
    const e = new Unit(1400 + i * 90, 440, 'enemy', 0, i === 2 ? 1 : 0, 0, false, -1 + i);
    const um = UnitMesh(e, 0);
    game.scene.add(um.mesh);
    targets.push({ e, um, ph: i * 2.1 });
  }

  game.renderer.camera.position.set(7, 4.5, 16);
  game.renderer.camera.lookAt(7, 2, 0);

  let t = 0;
  let volley = 1;
  game.onUpdate((dt) => {
    t += dt;
    for (const { e, um, ph } of targets) {
      e.x = 1150 + Math.sin(t * 0.5 + ph) * 150;
      e.walkPhase += dt * e.speed * 4;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      um.update(dt, e);
    }
    // each gun tracks its own target in metres (y≈1.5 body height)
    targets.forEach(({ e }, i) => {
      const g = guns[i % guns.length];
      g.tm.aimAt(e.x * 0.01, 1.5, e.z || 0);
    });
    // rolling volley fire
    volley -= dt;
    if (volley <= 0) {
      const g = guns[Math.floor(t) % guns.length];
      g.tm.fire();
      const vic = targets[Math.floor(t) % targets.length].e;
      vic.takeDamage(8);
      volley = 0.9;
    }
    for (const { t: tur, tm } of guns) {
      if (tur.hitFlash > 0) tur.hitFlash -= dt;
      tm.update(dt);
    }
  });
}
