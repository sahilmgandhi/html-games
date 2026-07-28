const { makeGame, runFrames, makeAudioContext } = require('./harness');

module.exports = [
  {
    name: 'Balance Tracker',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      runFrames(g, 5);
      t.assert('Timeline has snapshots', balanceTracker.timeline.length > 0);
      const snap = balanceTracker.timeline[0];
      t.assert('Snapshot has time field', typeof snap.time === 'number');
      t.assert('Snapshot has playerGold', typeof snap.playerGold === 'number');
      t.assert('Snapshot has playerDps', typeof snap.playerDps === 'number');
      const csv = balanceTracker.toCSV();
      t.assert('CSV export works', csv.includes('time,playerAge'));
      const json = balanceTracker.toJSON();
      t.assert('JSON export works', json.includes('"time"'));
      balanceTracker.reset();
      t.assert('Reset clears timeline', balanceTracker.timeline.length === 0);
    },
  },
  {
    name: 'Injected Collaborators',
    run(t) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const audio = new AudioManager();
      const achievements = new Achievements();
      const g = new Game(canvas, ctx, audio, achievements);
      t.assert('Game uses injected AudioManager', g.audio === audio);
      t.assert('Game uses injected Achievements', g.achievements === achievements);
      const g2 = new Game(canvas, ctx);
      t.assert('Game builds its own collaborators when none passed',
        g2.audio instanceof AudioManager && g2.achievements instanceof Achievements);
    },
  },
  {
    name: 'SFX Throttling',
    run(t) {
      const a = new AudioManager();
      a.initialized = true;
      a.ctx = makeAudioContext();
      t.assert('First hit plays', a.play('hit') === true);
      t.assert('Repeat hit within interval is throttled', a.play('hit') === false);
      a.ctx.currentTime = 1;
      t.assert('Hit plays again after the interval', a.play('hit') === true);
      t.assert('Untracked types are never throttled', a.play('evolve') === true && a.play('evolve') === true);
      a.suspended = true;
      t.assert('Suspended audio plays nothing', a.play('spawn') === false);
    },
  },
];
