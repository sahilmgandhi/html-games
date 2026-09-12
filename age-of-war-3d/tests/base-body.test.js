import { BattleSim } from '../src/simulation/battle.js';

// Strongholds are volumes, not points: melee must engage at the wall
// (never walk to the center), spawns must clear the gate, and shells must
// explode on the masonry instead of flying to the flagpole.
export default [
  {
    name: 'melee engages at the wall, outside the body',
    run(t) {
      const sim = new BattleSim({ seed: 11, autoAI: false });
      sim.gold = 1e6;
      sim.spawnUnit(0);
      const u = sim.units[sim.units.length - 1];
      u.x = sim.enemyBase.x - 500;
      const hp0 = sim.enemyBase.hp;
      let minGap = Infinity;
      for (let f = 0; f < 3600; f++) {
        sim.update(1 / 60);
        if (u.alive) minGap = Math.min(minGap, Math.abs(u.x - sim.enemyBase.x));
      }
      t.assert('base took damage', sim.enemyBase.hp < hp0, `hp=${sim.enemyBase.hp}`);
      t.assert('never entered the body', minGap > 200, `minGap=${Math.round(minGap)}`);
    },
  },
  {
    name: 'spawns clear the gate',
    run(t) {
      const sim = new BattleSim({ seed: 11, autoAI: false });
      sim.gold = 1e6;
      sim.spawnUnit(0);
      sim.spawnHero('player');
      for (const u of sim.units) {
        const gap = Math.abs(u.x - sim.playerBase.x);
        t.assert(`${u.isHero ? 'hero' : 'unit'} spawns outside the body`, gap > 250, `gap=${Math.round(gap)}`);
      }
    },
  },
  {
    name: 'shells explode on the wall, not at the center',
    run(t) {
      const sim = new BattleSim({ seed: 11, autoAI: false });
      const bx = sim.enemyBase.x;
      const p = sim.projectilePool.acquire(bx - 600, 450, bx, 450, 300, 50, 'player', 0, 'rock', 0);
      let lastX = p.x;
      for (let f = 0; f < 300 && p.alive; f++) {
        p.update(1 / 60);
        lastX = p.x;
        p.checkHit([sim.playerBase, sim.enemyBase], sim.spatialHash);
      }
      t.assert('projectile died', !p.alive, '');
      t.assert('base took damage', sim.enemyBase.hp < sim.enemyBase.maxHp, `hp=${sim.enemyBase.hp}`);
      t.assert('died at the wall', Math.abs(lastX - bx) > 200, `gap=${Math.round(Math.abs(lastX - bx))}`);
    },
  },
];
