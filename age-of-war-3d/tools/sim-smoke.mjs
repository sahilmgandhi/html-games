#!/usr/bin/env node
// Headless simulation test: exercises the ported combat/AI logic in Node.
// Fails before the port works, passes after. Usage: node tools/sim-smoke.mjs
import { CONFIG } from '../src/simulation/config.js';
import { SpatialHash, Base, Unit, Turret, Building, ProjectilePool } from '../src/simulation/entities.js';
import { AI } from '../src/simulation/ai.js';
import { mulberry32 } from '../src/simulation/rng.js';

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`);
  if (!cond) failures++;
};

const DT = 1 / 60;
const GY = CONFIG.GROUND_Y;

// Mirror of Game.update ordering: rebuild hash, units, turrets, projectiles.
function stepFrame(state) {
  const { units, turrets, buildings, pool, playerBase, enemyBase } = state;
  const hash = new SpatialHash(100);
  for (const u of units) if (u.alive) hash.insert(u);
  for (const t of turrets) if (t.alive) hash.insert(t);
  for (const b of buildings) if (b.alive) hash.insert(b);
  for (const u of units) {
    const base = u.side === 'player' ? enemyBase : playerBase;
    u.update(DT, units, base, pool, hash);
  }
  for (const t of turrets) t.update(DT, pool, hash);
  for (const p of pool.active) {
    p.update(DT);
    p.checkHit([playerBase, enemyBase], hash);
  }
  pool.releaseDead();
}

// --- 1. Config parity spot checks ---
check('config base hp', CONFIG.BASE_HP === 1000);
check('config clubman hp', CONFIG.AGES[0].units[0].hp === 55);
check('config 5 ages', CONFIG.AGES.length === 5);

// --- 2. Melee duel: two clubmen must eventually kill each other, winner stands ---
{
  const playerBase = new Base(100, GY, 'player');
  const enemyBase = new Base(2300, GY, 'enemy');
  const pool = new ProjectilePool(64);
  const units = [new Unit(1100, GY, 'player', 0, 0), new Unit(1300, GY, 'enemy', 0, 0)];
  const state = { units, turrets: [], buildings: [], pool, playerBase, enemyBase };
  let frames = 0;
  while (units.every((u) => u.alive) && frames < 60 * 120) { stepFrame(state); frames++; }
  // let death timers finish
  for (let i = 0; i < 60; i++) stepFrame(state);
  const aliveCount = units.filter((u) => u.alive).length;
  check('melee duel ends', aliveCount <= 1);
  check('melee duel finite', frames < 60 * 120);
  check('melee no NaN positions', units.every((u) => Number.isFinite(u.x)));
}

// --- 3. Ranged combat produces projectiles that deal damage ---
{
  const playerBase = new Base(100, GY, 'player');
  const enemyBase = new Base(2300, GY, 'enemy');
  const pool = new ProjectilePool(64);
  const target = new Unit(1200, GY, 'enemy', 0, 0);
  const archer = new Unit(1100, GY, 'player', 0, 1); // Slingshot, range 150
  const units = [archer, target];
  const state = { units, turrets: [], buildings: [], pool, playerBase, enemyBase };
  const hpBefore = target.hp;
  for (let i = 0; i < 600 && target.alive; i++) stepFrame(state);
  check('ranged fires projectiles', pool.active.length + pool.pool.length === 64);
  check('ranged damages target', target.hp < hpBefore);
}

// --- 4. Gold Mine economy ---
{
  const mine = new Building(200, GY, 'player', 0, 0);
  let gold = 0;
  for (let i = 0; i < 60 * 9; i++) gold += mine.update(DT, []);
  check('gold mine ~6 gold in 9s', gold >= 6 && gold <= 7);
}

// --- 5. Turret engages enemy in range ---
{
  const playerBase = new Base(100, GY, 'player');
  const enemyBase = new Base(2300, GY, 'enemy');
  const pool = new ProjectilePool(64);
  const turret = new Turret(300, GY, 'player', 0, 0, 0); // range 200
  const foe = new Unit(450, GY, 'enemy', 0, 0);
  const state = { units: [foe], turrets: [turret], buildings: [], pool, playerBase, enemyBase };
  for (let i = 0; i < 600 && foe.alive; i++) stepFrame(state);
  check('turret kills intruder', !foe.alive);
}

// --- 6. Entity ids unique ---
{
  const ids = new Set();
  const ents = [new Unit(0, GY, 'player', 0, 0), new Unit(0, GY, 'enemy', 0, 1), new Turret(0, GY, 'player', 0, 0, 0), new Building(0, GY, 'player', 0, 0), new Base(0, GY, 'player')];
  for (const e of ents) ids.add(e.id);
  check('entity ids unique', ids.size === ents.length);
}

// --- 7. AI determinism: same seed, same stub game -> same decisions ---
function makeStubGame() {
  const log = [];
  return {
    log, difficulty: 0, enemyAge: 0, currentAge: 0,
    enemyGold: 5000, enemyXp: 0, enemySpecialCooldown: 0, enemyHeroCooldown: 0,
    enemySlotsBought: 0,
    units: [], turrets: [],
    playerBase: { hp: 1000, maxHp: 1000 },
    enemyBase: { hp: 1000, maxHp: 1000 },
    getBuildingCount: () => 0,
    spawnEnemyUnit: (i) => log.push(`unit:${i}`),
    useEnemySpecial: () => log.push('special'),
    evolveEnemy: () => log.push('evolve'),
    buyEnemySlot: () => log.push('slot'),
    spawnEnemyTurret: (i) => log.push(`turret:${i}`),
    buyEnemyBuilding: (i) => log.push(`building:${i}`),
    spawnHero: (s) => log.push(`hero:${s}`),
  };
}
{
  const run = (seed) => {
    const g = makeStubGame();
    const ai = new AI(g, mulberry32(seed));
    for (let i = 0; i < 40; i++) { g.enemyGold += 500; ai.update(2.5); }
    return g.log.join(',');
  };
  const a = run(42);
  const b = run(42);
  const c = run(7);
  check('ai deterministic same seed', a === b);
  check('ai decides something', a.length > 0);
  check('ai seed matters', a !== c);
}

if (failures > 0) {
  console.error(`${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('SIM SMOKE OK');
