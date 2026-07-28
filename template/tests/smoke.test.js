const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Startup',
    run(t) {
      const g = makeGame();
      t.assert('Starts with no score', g.score === 0);
      t.assert('Starts with a full clock', g.timeLeft === CONFIG.TIME_LIMIT);
      t.assert('Starts with a target on the board', g.targets.length > 0);
      t.assert('Does not start over', g.gameOver === false);
    },
  },
  {
    name: 'Movement',
    run(t) {
      const g = makeGame();
      const startX = g.player.x;
      g.aimAt(CONFIG.VIEWPORT.WIDTH - 1, g.player.y);
      runFrames(g, 0.5);
      t.assert('Player moves toward the aim point', g.player.x > startX, `start=${startX} now=${g.player.x}`);
    },
  },
  {
    name: 'Scoring',
    run(t) {
      const g = makeGame();
      const target = g.targets[0];
      g.player.x = target.x;
      g.player.y = target.y;
      g.aimAt(target.x, target.y);
      runFrames(g, 1 / 60);
      t.assert('Overlapping a target scores', g.score === 1, `score=${g.score}`);
      t.assert('A replacement target spawns', g.targets.length === 1);
    },
  },
  {
    name: 'Win and Lose',
    run(t) {
      const g = makeGame();
      for (let i = 0; i < CONFIG.TARGETS_TO_WIN; i++) {
        const target = g.targets[0];
        g.player.x = target.x;
        g.player.y = target.y;
        runFrames(g, 1 / 60);
      }
      t.assert('Reaching the target count wins', g.gameOver === true && g.won === true, `score=${g.score}`);

      const g2 = makeGame();
      runFrames(g2, CONFIG.TIME_LIMIT + 1);
      t.assert('Running out of time loses', g2.gameOver === true && g2.won === false);
      t.assert('Clock does not go negative', g2.timeLeft === 0, `timeLeft=${g2.timeLeft}`);

      g2.restart();
      t.assert('Restart clears game over', g2.gameOver === false && g2.score === 0);
    },
  },
  {
    name: 'Render',
    run(t) {
      const g = makeGame();
      let ok = true;
      try {
        g.render();
        g.gameOver = true;
        g.render();
      } catch (e) { ok = false; console.log('  draw error:', e.message); }
      t.assert('Rendering runs without throwing', ok);
    },
  },
];
