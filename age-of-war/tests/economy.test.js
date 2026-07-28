const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Passive Income',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      const startGold = g.gold;
      const startEnemyGold = g.enemyGold;
      runFrames(g, 10);
      t.assert('Player gold increases over time', g.gold > startGold, `start=${startGold} now=${Math.floor(g.gold)}`);
      t.assert('Enemy gold increases over time', g.enemyGold > startEnemyGold);
    },
  },
  {
    name: 'BASE_HP',
    run(t) {
      const g = makeGame();
      t.assert('Player base HP is 1000', g.playerBase.maxHp === 1000);
      t.assert('Enemy base HP is 1000', g.enemyBase.maxHp === 1000);
    },
  },
  {
    name: 'Kill Reward',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 0;
      g.enemyGold = 10000;
      g.spawnEnemyUnit(0);
      const enemy = g.units[0];
      enemy.hp = 0;
      enemy.alive = false;
      runFrames(g, 0.1);
      t.assert('Player gets gold from kill', g.gold > 0, `gold=${Math.floor(g.gold)}`);
    },
  },
];
