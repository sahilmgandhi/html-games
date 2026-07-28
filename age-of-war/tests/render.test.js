const { makeGame, runFrames } = require('./harness');

// Renderer is one class assembled from js/renderer/*.js by prototype augmentation, so a
// method dropped or misplaced during a split shows up as a missing function, not a syntax
// error. Drive the real render path through every module to catch that.
function tryDraw(t, label, fn) {
  try {
    fn();
    t.assert(label, true);
  } catch (e) {
    t.assert(label, false, e.message);
  }
}

module.exports = [
  {
    name: 'Full Render Path',
    run(t) {
      const g = makeGame();
      g.ai = { update() {} };
      g.gold = 1000000;
      g.xp = 1000000;
      g.playerSlotsBought = CONFIG.TURRET_SLOTS;
      g.enemySlotsBought = CONFIG.TURRET_SLOTS;
      g.spawnUnit(0);
      g.spawnEnemyUnit(1);
      g.spawnHero('player');
      g.spawnTurret(0);
      g.spawnEnemyTurret(1);
      g.buyBuilding(0);
      g.buyEnemyBuilding(1);
      g.specialCooldown = 0;
      g.useSpecial();
      runFrames(g, 0.2);

      tryDraw(t, 'Renders a fully populated board', () => g.render());
      tryDraw(t, 'Renders every age', () => {
        for (let a = 0; a < CONFIG.AGES.length; a++) {
          g.currentAge = a;
          g.enemyAge = a;
          g.render();
        }
      });
      tryDraw(t, 'Renders the age crossfade', () => {
        g.renderer.startAgeTransition(0, 1);
        g.renderer.updateCrossfade(0.1);
        g.render();
      });

      g.currentAge = 0;
      g.enemyAge = 0;
      for (const [label, mutate] of [
        ['pause screen', (x) => { x.paused = true; }],
        ['password prompt', (x) => { x.paused = false; x.debugPasswordOpen = true; }],
        ['debug panel', (x) => { x.debugPasswordOpen = false; x.debugOpen = true; }],
        ['game over overlay', (x) => { x.debugOpen = false; x.gameOver = true; x.winner = 'player'; }],
      ]) {
        mutate(g);
        tryDraw(t, `Renders the ${label}`, () => g.render());
      }
    },
  },
  {
    name: 'Renderer Draw All Ages',
    run(t) {
      const g = makeGame();
      let ok = true;
      try {
        for (let a = 0; a < 5; a++) {
          g.currentAge = a;
          g.renderer.drawHUD(g);
          for (let i = 0; i < CONFIG.AGES[a].units.length; i++) {
            g.renderer.drawUnit(new Unit(500, 450, 'player', a, i, 0, false), a);
          }
          for (let ti = 0; ti < CONFIG.AGES[a].turrets.length; ti++) {
            g.renderer.drawTurret(new Turret(500, 450, 'player', a, ti), a, ti);
          }
          g.renderer.drawBuilding(new Building(500, 430, 'player', 0), a);
        }
        g.renderer.roundRect(g.renderer.ctx, 0, 0, 10, 10, 3);
      } catch (e) { ok = false; console.log('  draw error:', e.message); }
      t.assert('All age rendering runs without throwing', ok);
    },
  },
  {
    name: 'SpriteManager',
    run(t) {
      const sm = new SpriteManager();
      const ctx2 = document.createElement('canvas').getContext('2d');
      const types = ['melee', 'ranged', 'fast', 'siege', 'armored', 'elite', 'hero'];
      let ok = true;
      try {
        for (let a = 0; a < 5; a++) {
          for (const type of types) sm.draw(ctx2, type, a, 100, 300, 1, 'player');
        }
      } catch (e) { ok = false; console.log('  sprite error:', e.message); }
      t.assert('SpriteManager draws all ages/types', ok && sm.cache.size > 0, `cache=${sm.cache.size}`);
    },
  },
  {
    name: 'Sprite Fallback Upgrade',
    run(t) {
      const sm = new SpriteManager();
      const ctx2 = document.createElement('canvas').getContext('2d');
      const img = { _loaded: false, width: 96, height: 96 };
      sm.images.set('melee_0', img);
      sm.draw(ctx2, 'melee', 0, 100, 300, 1, 'player');
      const key = sm.getKey('melee', 0, 'player');
      const fallbackCanvas = sm.cache.get(key).canvas;
      t.assert('Pre-load draw is flagged as fallback', sm.cache.get(key).fallback === true);
      img._loaded = true;
      sm.draw(ctx2, 'melee', 0, 100, 300, 1, 'player');
      t.assert('Cache re-renders once the PNG loads', sm.cache.get(key).canvas !== fallbackCanvas);
      t.assert('Upgraded entry is no longer a fallback', !sm.cache.get(key).fallback);
      const pngCanvas = sm.cache.get(key).canvas;
      sm.draw(ctx2, 'melee', 0, 100, 300, 1, 'player');
      t.assert('Loaded sprite is cached, not re-rendered', sm.cache.get(key).canvas === pngCanvas);
    },
  },
  {
    name: 'Particles & Minimap',
    run(t) {
      const g = makeGame();
      let ok = true;
      try {
        g.particles.emitDamageNumber(100, 100, 50, '#fff');
        g.particles.emitGoldNumber(100, 100, 30);
        g.particles.update(0.1);
        g.particles.draw(g.renderer.ctx, g.renderer);
        new Minimap().draw(g.renderer.ctx, g.units, g.turrets, [g.playerBase, g.enemyBase], 0, g.buildings);
      } catch (e) { ok = false; console.log('  fx error:', e.message); }
      t.assert('Particles and minimap render without throwing', ok);
    },
  },
];
