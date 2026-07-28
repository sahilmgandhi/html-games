const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Buildings: Gold Mine Income',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 1000;
      g.buyBuilding(0); // Gold Mine
      t.assert('Building placed', g.buildings.length === 1);
      const before = g.gold;
      runFrames(g, 5);
      t.assert('Gold mine produces gold', g.gold > before, `before=${before} now=${g.gold}`);
    },
  },
  {
    name: 'Buildings: Barracks Heal',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 100000;
      g.spawnUnit(0);
      const u = g.units[0];
      u.hp = 10;
      g.buyBuilding(1); // Barracks (heal 2/s radius 80)
      runFrames(g, 3);
      t.assert('Barracks heals nearby units', u.hp > 10, `hp=${u.hp.toFixed(1)}`);
    },
  },
  {
    name: 'Building Cap & Placement',
    run(t) {
      const g = makeGame();
      g.gold = 1000000;
      for (let i = 0; i < 10; i++) g.buyBuilding(i % CONFIG.BUILDINGS.length);
      t.assert('Player buildings capped at MAX_BUILDINGS', g.getBuildingCount('player') === CONFIG.MAX_BUILDINGS,
        `count=${g.getBuildingCount('player')}`);
      const goldBefore = g.gold;
      g.buyBuilding(0);
      t.assert('Capped purchase is free of charge', g.gold === goldBefore);

      g.enemyGold = 1000000;
      for (let i = 0; i < 10; i++) g.buyEnemyBuilding(i % CONFIG.BUILDINGS.length);
      t.assert('Enemy buildings capped at MAX_BUILDINGS', g.getBuildingCount('enemy') === CONFIG.MAX_BUILDINGS,
        `count=${g.getBuildingCount('enemy')}`);

      const xs = g.buildings.filter(b => b.side === 'player').map(b => b.x);
      t.assert('Buildings do not stack', new Set(xs).size === xs.length, xs.join(','));
      const turretX = g.turretSlotPositions[0].x;
      t.assert('Buildings sit clear of the turret column', xs.every(x => Math.abs(x - turretX) >= 40), xs.join(','));
    },
  },
];
