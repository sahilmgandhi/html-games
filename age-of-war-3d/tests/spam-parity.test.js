import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';
import { AI } from '../src/simulation/ai.js';
import { SpatialHash, Turret, Unit } from '../src/simulation/entities.js';
import { mulberry32 } from '../src/simulation/rng.js';

// Ranged-ball spam (Slingshot/Archer/...): AI-only answers, no CONFIG stat
// touches. Generic across ages: every ranged unit answered by fast units.
function richEnemy(sim) {
  const s = sim;
  s.gold = 1e6;
  s.enemyGold = 1e6;
  s.enemyXp = 0; // blocks evolve so decide reaches unit picks
  s.enemyHeroCooldown = 999;
  s.enemySpecialCooldown = 999;
  s.enemySlotsBought = 4;
  for (let i = 0; i < 4; i++) s.spawnEnemyTurret(0);
  for (let i = 0; i < 4; i++) s.buyEnemyBuilding(0);
  s.enemyGold = 1e6;
  s.ai.waveTimer = 0;
  s.ai.aggression = 0.6;
  return s;
}

function rangedFoes(sim, n = 6) {
  for (let i = 0; i < n; i++) sim.spawnUnitForSide('player', 1); // age-0 ranged
  return sim.units.filter((u) => u.side === 'player' && u.alive);
}

export default [
  {
    // Gated trickle holds at 5v2 neutral, but a ranged ball must still pull
    // counter reinforcements instead of letting the ball siege for free.
    name: 'ranged ball pulls reinforcements past the hold',
    run(t) {
      const sim = richEnemy(new BattleSim({ seed: 11, autoAI: false }));
      sim.ai.rng = () => 0.0;
      for (let i = 0; i < 5; i++) sim.spawnEnemyUnit(0);
      rangedFoes(sim, 6);
      let spawned = 5;
      const orig = sim.spawnEnemyUnit.bind(sim);
      sim.spawnEnemyUnit = (i) => { spawned++; return orig(i); };
      for (let i = 0; i < 10; i++) sim.ai.decide();
      t.assert('counters flow vs ranged ball', spawned >= 12, `spawned=${spawned}`);
    },
  },
  {
    // Same weights as ../age-of-war/js/ai.js, except the ranged answer leans
    // fast so the ball gets rushed instead of traded against.
    name: 'ranged strategy leans fast off the seeded stream',
    run(t) {
      const sim = richEnemy(new BattleSim({ seed: 7, autoAI: false }));
      const foes = rangedFoes(sim, 6);
      const ai = new AI(sim, mulberry32(11));
      ai.aggression = 0.6;
      ai.analyzeThreats(foes);
      t.assert('ball reads as ranged', ai.strategy === 'ranged', ai.strategy);
      let fast = 0;
      const n = 300;
      for (let i = 0; i < n; i++) {
        if (ai.pickUnitIndex(sim, CONFIG.AGES[0], foes) === 2) fast++;
      }
      t.assert('fast share answers the ball', fast / n >= 0.27, `fast=${fast}/${n}`);
    },
  },
  {
    // Turrets stay distance-first: a small value bonus must not let one heavy
    // mask a ranged ball chewing at half the distance.
    name: 'turrets engage the nearest threat, not the heaviest',
    run(t) {
      const turret = new Turret(140, 450, 'player', 0, 0, 0); // range 200
      const hash = new SpatialHash(128);
      for (let i = 0; i < 5; i++) {
        const u = new Unit(240, 450, 'enemy', 0, 1, 0, false); // d=100
        hash.insert(u);
      }
      const hero = new Unit(280, 450, 'enemy', 0, 0, 0, true); // d=140, bonus
      hash.insert(hero);
      const pool = { active: [], acquire(x, y, tx, ty) { this.last = { tx, ty }; } };
      turret.attackCooldown = 0;
      turret.update(0.016, pool, hash);
      t.assert('shot goes to the ball', pool.last && pool.last.tx === 240,
        `tx=${pool.last && pool.last.tx}`);
    },
  },
];
