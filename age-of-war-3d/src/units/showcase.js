import { UnitMesh } from './units.js';
import { getQuatTemplates } from './gltf-cast.js';
import { Unit } from '../simulation/entities.js';
import { ParticleSystem3D } from '../particles/particles.js';

// Skirmish showcase: two warbands march together, trade blows, one falls and
// the line resets. Exercises walk / attack / hit-flash / death / HP bars.
export function runShowcase(game) {
  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  const fighters = [];
  const defs = [
    // [xPx, z, side, unitIndex, isHero]
    [900, -1.2, 'player', 0, false],
    [980, 0.4, 'player', 0, false],
    [840, 1.3, 'player', 1, false],
    [700, -0.3, 'player', 2, false],
    [620, 1.0, 'player', 0, true],
    [1500, 1.1, 'enemy', 0, false],
    [1420, -0.5, 'enemy', 0, false],
    [1560, -1.4, 'enemy', 1, false],
    [1700, 0.2, 'enemy', 2, false],
  ];
  for (const [x, z, side, unitIndex, isHero] of defs) {
    const e = new Unit(x, 440, side, 0, unitIndex, 0, isHero, z);
    const um = UnitMesh(e, 0);
    game.scene.add(um.mesh);
    fighters.push({ e, um, ox: ((fighters.length % 3) - 1) * 60 });
  }

  let t = 0;
  let killTimer = 3;
  let quatSwapped = false;
  game.onUpdate((dt) => {
    // The skeletal cast loads async; upgrade staged fighters once it lands
    // (mirrors the battle-view quatSwap).
    if (!quatSwapped && getQuatTemplates()) {
      quatSwapped = true;
      for (const f of fighters) {
        game.scene.remove(f.um.mesh);
        f.um.dispose();
        f.um = UnitMesh(f.e, 0);
        game.scene.add(f.um.mesh);
      }
    }
    t += dt;
    for (const { e, um, ox } of fighters) {
      if (!e.alive) continue;
      // march toward the middle until in club range of a foe
      const foeX = (e.side === 'player' ? 1250 : 1150) + ox;
      const dir = Math.sign(foeX - e.x) || 1;
      if (Math.abs(foeX - e.x) > e.range) {
        e.x += dir * e.speed * 60 * dt;
        e.walkPhase += dt * e.speed * 4;
      } else if (e.attackCooldown <= 0) {
        e.attackCooldown = e.attackSpeed;
      }
      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      um.update(dt, e);
    }
    // one dramatic death every few seconds, then reset the line
    killTimer -= dt;
    if (killTimer <= 0) {
      const foes = fighters.filter((f) => f.e.side === 'enemy' && f.e.alive && !f.e.dying);
      if (foes.length > 1) {
        const victim = foes[Math.floor(Math.random() * foes.length)];
        victim.e.takeDamage(99999);
        fx.burst(victim.e.x * 0.01, 1.2, victim.e.z || 0, { color: '#ff5a4a', count: 22 });
        fx.damageNumber(victim.e.x * 0.01, 2.2, victim.e.z || 0, '999', '#ff6a5a');
        // splash some pain onto its neighbours
        for (const f of fighters) {
          if (f.e !== victim.e && f.e.alive && Math.abs(f.e.x - victim.e.x) < 200) {
            f.e.takeDamage(15);
          }
        }
        killTimer = 5;
      } else {
        for (const { e } of fighters) {
          e.hp = e.maxHp;
          e.alive = true;
          e.dying = false;
          e.deathTimer = 0;
          e.x = e.side === 'player' ? 620 + Math.random() * 360 : 1420 + Math.random() * 280;
        }
        killTimer = 4;
      }
    }
    // advance death timers like the sim does
    for (const { e } of fighters) {
      if (e.dying && e.alive) {
        e.deathTimer += dt;
        if (e.deathTimer > 0.35) e.alive = false;
      }
    }
    fx.update(dt);
  });
}
