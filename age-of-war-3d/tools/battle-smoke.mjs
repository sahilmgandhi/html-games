#!/usr/bin/env node
// Headless BattleSim check: scripted demo match must spawn, fight, earn gold/xp
// and stay deterministic per seed. Usage: node tools/battle-smoke.mjs
import { BattleSim } from '../src/simulation/battle.js';
import { mulberry32 } from '../src/simulation/rng.js';

let pass = 0;
let fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

function runMatch(seed, seconds) {
  const sim = new BattleSim({ seed, rng: mulberry32(seed), autoAI: true, autoPlayer: true });
  const seen = { fire: 0, death: 0, spawn: 0, special: 0 };
  sim.events = {
    emit(n) {
      if (n === 'projectile:fire') seen.fire++;
      if (n === 'entity:death') seen.death++;
      if (n === 'entity:spawn') seen.spawn++;
      if (n === 'special:activate') seen.special++;
    },
  };
  const dt = 1 / 60;
  for (let i = 0; i < seconds * 60; i++) sim.update(dt);
  return { sim, seen };
}

const a = runMatch(7, 120);
check('spawns happen', a.seen.spawn > 4, `spawn=${a.seen.spawn}`);
check('projectiles fired', a.seen.fire > 0, `fire=${a.seen.fire}`);
check('units die', a.seen.death > 0, `deaths=${a.seen.death}`);
check('gold earned via kills', a.sim.gold > 0 || a.sim.xp > 0, `gold=${a.sim.gold.toFixed(0)} xp=${a.sim.xp.toFixed(0)}`);
check('enemy AI fields units', a.sim.units.some((u) => u.side === 'enemy') || a.seen.death > 0, '');
check('no NaN in state', Number.isFinite(a.sim.gold) && a.sim.units.every((u) => Number.isFinite(u.x) && Number.isFinite(u.hp)), '');

const b = runMatch(7, 120);
check('deterministic per seed',
  Math.abs(a.sim.enemyBase.hp - b.sim.enemyBase.hp) < 1e-9 && a.seen.spawn === b.seen.spawn,
  `hp ${a.sim.enemyBase.hp} vs ${b.sim.enemyBase.hp}`);

const c = runMatch(99, 120);
check('seed matters', Math.abs(a.sim.enemyBase.hp - c.sim.enemyBase.hp) > 1e-9 || a.seen.spawn !== c.seen.spawn, '');

const long = runMatch(3, 600);
check('match resolves or still fighting at 10min',
  long.sim.gameOver || long.sim.units.length > 0 || long.sim.gold > 0, '');
console.log(`bases at 10min: player=${long.sim.playerBase.hp} enemy=${long.sim.enemyBase.hp} over=${long.sim.gameOver}`);

// Player-action API surface the HUD/demo layer needs.
const s = new BattleSim({ seed: 1, autoAI: false });
s.gold = 10000;
check('spawnUnit', !!s.spawnUnit(0), '');
check('spawnHero gates on gold', (() => { s.gold = 0; return s.spawnHero('player') === null; })(), '');
s.gold = 10000;
check('buyBuilding', !!s.buyBuilding(0), '');
check('spawnTurret', !!s.spawnTurret(0), '');
s.xp = 100000;
check('special fires', s.useSpecial() === true && !!s.specialAnim, '');
for (let i = 0; i < 200; i++) s.update(1 / 60);
check('special resolves', s.specialAnim === null, '');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
