const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Combat',
    run(t) {
      const g = makeGame();
      g.gold = 100000;
      g.enemyGold = 100000;
      g.ai = { update() {} };
      g.spawnUnit(0);
      g.spawnEnemyUnit(0);
      const initialCount = g.units.length;
      runFrames(g, 30, 5);
      t.assert('Units died in combat', g.units.length < initialCount, `initial=${initialCount} now=${g.units.length}`);
    },
  },
  {
    name: 'Turrets & Buildings Are Damageable',
    run(t) {
      {
        const g = makeGame();
        g.ai = { update() {} };
        g.enemyGold = 100000;
        g.enemySlotsBought = 4;
        g.spawnEnemyTurret(0);
        const turret = g.turrets[0];
        g.gold = 100000;
        g.spawnUnit(0);
        const u = g.units[0];
        u.x = turret.x - 10;
        const before = turret.hp;
        runFrames(g, 2);
        t.assert('Melee unit damages enemy turret', turret.hp < before, `hp=${turret.hp} before=${before}`);
      }
      {
        const g = makeGame();
        g.ai = { update() {} };
        g.enemyGold = 100000;
        g.enemySlotsBought = 4;
        g.spawnEnemyTurret(0);
        const turret = g.turrets[0];
        const before = turret.hp;
        g.projectilePool.acquire(turret.x - 20, turret.y, turret.x, turret.y, 5, 25, 'player', 0);
        runFrames(g, 1);
        t.assert('Projectile damages enemy turret', turret.hp < before, `hp=${turret.hp} before=${before}`);
      }
      {
        const g = makeGame();
        g.ai = { update() {} };
        g.enemyGold = 100000;
        g.buyEnemyBuilding(0);
        const b = g.buildings[0];
        const before = b.hp;
        g.projectilePool.acquire(b.x - 20, b.y, b.x, b.y, 5, 25, 'player', 0);
        runFrames(g, 1);
        t.assert('Projectile damages enemy building', b.hp < before, `hp=${b.hp} before=${before}`);
      }
    },
  },
  {
    name: 'Special Attack',
    run(t) {
      const g = makeGame();
      g.specialCooldown = 0;
      g.xp = 1000;
      const cost = CONFIG.SPECIAL_XP_COST[0];
      g.useSpecial();
      t.assert('Special animation started', g.specialAnim !== null);
      t.assert('Special cooldown set', g.specialCooldown === 40);
      t.assert('Special XP deducted', g.xp === 1000 - cost, `xp=${g.xp}`);
      runFrames(g, 3);
      t.assert('Special animation finished', g.specialAnim === null);
      t.assert('Special cooldown active after use', g.specialCooldown > 0);
    },
  },
  {
    name: 'Special Damage by Age',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.currentAge = 2; // Renaissance, specialDamage 550
      g.specialCooldown = 0;
      g.xp = 10000;
      g.enemyGold = 100000;
      g.spawnEnemyUnit(0);
      const e = g.units[0];
      e.hp = 1000; e.maxHp = 1000;
      g.useSpecial();
      runFrames(g, 3);
      t.assert('Special anim cleared after duration', g.specialAnim === null);
      t.assert('Special dealt age damage', e.hp === 450, `hp=${e.hp}`);
    },
  },
  {
    name: 'Special Targets Units Only',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.enemyGold = 100000;
      g.enemySlotsBought = 4;
      g.spawnEnemyTurret(0);
      g.buyEnemyBuilding(0);
      g.spawnEnemyUnit(0);
      const turret = g.turrets[0];
      const b = g.buildings[0];
      const u = g.units.find(x => x.side === 'enemy');
      const tHp = turret.hp;
      const bHp = b.hp;
      const uHp = u.hp;
      g.xp = 10000;
      g.specialCooldown = 0;
      g.useSpecial();
      runFrames(g, 3);
      t.assert('Special damages enemy units', u.hp < uHp, `hp=${u.hp}`);
      t.assert('Special spares enemy turrets', turret.hp === tHp, `hp=${turret.hp}`);
      t.assert('Special spares enemy buildings', b.hp === bHp, `hp=${b.hp}`);
    },
  },
  {
    name: 'Difficulty Selection',
    run(t) {
      const g = makeGame();
      g.difficulty = 1;
      g.enemyGold = 100000;
      g.spawnEnemyUnit(0);
      const e = g.units[0];
      t.assert('Harder enemy has boosted HP', e.hp === Math.round(55 * 1.15), `hp=${e.hp}`);
      t.assert('Harder enemy has boosted damage', e.damage === Math.round(16 * 1.15), `dmg=${e.damage}`);

      const g2 = makeGame();
      g2.difficulty = 2;
      g2.enemyGold = 100000;
      g2.spawnEnemyUnit(0);
      const e2 = g2.units[0];
      t.assert('Impossible enemy has boosted HP', e2.hp === Math.round(55 * 1.3), `hp=${e2.hp}`);
      t.assert('Impossible enemy has boosted damage', e2.damage === Math.round(16 * 1.3), `dmg=${e2.damage}`);

      g.ai = { update() {} };
      runFrames(g, 1);
      t.assert('Difficulty default is 0', makeGame().difficulty === 0);
    },
  },
  {
    name: 'applyEnemyScaling',
    run(t) {
      const g = makeGame();
      g.difficulty = 1; // Harder 1.15x
      const fake = { hp: 100, maxHp: 0, damage: 50 };
      g.applyEnemyScaling(fake, 100, 50);
      t.assert('HP scaled by 1.15', fake.hp === 115);
      t.assert('Damage scaled by 1.15', fake.damage === 58);
      t.assert('maxHp mirrors hp', fake.maxHp === 115);
    },
  },
];
