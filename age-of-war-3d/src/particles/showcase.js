// Particles showcase: repeating bursts, damage numbers and gold numbers
// across the lane. Exercises the pooled Points cloud + HTML floaters.
import { ParticleSystem3D } from './particles.js';

export function runShowcase(game) {
  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  game.renderer.camera.position.set(12, 5, 15);
  game.renderer.camera.lookAt(12, 1.5, 0);
  const spots = [
    [9, '#ff5a4a', '24'], [12, '#ffcc66', '16'], [15, '#5aa0ff', '31'],
  ];
  let t = 0;
  let n = 0;
  game.onUpdate((dt) => {
    t += dt;
    fx.update(dt);
    if (t > 0.8) {
      t = 0;
      const [x, color, label] = spots[n % spots.length];
      n++;
      fx.burst(x, 1.2, (n % 3 - 1) * 1.2, { color, count: 26 });
      fx.damageNumber(x, 2.4, 0, label, '#ffd34d');
      if (n % 3 === 0) fx.goldNumber(x + 1.5, 2.0, 0.5, '+33');
    }
  });
}
