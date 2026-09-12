#!/usr/bin/env node
// Autonomous all-ages sweep: bot-vs-AI matches covering every unit, turret,
// building, hero, special and evolve path, filing misses to docs/BUGS.json.
// Async-friendly: `nohup node tools/soak.mjs --out soak-report.json &`.
// Usage: node tools/soak.mjs [--seeds 7,99] [--out report.json] [--no-file-bugs]
import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';
import { applyBattleAction } from '../src/demo-battle/actions.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const seeds = opt('seeds', '7,99').split(',').map(Number);
const outPath = path.resolve(opt('out', 'soak-report.json'));
const bugsPath = path.join(ROOT, '..', 'docs', 'BUGS.json');
const fileBugs = !args.includes('--no-file-bugs');

const RICH = 1e6;
const findings = [];
const find = (severity, title, steps, expected, actual) =>
  findings.push({ severity, title, steps, expected, actual });

function grant(sim) {
  sim.gold = RICH;
  sim.xp = RICH;
}

function finiteState(sim) {
  if (![sim.gold, sim.xp, sim.playerBase.hp, sim.enemyBase.hp].every(Number.isFinite)) return false;
  return sim.units.every((u) => Number.isFinite(u.x) && Number.isFinite(u.hp))
    && sim.turrets.every((t) => Number.isFinite(t.x) && Number.isFinite(t.hp));
}

function step(sim, dt, secs) {
  for (let i = 0; i < Math.round(secs / dt); i++) sim.update(dt);
}

