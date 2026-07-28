const { makeGame, runFrames } = require('./harness');

module.exports = [
  {
    name: 'Pause',
    run(t) {
      const g = makeGame();
      g.togglePause();
      t.assert('Game pauses', g.paused === true);
      g.togglePause();
      t.assert('Game unpauses', g.paused === false);
    },
  },
  {
    name: 'Game Over',
    run(t) {
      const g = makeGame();
      g.enemyBase.hp = 0;
      g.update(0.016);
      t.assert('Game over when enemy base destroyed', g.gameOver === true);
      t.assert('Player wins', g.winner === 'player');
    },
  },
  {
    name: 'Game Speed',
    run(t) {
      const g = makeGame();
      g.gold = 1000;
      g.spawnUnit(0);
      const unit = g.units[0];
      const startX = unit.x;
      runFrames(g, 1, 3);
      const distFast = unit.x - startX;

      const g2 = makeGame();
      g2.gold = 1000;
      g2.spawnUnit(0);
      const unit2 = g2.units[0];
      const startX2 = unit2.x;
      runFrames(g2, 1, 1);
      const distSlow = unit2.x - startX2;

      t.assert('Higher speed = more distance', distFast > distSlow, `fast=${distFast} slow=${distSlow}`);
    },
  },
  {
    name: 'Game Time',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      runFrames(g, 3);
      t.assert('gameTime advances', g.gameTime > 0, `gameTime=${g.gameTime}`);
    },
  },
  {
    name: 'Restart',
    run(t) {
      const g = makeGame();
      g.gold = 5000;
      g.xp = 3000;
      g.currentAge = 2;
      g.restart();
      t.assert('Gold reset', g.gold === 200);
      t.assert('XP reset', g.xp === 0);
      t.assert('Age reset', g.currentAge === 0);
      t.assert('Units cleared', g.units.length === 0);
      t.assert('Turrets cleared', g.turrets.length === 0);
    },
  },
  {
    name: 'Restart Restores Bases',
    run(t) {
      const g = makeGame();
      g.difficulty = 2;
      g.playerBase.hp = 0;
      g.update(1 / 60);
      t.assert('Defeat triggers when player base falls', g.gameOver === true && g.winner === 'enemy');
      g.restart();
      t.assert('Restart restores player base HP', g.playerBase.hp === CONFIG.BASE_HP, `hp=${g.playerBase.hp}`);
      t.assert('Restart restores enemy base HP', g.enemyBase.hp === CONFIG.BASE_HP);
      t.assert('Restart restores displayHp', g.playerBase.displayHp === CONFIG.BASE_HP);
      t.assert('Restart clears gameOver', g.gameOver === false && g.winner === null);
      t.assert('Restart preserves difficulty', g.difficulty === 2, `difficulty=${g.difficulty}`);
      g.ai = { update() {} };
      g.update(1 / 60);
      t.assert('Restart does not immediately re-trigger game over', g.gameOver === false);
    },
  },
  {
    name: 'Save / Load',
    run(t) {
      const g = makeGame();
      g.gold = 4321;
      g.xp = 765;
      g.playerBase.hp = 400;
      g.enemyBase.hp = 600;
      g.saveGame(9);
      const g2 = makeGame();
      g2.loadGame(9);
      t.assert('Loaded gold', g2.gold === 4321, `gold=${g2.gold}`);
      t.assert('Loaded player base HP', g2.playerBase.hp === 400);
      t.assert('Load keeps player maxHp at BASE_HP', g2.playerBase.maxHp === CONFIG.BASE_HP, `maxHp=${g2.playerBase.maxHp}`);
      t.assert('Load keeps enemy maxHp at BASE_HP', g2.enemyBase.maxHp === CONFIG.BASE_HP, `maxHp=${g2.enemyBase.maxHp}`);
      t.assert('Load syncs displayHp to loaded HP', g2.playerBase.displayHp === 400, `displayHp=${g2.playerBase.displayHp}`);
    },
  },
  {
    name: 'Pause Preserves Audio Settings',
    run(t) {
      const g = makeGame();
      g.audio.musicEnabled = true;
      g.audio.sfxEnabled = true;
      g.togglePause();
      t.assert('Audio is suspended while paused', g.audio.suspended === true);
      t.assert('Music preference survives pause', g.audio.musicEnabled === true);
      t.assert('SFX preference survives pause', g.audio.sfxEnabled === true);

      const cx = CONFIG.VIEWPORT.WIDTH / 2;
      const panelY = CONFIG.VIEWPORT.HEIGHT / 2 - 180;
      g.input.mouseX = cx;
      g.input.mouseY = panelY + 110 + 10;
      g.handlePauseClick();
      t.assert('Pause menu toggles SFX off', g.audio.sfxEnabled === false);

      g.togglePause();
      t.assert('Audio resumes on unpause', g.audio.suspended === false);
      t.assert('Pause-menu SFX toggle survives resume', g.audio.sfxEnabled === false);
      t.assert('Music preference survives resume', g.audio.musicEnabled === true);
    },
  },
];
