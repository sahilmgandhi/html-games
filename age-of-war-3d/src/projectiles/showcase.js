import { ProjectileMesh } from './projectiles.js';
import { ParticleSystem3D } from '../particles/particles.js';

// Ballistics showcase: one of each kind arcs across the lane on loop and
// bursts on impact. Exercises trail aim, spin, glow and particle pooling.
export function runShowcase(game) {
  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);

  const shots = [];
  const defs = [
    { kind: 'rock', from: [3, 2.5], to: [13, 0.5], dur: 1.6, color: '#c9bfa8' },
    { kind: 'egg', from: [5, 3.0], to: [11, 0.5], dur: 1.1, color: '#fff4d6' },
    { kind: 'boulder', from: [2, 3.5], to: [15, 0.5], dur: 2.2, color: '#ff7a2a' },
  ];
  for (const d of defs) {
    const pm = ProjectileMesh(d.kind);
    game.scene.add(pm.mesh);
    shots.push({ ...d, pm, t: Math.random() * d.dur });
  }

  game.renderer.camera.position.set(9, 4, 14);
  game.renderer.camera.lookAt(9, 1.8, 0);

  game.onUpdate((dt) => {
    for (const s of shots) {
      s.t += dt;
      if (s.t >= s.dur) {
        const [tx] = s.to;
        fx.burst(tx, 0.6, 0, { color: s.color, count: s.kind === 'boulder' ? 26 : 12 });
        fx.damageNumber(tx, 1.6, 0, s.kind === 'boulder' ? '25' : '12');
        s.t = 0;
      }
      const k = s.t / s.dur;
      const x = s.from[0] + (s.to[0] - s.from[0]) * k;
      const y = s.from[1] + (s.to[1] - s.from[1]) * k + Math.sin(k * Math.PI) * 3.2;
      s.pm.mesh.position.set(x, Math.max(0.15, y), (s.kind === 'egg' ? -1 : 1) * 0.8);
      s.pm.update(dt);
    }
    fx.update(dt);
  });
}