function act(sim, action) {
  try {
    applyBattleAction(sim, action);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

function coverAge(sim, age, dt, keep = () => {}) {
  const tag = `age ${age} seed ${sim.seed}`;
  const units = CONFIG.AGES[age].units.length;
  const turrets = CONFIG.AGES[age].turrets.length;
  for (let i = 0; i < units; i++) {
    grant(sim);
    const r = act(sim, { type: 'spawn-unit', index: i });
    if (!r.ok) find('crash', `spawn-unit ${i} throws (${tag})`, `soak age ${age}: spawn unit ${i}`, 'unit spawns', r.error);
    else if (!sim.units.some((u) => u.side === 'player')) find('high', `spawn-unit ${i} no-ops (${tag})`, `soak age ${age}: spawn unit ${i}`, 'a player unit exists', 'units list empty');
    for (let tier = 0; tier < CONFIG.MAX_UPGRADE_TIER; tier++) act(sim, { type: 'upgrade-unit', index: i });
  }
  for (let s = sim.playerSlotsBought; s < CONFIG.TURRET_SLOTS; s++) {
    grant(sim);
    const r = act(sim, { type: 'buy-slot' });
    if (!r.ok) {
      find('crash', `buy-slot throws (${tag})`, `soak age ${age}: buy slot ${s}`, 'slot bought', r.error);
      break;
    }
  }
  for (let i = 0; i < turrets; i++) {
    grant(sim);
    const before = sim.playerTurrets().length;
    const r = act(sim, { type: 'spawn-turret', index: i });
    if (!r.ok) find('crash', `spawn-turret ${i} throws (${tag})`, `soak age ${age}: place turret ${i}`, 'turret places', r.error);
    else if (sim.playerTurrets().length <= before && sim.playerTurrets().length < sim.playerSlotsBought) {
      find('medium', `spawn-turret ${i} silently fails (${tag})`, `soak age ${age}: place turret ${i} with free slot`, 'turret count grows', `count ${before}`);
    }
  }
  if (sim.playerTurrets().length > 0) {
    grant(sim);
    const before = sim.gold;
    act(sim, { type: 'sell-turret', index: 0 });
    if (!(sim.gold > before)) find('medium', `sell-turret refunds nothing (${tag})`, `soak age ${age}: sell turret 0`, 'gold grows by refund', `gold ${before}`);
  }
  grant(sim);
  act(sim, { type: 'buy-building', index: 0 });
  act(sim, { type: 'buy-building', index: 1 });
  act(sim, { type: 'spawn-hero' });
  sim.specialCooldown = 0;
  grant(sim);
  act(sim, { type: 'special' });
  if (!sim.specialAnim) find('medium', `special never starts (${tag})`, `soak age ${age}: force special off cooldown`, 'specialAnim active', 'no anim');
  for (let i = 0; i < 5 && !sim.gameOver; i++) {
    keep();
    step(sim, dt, 1);
  }
  if (sim.specialAnim) find('medium', `special never resolves (${tag})`, `soak age ${age}: run 5s after special`, 'specialAnim clears', 'anim stuck');
  if (!finiteState(sim)) find('high', `non-finite state (${tag})`, `soak age ${age}: coverage schedule`, 'all state finite', 'NaN in gold/xp/hp/x');
}

function runMatch(seed) {
  const sim = new BattleSim({ seed, autoAI: true, autoPlayer: false });
  const dt = 0.25;
  const agesCovered = [];
  const topUp = () => {
    sim.playerBase.hp = sim.playerBase.maxHp;
    sim.enemyBase.hp = sim.enemyBase.maxHp;
  };
  try {
    for (let age = 0; age < CONFIG.AGES.length; age++) {
      topUp();
      grant(sim);
      sim.xp = RICH;
      while (sim.currentAge < age && !sim.gameOver) {
        topUp();
        const before = sim.currentAge;
        act(sim, { type: 'evolve' });
        if (sim.currentAge <= before) {
          find('medium', `evolve to age ${age} fails with XP (seed ${seed})`, `soak: grant XP, evolve from ${before}`, `currentAge ${age}`, `stuck at ${before}`);
          break;
        }
      }
      if (sim.gameOver || sim.currentAge !== age) break;
      agesCovered.push(age);
      coverAge(sim, age, dt, topUp);
      for (let s = 0; s < 20 && !sim.gameOver; s++) {
        topUp();
        step(sim, dt, 1);
      }
      topUp();
      if (!finiteState(sim)) find('high', `non-finite state after age ${age} (seed ${seed})`, 'soak: 20s battle', 'all state finite', 'NaN found');
    }
    // Real match: no more top-ups, bot plays, game must resolve.
    sim.autoPlayer = true;
    let guard = 0;
    while (!sim.gameOver && guard < 4800) {
      sim.update(dt);
      guard++;
    }
    const match = { seed, winner: sim.winner, gameOver: sim.gameOver, agesCovered };
    if (!sim.gameOver) find('medium', `match never resolves (seed ${seed})`, 'soak: evolve-capped run to cap', 'gameOver with a winner', `ages ${agesCovered}`);
    // Chrome sweep basics on a live sim.
    const live = new BattleSim({ seed, autoAI: false });
    grant(live);
    live.spawnUnit(0);
    live.paused = true;
    const gt = live.gameTime;
    live.update(1);
    if (live.gameTime !== gt) find('medium', `pause does not halt (seed ${seed})`, 'soak: pause, step 1s', 'gameTime frozen', `advanced ${live.gameTime - gt}`);
    live.paused = false;
    live.playerBase.hp = 0;
    live.update(1 / 60);
    if (!(live.gameOver && live.winner === 'enemy')) find('high', `base fall ends nothing (seed ${seed})`, 'soak: zero player base HP', 'gameOver, enemy wins', `over=${live.gameOver}`);
    live.restart();
    if (live.gameOver || live.units.length !== 0) find('medium', `restart leaves stale match (seed ${seed})`, 'soak: restart after game over', 'fresh match, no units', `over=${live.gameOver} units=${live.units.length}`);
    return match;
  } catch (e) {
    find('crash', `match throws (seed ${seed})`, 'soak: full evolve run', 'no exceptions', String(e?.message || e));
    return { seed, winner: null, gameOver: false, agesCovered, crashed: true };
  }
}

const matches = seeds.map(runMatch);
if (process.env.SOAK_SELF_TEST) find('low', 'soak self-test probe', 'soak --self-test', 'filing path works', 'probe entry');

// File new findings to docs/BUGS.json (dedupe by title, never auto-close).
let filed = [];
if (fileBugs && findings.length > 0) {
  const db = JSON.parse(fs.readFileSync(bugsPath, 'utf8'));
  const known = new Set(db.bugs.map((b) => b.title));
  let n = db.bugs.reduce((m, b) => Math.max(m, parseInt(b.id.replace('BUG-', ''), 10) || 0), 0);
  for (const f of findings) {
    if (known.has(f.title)) continue;
    n++;
    const id = `BUG-${String(n).padStart(3, '0')}`;
    db.bugs.push({ id, title: f.title, severity: f.severity, steps: f.steps, expected: f.expected, actual: f.actual, status: 'open' });
    filed.push(id);
  }
  if (filed.length > 0) fs.writeFileSync(bugsPath, `${JSON.stringify(db, null, 2)}\n`);
}

const crashes = findings.filter((f) => f.severity === 'crash').length;
const highs = findings.filter((f) => f.severity === 'high').length;
const report = { time: new Date().toISOString(), seeds, matches, findings, filed };
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`matches: ${matches.map((m) => `${m.seed}->${m.winner || 'unresolved'}`).join(', ')}`);
console.log(`findings: ${findings.length} (crash ${crashes}, high ${highs}), filed: ${filed.join(', ') || 'none'}`);
console.log(`report: ${outPath}`);
process.exit(crashes + highs > 0 ? 1 : 0);
