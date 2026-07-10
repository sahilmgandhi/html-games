#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.document = {
  getElementById() { return this.createElement('canvas'); },
  createElement(tag) {
    if (tag === 'canvas') {
      return {
        width: 1200, height: 600, style: {},
        addEventListener() {},
        getContext() {
          return {
            fillStyle: '', strokeStyle: '', lineWidth: 1,
            lineCap: 'butt', lineJoin: 'miter', miterLimit: 10,
            shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
            globalAlpha: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
            save() {}, restore() {}, beginPath() {}, closePath() {},
            moveTo() {}, lineTo() {}, fill() {}, stroke() {},
            arc() {}, ellipse() {}, fillRect() {}, strokeRect() {}, clearRect() {},
            fillText() {}, strokeText() {},
            measureText(t) { return { width: t.length * 6 }; },
            createLinearGradient() { return { addColorStop() {} }; },
            setLineDash() {}, translate() {}, rotate() {}, scale() {}, drawImage() {},
          };
        },
      };
    }
    return {};
  },
  addEventListener() {},
};

global.window = { addEventListener() {}, AudioContext: null, webkitAudioContext: null };
global.performance = { now: () => Date.now() };

const jsDir = path.join(__dirname, 'js');
const files = [
  'config.js', 'utils.js', 'sprites.js', 'entities.js', 'renderer.js',
  'input.js', 'ai.js', 'particles.js', 'audio.js', 'minimap.js', 'balance.js', 'game.js',
];

for (const f of files) {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  try {
    vm.runInThisContext(code, { filename: f });
  } catch (e) {
    console.error(`Error loading ${f}:`, e.message);
  }
}

let allResults = [];

function assert(name, condition, detail = '') {
  const pass = !!condition;
  allResults.push({ name, pass, detail });
  if (!pass) console.log(`  FAIL: ${name}${detail ? ' -- ' + detail : ''}`);
}

function makeGame() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const game = new Game(canvas, ctx);
  game.audio.initialized = true;
  game.audio.ctx = null;
  game.ai = new AI(game);
  game.started = true;
  return game;
}

function runFrames(game, seconds, speed = 1) {
  const dt = 1 / 60;
  const frames = Math.ceil(seconds * 60);
  for (let i = 0; i < frames; i++) {
    game.update(dt * speed);
  }
}

