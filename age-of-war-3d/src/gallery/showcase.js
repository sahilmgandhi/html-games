import { UnitMesh } from '../units/units.js';
import { getQuatTemplates } from '../units/gltf-cast.js';
import { Unit } from '../simulation/entities.js';
import { CONFIG } from '../simulation/config.js';
import { galleryRoster } from './roster.js';

// Gallery showcase (?showcase=gallery): every age's cast lined up, cycling
// walk / attack / idle so all animation clips play. Keys 1-5 switch age.
export function runShowcase(game) {
  let age = 0;
  let lineup = [];
  let quatSwapped = false;
  let phase = 0;
  let phaseT = 0;
  let orbit = 0;

  function build() {
    for (const { um } of lineup) {
      game.scene.remove(um.mesh);
      um.dispose();
    }
    lineup = [];
    const roster = galleryRoster(age);
    roster.forEach((slot, i) => {
      const def = slot.isHero ? CONFIG.AGES[age].hero : CONFIG.AGES[age].units[slot.unitIndex];
      const e = new Unit(900 + i * 260, def.hp, 'player', age, slot.isHero ? 0 : slot.unitIndex, 0, slot.isHero, 0);
      const um = UnitMesh(e, age);
      game.scene.add(um.mesh);
      lineup.push({ e, um });
    });
    quatSwapped = !!getQuatTemplates();
    document.title = `${CONFIG.AGES[age].name} — gallery (1-5 to switch)`;
  }

  build();
  window.addEventListener('keydown', (ev) => {
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= CONFIG.AGES.length && n - 1 !== age) {
      age = n - 1;
      phase = 0;
      phaseT = 0;
      build();
    }
  });

  // walk 3s -> attack 2s -> idle 2s, looping so every clip shows.
  game.onUpdate((dt) => {
    if (!quatSwapped && getQuatTemplates()) build();
    phaseT += dt;
    if (phaseT > [3, 2, 2][phase]) {
      phaseT = 0;
      phase = (phase + 1) % 3;
      if (phase === 1) for (const { e } of lineup) e.attackCooldown = 2.0;
    }
    for (const { e, um } of lineup) {
      if (phase === 0) e.walkPhase += dt * 6;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      um.update(dt, e);
    }
    // gentle camera sway around the lineup center (a full orbit flies
    // through terrain rocks; +/-0.5 rad gives parallax without clipping)
    orbit += dt * 0.25;
    const sway = 2.4 + Math.sin(orbit) * 0.3;
    const cx = 9 + (lineup.length - 1) * 1.3;
    game.camera.position.set(cx + Math.cos(sway) * 8, 9, Math.sin(sway) * 8);
    game.camera.lookAt(cx, 1, 0);
  });
}
