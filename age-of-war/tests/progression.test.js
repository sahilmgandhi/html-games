const { makeGame } = require('./harness');

module.exports = [
  {
    name: 'Evolution',
    run(t) {
      const g = makeGame();
      g.xp = 2000;
      g.evolve();
      t.assert('Evolved to age 1', g.currentAge === 1);
      t.assert('XP deducted', g.xp === 500, `xp=${g.xp}`);
      g.xp = 10000;
      g.evolve();
      t.assert('Evolved to age 2', g.currentAge === 2);
    },
  },
  {
    name: 'Evolution Heals Base',
    run(t) {
      const g = makeGame();
      g.playerBase.hp = 500;
      g.xp = 5000;
      g.evolve();
      t.assert('Base healed by EVOLVE_HEAL (25%)', g.playerBase.hp > 500, `hp=${g.playerBase.hp}`);
      t.assert('Heal amount is 250', g.playerBase.hp === 750, `hp=${g.playerBase.hp}`);
    },
  },
  {
    name: 'Unit Upgrades',
    run(t) {
      const g = makeGame();
      g.gold = 100000;
      const cost0 = g.getUnitUpgradeCost(0);
      g.upgradeUnit(0);
      t.assert('Tier incremented to 1', g.unitUpgrades[0] === 1);
      const cost1 = g.getUnitUpgradeCost(0);
      t.assert('Upgrade cost scales up', cost1 > cost0, `c0=${cost0} c1=${cost1}`);
      g.upgradeUnit(0);
      t.assert('Tier incremented to 2 (max)', g.unitUpgrades[0] === CONFIG.MAX_UPGRADE_TIER);
      g.upgradeUnit(0);
      t.assert('No upgrade past max tier', g.unitUpgrades[0] === CONFIG.MAX_UPGRADE_TIER);
    },
  },
  {
    name: 'Achievements',
    run(t) {
      const a = new Achievements();
      a.unlocked = [];
      a.unlock('test_id');
      t.assert('Unlock records id', a.isUnlocked('test_id'));
      a.unlock('test_id');
      t.assert('Unlock is idempotent', a.unlocked.filter(x => x === 'test_id').length === 1);

      const g = makeGame();
      g.gold = 60000;
      g.achievements.update(0.1, g);
      t.assert('Gold hoarder unlocks at 50k', g.achievements.isUnlocked('gold_hoarder'));
    },
  },
];