function runTests() {
  allResults = [];
  console.log('=== Age of War Headless Tests ===\n');

  console.log('--- Passive Income (Player Only) ---');
  {
    const g = makeGame();
    const startGold = g.gold;
    const startXp = g.xp;
    runFrames(g, 10);
    assert('Player gold increases', g.gold > startGold, `start=${startGold} now=${Math.floor(g.gold)}`);
    assert('Player XP increases', g.xp > startXp, `start=${startXp} now=${Math.floor(g.xp)}`);
  }

  console.log('\n--- BASE_HP ---');
  {
    const g = makeGame();
    assert('Player base HP is 5000', g.playerBase.maxHp === 5000);
    assert('Enemy base HP is 5000', g.enemyBase.maxHp === 5000);
  }

  console.log('\n--- Unit Spawning ---');
  {
    const g = makeGame();
    g.gold = 10000;
    g.spawnUnit(0);
    assert('Unit spawned', g.units.length === 1);
    assert('Unit is player side', g.units[0].side === 'player');
    assert('Unit is alive', g.units[0].alive);
    g.gold = 100000;
    for (let i = 0; i < 5; i++) g.spawnUnit(0);
    assert('Multiple units spawned', g.units.length === 6);
  }

  console.log('\n--- Unit Movement ---');
  {
    const g = makeGame();
    g.gold = 10000;
    g.spawnUnit(0);
    const unit = g.units[0];
    const startX = unit.x;
    runFrames(g, 2);
    assert('Player unit moves right', unit.x > startX, `start=${startX} now=${unit.x}`);
  }

  console.log('\n--- Enemy Movement ---');
  {
    const g = makeGame();
    g.enemyGold = 10000;
    g.spawnEnemyUnit(0);
    const enemy = g.units[0];
    const startX = enemy.x;
    runFrames(g, 2);
    assert('Enemy unit moves left', enemy.x < startX, `start=${startX} now=${enemy.x}`);
  }

  console.log('\n--- Turret Indestructibility ---');
  {
    const g = makeGame();
    g.gold = 10000;
    g.playerSlotsBought = 4;
    g.spawnTurret(0);
    assert('Turret spawned', g.turrets.length === 1);
    assert('Turret has no hp property', g.turrets[0].hp === undefined);
    assert('Turret has no takeDamage', typeof g.turrets[0].takeDamage === 'undefined');
  }

  console.log('\n--- Evolution ---');
  {
    const g = makeGame();
    g.xp = 5000;
    g.evolve();
    assert('Evolved to age 1', g.currentAge === 1);
    assert('XP deducted', g.xp === 1000, `xp=${g.xp}`);
    g.xp = 20000;
    g.evolve();
    assert('Evolved to age 2', g.currentAge === 2);
  }

  console.log('\n--- Special Attack ---');
  {
    const g = makeGame();
    g.specialCooldown = 0;
    g.useSpecial();
    assert('Special animation started', g.specialAnim !== null);
    assert('Special cooldown set', g.specialCooldown === 40);
    runFrames(g, 3);
    assert('Special animation finished', g.specialAnim === null);
    assert('Special cooldown active after use', g.specialCooldown > 0);
  }

  console.log('\n--- Pause ---');
  {
    const g = makeGame();
    g.togglePause();
    assert('Game pauses', g.paused === true);
    g.togglePause();
    assert('Game unpauses', g.paused === false);
  }

  console.log('\n--- Game Over ---');
  {
    const g = makeGame();
    g.enemyBase.hp = 0;
    g.update(0.016);
    assert('Game over when enemy base destroyed', g.gameOver === true);
    assert('Player wins', g.winner === 'player');
  }

  console.log('\n--- Turret Slots ---');
  {
    const g = makeGame();
    g.gold = 1000;
    g.buySlot();
    assert('Slot purchased', g.playerSlotsBought === 1);
    g.spawnTurret(0);
    assert('Turret placed in slot', g.turrets.length === 1);
  }

  console.log('\n--- Sell Turret ---');
  {
    const g = makeGame();
    g.gold = 1000;
    g.playerSlotsBought = 4;
    g.spawnTurret(0);
    const goldBefore = g.gold;
    g.sellTurret(0);
    assert('Turret marked dead', g.turrets[0].alive === false);
    assert('Refund received', g.gold > goldBefore, `before=${goldBefore} now=${g.gold}`);
  }

  console.log('\n--- Game Speed ---');
  {
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

    assert('Higher speed = more distance', distFast > distSlow, `fast=${distFast} slow=${distSlow}`);
  }

  console.log('\n--- Restart ---');
  {
    const g = makeGame();
    g.gold = 5000;
    g.xp = 3000;
    g.currentAge = 2;
    g.restart();
    assert('Gold reset', g.gold === 200);
    assert('XP reset', g.xp === 0);
    assert('Age reset', g.currentAge === 0);
    assert('Units cleared', g.units.length === 0);
    assert('Turrets cleared', g.turrets.length === 0);
  }

  console.log('\n--- Combat ---');
  {
    const g = makeGame();
    g.gold = 100000;
    g.enemyGold = 100000;
    g.ai = { update() {} };
    g.spawnUnit(0);
    g.spawnEnemyUnit(0);
    const initialCount = g.units.length;
    runFrames(g, 30, 5);
    assert('Units died in combat', g.units.length < initialCount, `initial=${initialCount} now=${g.units.length}`);
  }

  console.log('\n--- Balance Tracker ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    runFrames(g, 5);
    assert('Timeline has snapshots', balanceTracker.timeline.length > 0);
    const snap = balanceTracker.timeline[0];
    assert('Snapshot has time field', typeof snap.time === 'number');
    assert('Snapshot has playerGold', typeof snap.playerGold === 'number');
    assert('Snapshot has playerDps', typeof snap.playerDps === 'number');
    const csv = balanceTracker.toCSV();
    assert('CSV export works', csv.includes('time,playerAge'));
    const json = balanceTracker.toJSON();
    assert('JSON export works', json.includes('"time"'));
    balanceTracker.reset();
    assert('Reset clears timeline', balanceTracker.timeline.length === 0);
  }

  console.log('\n--- Game Time ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    runFrames(g, 3);
    assert('gameTime advances', g.gameTime > 0, `gameTime=${g.gameTime}`);
  }

  const passed = allResults.filter(r => r.pass).length;
  const failed = allResults.filter(r => !r.pass).length;
  console.log(`\n  ${passed} passed, ${failed} failed, ${allResults.length} total`);
  if (failed > 0) process.exit(1);
}

runTests();
