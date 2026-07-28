#!/usr/bin/env node
// Generates docs/balance.md from js/config.js. Run via `npm run docs`.
// tests/docs.test.js asserts the committed file matches this output byte-for-byte.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'js', 'config.js');
const DOC_PATH = path.join(REPO_ROOT, 'docs', 'balance.md');

const mult = (n) => `${n}×`;
const pct = (n) => `${Math.round(n * 100)}%`;
const num = (n) => n.toLocaleString('en-US');

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---|').join('')}`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

function unitTraits(u) {
  const traits = [];
  if (u.projectileSpeed) traits.push(`projectile ${u.projectileSpeed}`);
  if (u.splashRadius) traits.push(`splash ${u.splashRadius}`);
  if (u.auraRadius) traits.push(`aura r${u.auraRadius}`);
  if (u.auraHeal) traits.push(`heal ${u.auraHeal}/s`);
  if (u.auraBuff) traits.push(`buff ${mult(u.auraBuff)}`);
  return traits.join(', ') || '—';
}

const UNIT_HEADERS = ['Unit', 'Role', 'Cost', 'HP', 'Damage', 'Speed', 'Range', 'Attack every', 'Gold reward', 'XP reward', 'Notes'];
const unitRow = (u) => [
  u.name, u.type, num(u.cost), num(u.hp), num(u.damage), u.speed, u.range,
  `${u.attackSpeed}s`, num(u.goldReward), num(u.xpReward), unitTraits(u),
];

function renderBalanceDoc(CONFIG) {
  const out = [];
  out.push('# Age of War — Balance Reference');
  out.push('');
  out.push('<!-- GENERATED FILE — do not edit by hand. Change `js/config.js`, then run `npm run docs`. -->');
  out.push('');
  out.push('Every number below is read straight from `js/config.js`. `tests/docs.test.js` fails if this');
  out.push('file drifts from the config, so a rebalance without `npm run docs` breaks the suite.');
  out.push('');

  out.push('## Difficulty');
  out.push('');
  out.push('Scaling applies to enemy units and enemy turrets alike; the player is never scaled.');
  out.push('');
  out.push(table(
    ['Difficulty', 'Enemy HP', 'Enemy damage', 'Enemy gold', 'AI think interval'],
    CONFIG.DIFFICULTIES.map((d) => [
      d.name, mult(d.enemyHpMult), mult(d.enemyDmgMult), mult(d.enemyGoldMult),
      d.aiThinkMult === 1 ? mult(d.aiThinkMult) : `${mult(d.aiThinkMult)} (faster)`,
    ]),
  ));
  out.push('');

  out.push('## Economy');
  out.push('');
  out.push(table(['Constant', 'Value'], [
    ['Base HP', num(CONFIG.BASE_HP)],
    ['Starting gold', num(CONFIG.STARTING_GOLD)],
    ['Starting XP', num(CONFIG.STARTING_XP)],
    ['Passive gold per second, by age', CONFIG.PASSIVE_GOLD_RATE.map(num).join(' / ')],
    ['Evolution base heal', pct(CONFIG.EVOLVE_HEAL)],
    ['Special attack cooldown', `${CONFIG.SPECIAL_COOLDOWN}s`],
    ['Hero cooldown', `${CONFIG.HERO_COOLDOWN}s`],
    ['Turret slots', num(CONFIG.TURRET_SLOTS)],
    ['Turret slot cost', `${num(CONFIG.TURRET_SLOT_COST)}g`],
    ['Turret sell refund', pct(CONFIG.TURRET_REFUND_RATE)],
    ['Max buildings', num(CONFIG.MAX_BUILDINGS)],
    ['AI think interval', `${CONFIG.AI_THINK_INTERVAL}ms`],
  ]));
  out.push('');

  out.push('### Unit upgrades');
  out.push('');
  out.push(`Each unit type upgrades up to tier ${CONFIG.MAX_UPGRADE_TIER}. Cost is a multiple of the unit's spawn cost.`);
  out.push('');
  out.push(table(
    ['Tier', 'Cost', 'HP', 'Damage', 'Speed'],
    CONFIG.UNIT_UPGRADE_COSTS.map((cost, i) => [
      i === 0 ? 'Base' : `${i}`,
      i === 0 ? '—' : `${mult(cost)} unit cost`,
      mult(CONFIG.UNIT_UPGRADE_HP_MULT[i]),
      mult(CONFIG.UNIT_UPGRADE_DMG_MULT[i]),
      mult(CONFIG.UNIT_UPGRADE_SPD_MULT[i]),
    ]),
  ));
  out.push('');

  out.push('### Buildings');
  out.push('');
  out.push(table(
    ['Building', 'Cost', 'HP', 'Effect'],
    CONFIG.BUILDINGS.map((b) => {
      let effect = '—';
      if (b.produceAmount) effect = `${b.produceAmount}g every ${b.produceInterval}s`;
      else if (b.healAmount) effect = `heals ${b.healAmount}hp/s within ${b.healRadius}px`;
      return [b.name, `${num(b.cost)}g`, num(b.hp), effect];
    }),
  ));
  out.push('');

  out.push('## Ages');
  out.push('');
  out.push(table(
    ['Age', 'XP to evolve into', 'Special', 'Special damage', 'Special XP cost', 'Hero'],
    CONFIG.AGES.map((age, i) => [
      age.name,
      i === 0 ? '— (start)' : num(CONFIG.EVOLVE_XP[i]),
      age.specialName, num(age.specialDamage), num(CONFIG.SPECIAL_XP_COST[i]), age.hero.name,
    ]),
  ));
  out.push('');

  for (const age of CONFIG.AGES) {
    out.push(`### ${age.name}`);
    out.push('');
    out.push('**Units**');
    out.push('');
    out.push(table(UNIT_HEADERS, [...age.units.map(unitRow), unitRow({ ...age.hero, type: `hero (${age.hero.type})` })]));
    out.push('');
    out.push('**Turrets**');
    out.push('');
    out.push(table(
      ['Turret', 'Cost', 'HP', 'Damage', 'Range', 'Attack every', 'Notes'],
      age.turrets.map((t) => [
        t.name, num(t.cost), num(t.hp), num(t.damage), t.range, `${t.attackSpeed}s`,
        t.splashRadius ? `splash ${t.splashRadius}` : '—',
      ]),
    ));
    out.push('');
  }

  return out.join('\n');
}

// config.js declares `const CONFIG`, which stays lexical rather than landing on the sandbox
// global — the trailing expression makes it the script's completion value instead.
function loadConfig() {
  const src = fs.readFileSync(CONFIG_PATH, 'utf8');
  return vm.runInNewContext(`${src}\nCONFIG;`, {}, { filename: 'config.js' });
}

module.exports = { renderBalanceDoc, loadConfig, DOC_PATH };

if (require.main === module) {
  fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
  fs.writeFileSync(DOC_PATH, renderBalanceDoc(loadConfig()), 'utf8');
  console.log(`Wrote ${path.relative(REPO_ROOT, DOC_PATH)}`);
}
