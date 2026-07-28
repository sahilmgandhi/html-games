const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Turret Destructibility',
    run(t) {
      const g = makeGame();
      g.gold = 10000;
      g.playerSlotsBought = 4;
      g.spawnTurret(0);
      t.assert('Turret spawned', g.turrets.length === 1);
      t.assert('Turret has hp', typeof g.turrets[0].hp === 'number');
      t.assert('Turret has maxHp', g.turrets[0].maxHp === g.turrets[0].hp);
      const hpBefore = g.turrets[0].hp;
      g.turrets[0].takeDamage(10);
      t.assert('Turret takes damage', g.turrets[0].hp === hpBefore - 10);
      t.assert('Turret has hitFlash', g.turrets[0].hitFlash > 0);
      g.turrets[0].takeDamage(hpBefore);
      t.assert('Turret dies at 0 hp', g.turrets[0].alive === false);
    },
  },
  {
    name: 'Turret Slots',
    run(t) {
      const g = makeGame();
      g.gold = 1000;
      t.assert('Starts with 1 free turret slot', g.playerSlotsBought === 1);
      g.spawnTurret(0);
      t.assert('Turret placed in slot', g.turrets.length === 1);
      g.buySlot();
      t.assert('Additional slot purchased', g.playerSlotsBought === 2);
    },
  },
  {
    name: 'Sell Turret',
    run(t) {
      const g = makeGame();
      g.gold = 1000;
      g.playerSlotsBought = 4;
      g.spawnTurret(0);
      const goldBefore = g.gold;
      g.sellTurret(0);
      t.assert('Turret marked dead', g.turrets[0].alive === false);
      t.assert('Refund received', g.gold > goldBefore, `before=${goldBefore} now=${g.gold}`);
    },
  },
  {
    name: 'Turret Stats & Slot Cap',
    run(t) {
      const g = makeGame();
      g.gold = 100000;
      g.playerSlotsBought = 4;
      g.currentAge = 0;
      g.spawnTurret(2); // Primit. Catapult
      const turret = g.turrets[g.turrets.length - 1];
      const data = CONFIG.AGES[0].turrets[2];
      t.assert('Turret damage matches config', turret.damage === data.damage);
      t.assert('Turret hp matches config', turret.hp === data.hp);
      t.assert('Turret stores turretIndex', turret.turretIndex === 2);

      for (let i = 0; i < 5; i++) g.spawnTurret(0);
      t.assert('Cannot exceed TURRET_SLOTS', g.turrets.filter(tt => tt.side === 'player').length === 4);
    },
  },
  {
    name: 'Sell Turret Refund',
    run(t) {
      const g = makeGame();
      g.gold = 2000;
      g.playerSlotsBought = 4;
      g.spawnTurret(0); // cost 100 at age 0
      const cost = g.turrets[0].cost;
      const before = g.gold;
      g.sellTurret(0);
      t.assert('Refund = floor(cost * 0.5)', g.gold === before + Math.floor(cost * 0.5), `refund=${g.gold - before}`);
    },
  },
  {
    name: 'Turret Slot Reuse',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 100000;
      g.playerSlotsBought = 3;
      for (let i = 0; i < 3; i++) g.spawnTurret(0);
      t.assert('Three turrets in three slots', new Set(g.turrets.map(x => x.y)).size === 3, g.turrets.map(x => x.y).join(','));
      g.turrets[1].alive = false;
      runFrames(g, 0.05);
      t.assert('Destroyed turret is pruned', g.turrets.length === 2);
      g.spawnTurret(0);
      const live = g.turrets.filter(x => x.side === 'player' && x.alive);
      t.assert('Rebuild fills the freed slot', live.length === 3, `count=${live.length}`);
      const positions = live.map(x => `${x.x},${x.y}`);
      t.assert('No two live turrets share a position', new Set(positions).size === 3, positions.join(' '));

      g.turrets.find(x => x.slotIndex === 2).alive = false;
      runFrames(g, 0.05);
      t.assert('Base tower spans the highest occupied slot, not the count',
        g.occupiedSlotRows('player') === 2, `rows=${g.occupiedSlotRows('player')}`);
      g.turrets.find(x => x.slotIndex === 0).alive = false;
      runFrames(g, 0.05);
      t.assert('Base tower still reaches a turret left in a high slot',
        g.occupiedSlotRows('player') === 2, `rows=${g.occupiedSlotRows('player')}`);
    },
  },
  {
    name: 'Enemy Turret Difficulty Scaling',
    run(t) {
      const g = makeGame();
      g.difficulty = 2;
      g.enemyGold = 100000;
      g.enemySlotsBought = 4;
      g.spawnEnemyTurret(0);
      const data = CONFIG.AGES[0].turrets[0];
      const turret = g.turrets[0];
      const mult = CONFIG.DIFFICULTIES[2].enemyDmgMult;
      t.assert('Enemy turret HP is difficulty-scaled', turret.hp === Math.round(data.hp * CONFIG.DIFFICULTIES[2].enemyHpMult), `hp=${turret.hp}`);
      t.assert('Enemy turret damage is difficulty-scaled', turret.damage === Math.round(data.damage * mult), `dmg=${turret.damage}`);
    },
  },
];
