import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';

// Every unit type must be able to damage the enemy base on an empty lane.
// Repro for: some units never scratch the enemy castle.
export default [
  {
    name: 'every unit type of every age damages the enemy base solo',
    run(t) {
      for (let age = 0; age < 5; age++) {
        for (let i = 0; i < CONFIG.AGES[age].units.length; i++) {
          const sim = new BattleSim({ seed: 11, autoAI: false });
          sim.gold = 1e6;
          sim.xp = 1e6;
          for (let e = 0; e < age; e++) sim.evolveSide('player');
          sim.enemyAge = age;
          const u = sim.spawnUnit(i);
          if (!u) {
            t.assert(`age ${age} unit ${i} spawns`, false, 'spawn returned null');
            continue;
          }
          // Start mid-lane so even siege pace reaches the base in-window.
          u.x = sim.enemyBase.x - 500;
          const hp0 = sim.enemyBase.hp;
          for (let f = 0; f < 3600; f++) sim.update(1 / 60);
          const dealt = hp0 - sim.enemyBase.hp;
          t.assert(`age ${age} unit ${i} damaged the base`, dealt > 0, `dealt=${dealt}`);
        }
      }
    },
  },
];
