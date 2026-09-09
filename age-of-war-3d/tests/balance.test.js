import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';

// Competent scripted blue: mine first, mass melee with upgrades, hero and
// special on cooldown, evolve when affordable. This is the winnability bar:
// this policy must beat the default (Easy) AI.
function playCompetent(sim, maxSecs = 1500, dt = 0.5) {
  let t = 0;
  while (!sim.gameOver && t < maxSecs) {
    sim.buyBuilding(0); // Gold Mine when affordable (no-op otherwise)
    sim.buyBuilding(1); // Barracks when affordable
    sim.upgradeUnit(0); // melee tiers when affordable
    sim.spawnHero('player');
    sim.useSpecial();
    sim.evolve();
    sim.spawnUnit(0);
    sim.update(dt);
    t += dt;
  }
  return t;
}

export default [
  {
    name: 'default difficulty is Easy, Normal preserved at index 1',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      t.assert('default index 0', sim.difficulty === 0, `got ${sim.difficulty}`);
      t.assert('index 0 named Easy',
        CONFIG.DIFFICULTIES[0].name === 'Easy', CONFIG.DIFFICULTIES[0].name);
      t.assert('Easy weakens enemy',
        CONFIG.DIFFICULTIES[0].enemyHpMult < 1 && CONFIG.DIFFICULTIES[0].enemyDmgMult < 1,
        JSON.stringify(CONFIG.DIFFICULTIES[0]));
      t.assert('Normal untouched at index 1',
        CONFIG.DIFFICULTIES[1].name === 'Normal'
        && CONFIG.DIFFICULTIES[1].enemyHpMult === 1.0
        && CONFIG.DIFFICULTIES[1].enemyDmgMult === 1.0,
        JSON.stringify(CONFIG.DIFFICULTIES[1]));
    },
  },
  {
    name: 'hudState exposes difficulty for the cycler button',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      const d = sim.hudState().difficulty;
      t.assert('difficulty shape', d && d.index === 0 && d.name === 'Easy'
        && d.count === CONFIG.DIFFICULTIES.length, JSON.stringify(d));
    },
  },
  {
    name: 'setDifficulty wraps around the ladder and rebuilds AI pacing',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      const n = CONFIG.DIFFICULTIES.length;
      sim.setDifficulty(n - 1);
      t.assert('set last', sim.difficulty === n - 1, `got ${sim.difficulty}`);
      const thinkBefore = sim.ai.thinkInterval;
      sim.setDifficulty(n); // wraps to 0 + restarts
      t.assert('wraps to Easy', sim.difficulty === 0, `got ${sim.difficulty}`);
      t.assert('match restarted', !sim.gameOver && sim.gameTime === 0, `t=${sim.gameTime}`);
      t.assert('AI pacing rebuilt for Easy',
        sim.ai.thinkInterval !== thinkBefore, `${thinkBefore} -> ${sim.ai.thinkInterval}`);
    },
  },
  {
    name: 'competent blue beats default (Easy) AI',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: true });
      const secs = playCompetent(sim);
      t.assert('match resolves', sim.gameOver, `no winner after ${secs}s`);
      t.assert('blue wins', sim.winner === 'player',
        `winner=${sim.winner} t=${Math.round(secs)}s ` +
        `pHP=${Math.round(sim.playerBaseHp)} eHP=${Math.round(sim.enemyBaseHp)}`);
    },
  },
];
