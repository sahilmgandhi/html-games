#!/usr/bin/env node
// Live-state probe: loads the dev server over host CDP, waits, evaluates a JS
// expression in the page, prints the result. Usage:
//   node tools/probe.mjs --showcase demo-battle --wait 15000 --expr "window.__battle.units.length"
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};

const url = new URL(opt('url', 'http://localhost:3001/'));
for (const k of ['showcase', 'camera']) {
  const v = opt(k, null);
  if (v) url.searchParams.set(k, v);
}
const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
const context = browser.contexts()[0] || await browser.newContext();
const page = context.pages()[0] || await context.newPage();
await page.goto(url.toString(), { waitUntil: 'load' });
// See videocap.mjs: bypass the bridge profile's heuristic module cache.
await page.reload({ waitUntil: 'load', ignoreCache: true });
try {
  await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
} catch {
  console.error('timeout waiting for __ready');
}
await page.waitForTimeout(parseInt(opt('wait', '3000'), 10));
const until = opt('until', null);
if (until) {
  try {
    await page.waitForFunction(until, null, { timeout: parseInt(opt('until-timeout', '120000'), 10) });
  } catch {
    console.error('until condition not met');
  }
}
const expr = opt('expr', '({ units: window.__battle?.units?.length })');
try {
  const result = await page.evaluate(`(async () => { const window = self; return (${expr}); })()`);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(`eval failed: ${e.message}`);
}
const shot = opt('shot', null);
if (shot) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot });
  console.error(`shot: ${shot}`);
}
await page.close();
process.exit(0);
