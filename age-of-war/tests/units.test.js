const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Unit Spawning',
    run(t) {
      const g = makeGame();
      g.gold = 10000;
      g.spawnUnit(0);
      t.assert('Unit spawned', g.units.length === 1);
      t.assert('Unit is player side', g.units[0].side === 'player');
      t.assert('Unit is alive', g.units[0].alive);
      g.gold = 100000;
      for (let i = 0; i < 5; i++) g.spawnUnit(0);
      t.assert('Multiple units spawned', g.units.length === 6);
    },
  },
  {
    name: 'Unit Movement',
    run(t) {
      const g = makeGame();
      g.gold = 10000;
      g.spawnUnit(0);
      const unit = g.units[0];
      const startX = unit.x;
      runFrames(g, 2);
      t.assert('Player unit moves right', unit.x > startX, `start=${startX} now=${unit.x}`);
    },
  },
  {
    name: 'Enemy Movement',
    run(t) {
      const g = makeGame();
      g.enemyGold = 10000;
      g.spawnEnemyUnit(0);
      const enemy = g.units[0];
      const startX = enemy.x;
      runFrames(g, 2);
      t.assert('Enemy unit moves left', enemy.x < startX, `start=${startX} now=${enemy.x}`);
    },
  },
  {
    name: 'Hero Spawn & Cooldown',
    run(t) {
      const g = makeGame();
      g.gold = 100000;
      g.spawnHero('player');
      t.assert('Hero spawned', g.units.some(u => u.isHero));
      const count = g.units.length;
      g.spawnHero('player');
      t.assert('Hero blocked while cooldown active', g.units.length === count);
    },
  },
  {
    name: 'Unit HP Bar While Attacking',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 100000;
      g.enemyGold = 100000;
      g.spawnUnit(0);
      g.spawnEnemyUnit(0);
      const p = g.units[0];
      const e = g.units[1];
      p.x = 1200;
      e.x = 1215;
      p.attackSpeed = 0;
      e.attackSpeed = 999;
      e.hp = 100000;
      e.maxHp = 100000;
      p.hp = 30;
      p.displayHp = 55;
      runFrames(g, 0.5);
      t.assert('displayHp converges while attacking', p.displayHp < 50, `displayHp=${p.displayHp}`);
    },
  },
];
