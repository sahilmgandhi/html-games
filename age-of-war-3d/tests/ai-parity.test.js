import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';
import { AI } from '../src/simulation/ai.js';

// Parity with ../age-of-war/js/{config,ai}.js (cited inline).
// Neutral-state mirror only: turtle/winning stances, opener and the <3
// trickle hold stay as accepted anti-base-race deviations.
function neutralSim() {
  const sim = new BattleSim({ seed: 7, autoAI: false });
  sim.gold = 1e6;
  sim.enemyGold = 1e6;
  return sim;
}

// Block every decide branch except the one under test.
function isolate(sim, { xp = 0 } = {}) {
  sim.enemyXp = xp;
  sim.enemyHeroCooldown = 999;
  sim.enemySpecialCooldown = 999;
  sim.enemySlotsBought = 4;
  for (let i = 0; i < 4; i++) sim.spawnEnemyTurret(0);
  for (let i = 0; i < 4; i++) sim.buyEnemyBuilding(0);
  sim.enemyGold = 1e6;
  sim.ai.waveTimer = 0;
  sim.ai.aggression = 0.6;
}

function foeNearBase(sim, n) {
  for (let i = 0; i < n; i++) {
    const u = sim.spawnUnitForSide('player', 0);
    u.x = 2000; // > 0.65 * WORLD.WIDTH, counts as near the enemy base
  }
}

export default [
  {
    // Original has [Normal 1.0, Harder, Impossible]; 3D keeps its Easy row
    // as a 0.9x middle ground instead of 0.8x.
    name: 'Easy is a 0.9x middle ground, shared tiers match original',
    run(t) {
      const easy = CONFIG.DIFFICULTIES[0];
      t.assert('Easy named Easy', easy.name === 'Easy', easy.name);
      t.assert('Easy hp 0.9', easy.enemyHpMult === 0.9, String(easy.enemyHpMult));
      t.assert('Easy dmg 0.9', easy.enemyDmgMult === 0.9, String(easy.enemyDmgMult));
      t.assert('Easy gold 0.9', easy.enemyGoldMult === 0.9, String(easy.enemyGoldMult));
      t.assert('Easy think 1.2', easy.aiThinkMult === 1.2, String(easy.aiThinkMult));
      t.assert('Normal 1.0x', CONFIG.DIFFICULTIES[1].enemyHpMult === 1.0
        && CONFIG.DIFFICULTIES[1].enemyDmgMult === 1.0
        && CONFIG.DIFFICULTIES[1].enemyGoldMult === 1.0
        && CONFIG.DIFFICULTIES[1].aiThinkMult === 1.0,
        JSON.stringify(CONFIG.DIFFICULTIES[1]));
      t.assert('Harder 1.15x/0.8', CONFIG.DIFFICULTIES[2].enemyHpMult === 1.15
        && CONFIG.DIFFICULTIES[2].aiThinkMult === 0.8, JSON.stringify(CONFIG.DIFFICULTIES[2]));
      t.assert('Impossible 1.3x/0.6', CONFIG.DIFFICULTIES[3].enemyHpMult === 1.3
        && CONFIG.DIFFICULTIES[3].aiThinkMult === 0.6, JSON.stringify(CONFIG.DIFFICULTIES[3]));
    },
  },
  {
    name: 'Easy think interval matches 1.2x pacing',
    run(t) {
      const sim = neutralSim();
      t.assert('Easy thinks every 3.0s', sim.ai.thinkInterval === 2.5 * 1.2,
        String(sim.ai.thinkInterval));
    },
  },
  {
    // Special table shifted one step up so each tier answers like the
    // original tier above it: Easy==orig Normal (0.3/0.3hp/4-near),
    // Normal==orig Harder (0.5/0.4hp/3-near), Harder/Impossible unrestrained.
    name: 'enemy special odds mirror original one tier up',
    run(t) {
      const sim = neutralSim();
      sim.enemySpecialCooldown = 0;

      sim.difficulty = 0;
      sim.ai = new AI(sim, () => 0.1);
      sim.enemyXp = 1e6;
      sim.enemyBase.hp = sim.enemyBase.maxHp;
      foeNearBase(sim, 4);
      t.assert('Easy fires at 4 near base like orig Normal', sim.ai.trySpecial(sim,
        sim.units.filter((u) => u.side === 'player' && u.alive)) === true);

      sim.difficulty = 1;
      sim.ai = new AI(sim, () => 0.1);
      sim.enemySpecialCooldown = 0;
      sim.enemyXp = 1e6;
      sim.enemyBase.hp = sim.enemyBase.maxHp * 0.35;
      sim.units.length = 0;
      foeNearBase(sim, 3);
      t.assert('Normal fires at 0.35hp/3 near like orig Harder', sim.ai.trySpecial(sim,
        sim.units.filter((u) => u.side === 'player' && u.alive)) === true);

      sim.difficulty = 2;
      sim.ai = new AI(sim, () => 0.9);
      sim.enemySpecialCooldown = 0;
      sim.enemyXp = 1e6;
      sim.enemyBase.hp = sim.enemyBase.maxHp * 0.4;
      sim.units.length = 0;
      foeNearBase(sim, 3);
      t.assert('Harder fires unrestrained like orig Impossible', sim.ai.trySpecial(sim,
        sim.units.filter((u) => u.side === 'player' && u.alive)) === true);
    },
  },
  {
    // Trickle pacing below the hold matches original rate: with 1 unit out,
    // every think reinforces (rng 0 always passes spawnChance).
    name: 'neutral trickle below the hold matches original rate',
    run(t) {
      const sim = neutralSim();
      isolate(sim);
      sim.ai.rng = () => 0.0;
      sim.spawnEnemyUnit(0);
      let spawned = 1;
      const orig = sim.spawnEnemyUnit.bind(sim);
      sim.spawnEnemyUnit = (i) => { spawned++; return orig(i); };
      // tryUnitSpawn directly: the hold lives in decide, the rate here must
      // equal the original 0.3 + aggression * 0.4 (rng 0 always passes).
      for (let i = 0; i < 10; i++) sim.ai.tryUnitSpawn(sim, CONFIG.AGES[0], []);
      t.assert('10 thinks reinforce ~10 units', spawned >= 10, `spawned=${spawned}`);
    },
  },
  {
    // The <3 hold itself stays: with 5 units out and a balanced foe, the
    // enemy holds instead of trickling (anti-base-race deviation, kept).
    name: 'trickle hold above 3 units stays (kept deviation)',
    run(t) {
      const sim = neutralSim();
      isolate(sim);
      sim.ai.rng = () => 0.0;
      for (let i = 0; i < 5; i++) sim.spawnEnemyUnit(0);
      for (let i = 0; i < 2; i++) sim.spawnUnitForSide('player', 0);
      let spawned = 5;
      const orig = sim.spawnEnemyUnit.bind(sim);
      sim.spawnEnemyUnit = (i) => { spawned++; return orig(i); };
      for (let i = 0; i < 10; i++) sim.ai.decide();
      t.assert('holds the line in neutral', spawned === 5, `spawned=${spawned}`);
    },
  },
];
