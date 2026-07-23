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
            save() {}, restore() {},             beginPath() {}, closePath() {}, clip() {},
            moveTo() {}, lineTo() {}, arcTo() {}, quadraticCurveTo() {}, rect() {}, fill() {}, stroke() {},
            arc() {}, ellipse() {}, fillRect() {}, strokeRect() {}, clearRect() {},
            fillText() {}, strokeText() {},
            measureText(t) { return { width: t.length * 6 }; },
            createLinearGradient() { return { addColorStop() {} }; },
            createRadialGradient() { return { addColorStop() {} }; },
            arcTo() {}, quadraticCurveTo() {}, clip() {}, rect() {},
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
  'input.js', 'ai.js', 'particles.js', 'audio.js', 'minimap.js', 'achievements.js', 'balance.js', 'game.js',
];

for (const f of files) {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  try {
    vm.runInThisContext(code, { filename: f });
  } catch (e) {
    console.error(`Error loading ${f}:`, e.message);
  }
}

global.spriteManager = new SpriteManager();

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

  console.log('--- Passive Income ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    const startGold = g.gold;
    const startEnemyGold = g.enemyGold;
    runFrames(g, 10);
    assert('Player gold increases over time', g.gold > startGold, `start=${startGold} now=${Math.floor(g.gold)}`);
    assert('Enemy gold increases over time', g.enemyGold > startEnemyGold);
  }

  console.log('\n--- BASE_HP ---');
  {
    const g = makeGame();
    assert('Player base HP is 1000', g.playerBase.maxHp === 1000);
    assert('Enemy base HP is 1000', g.enemyBase.maxHp === 1000);
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

  console.log('\n--- Turret Destructibility ---');
  {
    const g = makeGame();
    g.gold = 10000;
    g.playerSlotsBought = 4;
    g.spawnTurret(0);
    assert('Turret spawned', g.turrets.length === 1);
    assert('Turret has hp', typeof g.turrets[0].hp === 'number');
    assert('Turret has maxHp', g.turrets[0].maxHp === g.turrets[0].hp);
    const hpBefore = g.turrets[0].hp;
    g.turrets[0].takeDamage(10);
    assert('Turret takes damage', g.turrets[0].hp === hpBefore - 10);
    assert('Turret has hitFlash', g.turrets[0].hitFlash > 0);
    g.turrets[0].takeDamage(hpBefore);
    assert('Turret dies at 0 hp', g.turrets[0].alive === false);
  }

  console.log('\n--- Evolution ---');
  {
    const g = makeGame();
    g.xp = 2000;
    g.evolve();
    assert('Evolved to age 1', g.currentAge === 1);
    assert('XP deducted', g.xp === 500, `xp=${g.xp}`);
    g.xp = 10000;
    g.evolve();
    assert('Evolved to age 2', g.currentAge === 2);
  }

  console.log('\n--- Special Attack ---');
  {
    const g = makeGame();
    g.specialCooldown = 0;
    g.xp = 1000;
    const cost = CONFIG.SPECIAL_XP_COST[0];
    g.useSpecial();
    assert('Special animation started', g.specialAnim !== null);
    assert('Special cooldown set', g.specialCooldown === 40);
    assert('Special XP deducted', g.xp === 1000 - cost, `xp=${g.xp}`);
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
    assert('Starts with 1 free turret slot', g.playerSlotsBought === 1);
    g.spawnTurret(0);
    assert('Turret placed in slot', g.turrets.length === 1);
    g.buySlot();
    assert('Additional slot purchased', g.playerSlotsBought === 2);
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

  console.log('\n--- Difficulty Selection ---');
  {
    const g = makeGame();
    g.difficulty = 1;
    g.enemyGold = 100000;
    g.spawnEnemyUnit(0);
    const e = g.units[0];
    assert('Harder enemy has boosted HP', e.hp === Math.round(55 * 1.15), `hp=${e.hp}`);
    assert('Harder enemy has boosted damage', e.damage === Math.round(16 * 1.15), `dmg=${e.damage}`);

    const g2 = makeGame();
    g2.difficulty = 2;
    g2.enemyGold = 100000;
    g2.spawnEnemyUnit(0);
    const e2 = g2.units[0];
    assert('Impossible enemy has boosted HP', e2.hp === Math.round(55 * 1.3), `hp=${e2.hp}`);
    assert('Impossible enemy has boosted damage', e2.damage === Math.round(16 * 1.3), `dmg=${e2.damage}`);

    g.ai = { update() {} };
    runFrames(g, 1);
    assert('Difficulty default is 0', makeGame().difficulty === 0);
  }

  console.log('\n--- Kill Reward ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    g.gold = 0;
    g.enemyGold = 10000;
    g.spawnEnemyUnit(0);
    const enemy = g.units[0];
    enemy.hp = 0;
    enemy.alive = false;
    runFrames(g, 0.1);
    assert('Player gets gold from kill', g.gold > 0, `gold=${Math.floor(g.gold)}`);
  }

  console.log('\n--- Game Time ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    runFrames(g, 3);
    assert('gameTime advances', g.gameTime > 0, `gameTime=${g.gameTime}`);
  }

  console.log('\n--- CONFIG Invariants ---');
  {
    assert('5 ages defined', CONFIG.AGES.length === 5);
    assert('EVOLVE_XP has 5 entries', CONFIG.EVOLVE_XP.length === 5);
    assert('TURRET_SLOTS is 4', CONFIG.TURRET_SLOTS === 4);
    assert('TURRET_REFUND_RATE is 0.5', CONFIG.TURRET_REFUND_RATE === 0.5);
    assert('SPECIAL_COOLDOWN is 40', CONFIG.SPECIAL_COOLDOWN === 40);
    assert('HUD_HEIGHT is 145', CONFIG.HUD_HEIGHT === 145);
    assert('Each age has 3 turrets', CONFIG.AGES.every(a => a.turrets.length === 3));
    assert('Special damage scales 250->1000', CONFIG.AGES.map(a => a.specialDamage).join(',') === '250,400,550,700,1000');
  }

  console.log('\n--- Evolution Heals Base ---');
  {
    const g = makeGame();
    g.playerBase.hp = 500;
    g.xp = 5000;
    g.evolve();
    assert('Base healed by EVOLVE_HEAL (25%)', g.playerBase.hp > 500, `hp=${g.playerBase.hp}`);
    assert('Heal amount is 250', g.playerBase.hp === 750, `hp=${g.playerBase.hp}`);
  }

  console.log('\n--- Special Damage by Age ---');
  {
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
    assert('Special anim cleared after duration', g.specialAnim === null);
    assert('Special dealt age damage', e.hp === 450, `hp=${e.hp}`);
  }

  console.log('\n--- Turret Stats & Slot Cap ---');
  {
    const g = makeGame();
    g.gold = 100000;
    g.playerSlotsBought = 4;
    g.currentAge = 0;
    g.spawnTurret(2); // Primit. Catapult
    const t = g.turrets[g.turrets.length - 1];
    const data = CONFIG.AGES[0].turrets[2];
    assert('Turret damage matches config', t.damage === data.damage);
    assert('Turret hp matches config', t.hp === data.hp);
    assert('Turret stores turretIndex', t.turretIndex === 2);

    for (let i = 0; i < 5; i++) g.spawnTurret(0);
    assert('Cannot exceed TURRET_SLOTS', g.turrets.filter(tt => tt.side === 'player').length === 4);
  }

  console.log('\n--- Sell Turret Refund ---');
  {
    const g = makeGame();
    g.gold = 2000;
    g.playerSlotsBought = 4;
    g.spawnTurret(0); // cost 100 at age 0
    const cost = g.turrets[0].cost;
    const before = g.gold;
    g.sellTurret(0);
    assert('Refund = floor(cost * 0.5)', g.gold === before + Math.floor(cost * 0.5), `refund=${g.gold - before}`);
  }

  console.log('\n--- Unit Upgrades ---');
  {
    const g = makeGame();
    g.gold = 100000;
    const cost0 = g.getUnitUpgradeCost(0);
    g.upgradeUnit(0);
    assert('Tier incremented to 1', g.unitUpgrades[0] === 1);
    const cost1 = g.getUnitUpgradeCost(0);
    assert('Upgrade cost scales up', cost1 > cost0, `c0=${cost0} c1=${cost1}`);
    g.upgradeUnit(0);
    assert('Tier incremented to 2 (max)', g.unitUpgrades[0] === CONFIG.MAX_UPGRADE_TIER);
    g.upgradeUnit(0);
    assert('No upgrade past max tier', g.unitUpgrades[0] === CONFIG.MAX_UPGRADE_TIER);
  }

  console.log('\n--- Hero Spawn & Cooldown ---');
  {
    const g = makeGame();
    g.gold = 100000;
    g.spawnHero('player');
    assert('Hero spawned', g.units.some(u => u.isHero));
    const count = g.units.length;
    g.spawnHero('player');
    assert('Hero blocked while cooldown active', g.units.length === count);
  }

  console.log('\n--- Buildings: Gold Mine Income ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    g.gold = 1000;
    g.buyBuilding(0); // Gold Mine
    assert('Building placed', g.buildings.length === 1);
    const before = g.gold;
    runFrames(g, 5);
    assert('Gold mine produces gold', g.gold > before, `before=${before} now=${g.gold}`);
  }

  console.log('\n--- Buildings: Barracks Heal ---');
  {
    const g = makeGame();
    g.ai = { update() {} };
    g.gold = 100000;
    g.spawnUnit(0);
    const u = g.units[0];
    u.hp = 10;
    g.buyBuilding(1); // Barracks (heal 2/s radius 80)
    runFrames(g, 3);
    assert('Barracks heals nearby units', u.hp > 10, `hp=${u.hp.toFixed(1)}`);
  }

  console.log('\n--- Achievements ---');
  {
    const a = new Achievements();
    a.unlocked = [];
    a.unlock('test_id');
    assert('Unlock records id', a.isUnlocked('test_id'));
    a.unlock('test_id');
    assert('Unlock is idempotent', a.unlocked.filter(x => x === 'test_id').length === 1);

    const g = makeGame();
    g.gold = 60000;
    g.achievements.update(0.1, g);
    assert('Gold hoarder unlocks at 50k', g.achievements.isUnlocked('gold_hoarder'));
  }

  console.log('\n--- applyEnemyScaling ---');
  {
    const g = makeGame();
    g.difficulty = 1; // Harder 1.15x
    const fake = { hp: 100, maxHp: 0, damage: 50 };
    g.applyEnemyScaling(fake, 100, 50);
    assert('HP scaled by 1.15', fake.hp === 115);
    assert('Damage scaled by 1.15', fake.damage === 58);
    assert('maxHp mirrors hp', fake.maxHp === 115);
  }

  console.log('\n--- AI Waves ---');
  {
    const g = makeGame();
    g.enemyGold = 100000;
    g.ai = new AI(g);
    runFrames(g, 15);
    assert('AI spawns enemy units over time', g.units.some(u => u.side === 'enemy'));
  }

  console.log('\n--- Debug Click: Add Gold ---');
  {
    const g = makeGame();
    g.debugOpen = true;
    const panelY = (CONFIG.VIEWPORT.HEIGHT - 600) / 2;
    const panelX = CONFIG.VIEWPORT.WIDTH / 2 - 620 / 2;
    g.input.mouseX = panelX + 10;       // col1X (RESOURCES +5000)
    g.input.mouseY = panelY + 40 + 18;  // first button row
    const before = g.gold;
    g.handleDebugClick();
    assert('Debug +5000 gold applied', g.gold === before + 5000, `delta=${g.gold - before}`);
  }

  console.log('\n--- Renderer Draw All Ages ---');
  {
    const g = makeGame();
    let ok = true;
    try {
      for (let a = 0; a < 5; a++) {
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
    assert('All age rendering runs without throwing', ok);
  }

  console.log('\n--- SpriteManager ---');
  {
    const sm = new SpriteManager();
    const ctx2 = document.createElement('canvas').getContext('2d');
    const types = ['melee', 'ranged', 'fast', 'siege', 'armored', 'elite', 'hero'];
    let ok = true;
    try {
      for (let a = 0; a < 5; a++) {
        for (const t of types) sm.draw(ctx2, t, a, 100, 300, 1, 'player');
      }
    } catch (e) { ok = false; console.log('  sprite error:', e.message); }
    assert('SpriteManager draws all ages/types', ok && sm.cache.size > 0, `cache=${sm.cache.size}`);
  }

  console.log('\n--- Particles & Minimap ---');
  {
    const g = makeGame();
    let ok = true;
    try {
      g.particles.emitDamageNumber(100, 100, 50, '#fff');
      g.particles.emitGoldNumber(100, 100, 30);
      g.particles.update(0.1);
      g.particles.draw(g.renderer.ctx, g.renderer);
      new Minimap().draw(g.renderer.ctx, g.units, g.turrets, [g.playerBase, g.enemyBase], 0, g.buildings);
    } catch (e) { ok = false; console.log('  fx error:', e.message); }
    assert('Particles and minimap render without throwing', ok);
  }

  const passed = allResults.filter(r => r.pass).length;
  const failed = allResults.filter(r => !r.pass).length;
  console.log(`\n  ${passed} passed, ${failed} failed, ${allResults.length} total`);
  if (failed > 0) process.exit(1);
}

runTests();
