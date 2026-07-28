const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'AI Waves',
    run(t) {
      const g = makeGame();
      g.enemyGold = 100000;
      g.ai = new AI(g);
      runFrames(g, 15);
      t.assert('AI spawns enemy units over time', g.units.some(u => u.side === 'enemy'));
    },
  },
];
