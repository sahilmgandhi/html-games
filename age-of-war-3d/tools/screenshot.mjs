#!/usr/bin/env node
// Headless verification: loads the dev server, waits for __ready,
// screenshots a PNG and writes a JSON log (console errors, fps, draw calls).
// Usage: npm run shot -- --showcase terrain --camera side --out shots/terrain.png
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const url = new URL(opt('url', 'http://localhost:3001/'));
for (const k of ['showcase', 'camera']) {
  const v = opt(k, null);
  if (v) url.searchParams.set(k, v);
}
const out = resolve(opt('out', 'shots/shot.png'));
mkdirSync(dirname(out), { recursive: true });

// Prefer the host bridge (Chrome CDP on :9222); local launch SEGVs in sandboxes.
const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
let browser = null;
let context = null;
let launched = false;
if (!flag('launch')) {
  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
    context = browser.contexts()[0] || await browser.newContext();
  } catch (e) {
    console.error(`CDP connect failed (${e.message}), falling back to launch`);
  }
}
if (!browser) {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--single-process', '--disable-gpu', '--disable-dev-shm-usage', '--use-angle=swiftshader'],
  });
  context = await browser.newContext();
  launched = true;
}
const page = context.pages()[0] || await context.newPage();
await page.setViewportSize({
  width: parseInt(opt('width', '1280'), 10),
  height: parseInt(opt('height', '720'), 10),
});
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(url.toString(), { waitUntil: 'load' });
// See videocap.mjs: bypass the bridge profile's heuristic module cache.
await page.reload({ waitUntil: 'load', ignoreCache: true });
try {
  await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
} catch {
  consoleErrors.push('timeout waiting for __ready');
}
await page.waitForTimeout(parseInt(opt('wait', '1500'), 10));
await page.screenshot({ path: out });
const report = await page.evaluate(() => ({
  errors: window.__errors || [],
  stats: window.__game3d?.stats || null,
}));
if (launched) await browser.close();
else await page.close();

const log = {
  url: url.toString(),
  out,
  time: new Date().toISOString(),
  consoleErrors,
  ...report,
};
writeFileSync(out.replace(/\.png$/, '.json'), `${JSON.stringify(log, null, 2)}\n`);
console.log(JSON.stringify(log, null, 2));
// CDP connections keep the event loop alive; exit explicitly.
const failed = flag('strict') && (log.errors.length > 0 || consoleErrors.length > 0);
process.exit(failed ? 1 : 0);
