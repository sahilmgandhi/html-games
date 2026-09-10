#!/usr/bin/env node
// Motion verification: records CDP screencast frames from the dev server and
// assembles them into an mp4 (for human review) plus a contact-sheet PNG
// (for frame-by-frame inspection). Companion to screenshot.mjs.
// Usage: npm run videocap -- --url 'http://localhost:8081/age-of-war-3d/?showcase=gallery' --seconds 6 --out shots/dino-walk.mp4
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);

const url = opt('url', 'http://localhost:8081/age-of-war-3d/');
const out = resolve(opt('out', 'shots/cap.mp4'));
const seconds = parseFloat(opt('seconds', '6'));
const waitMs = parseInt(opt('wait', '3000'), 10);
const everyNth = parseInt(opt('nth', '2'), 10);
const setupJs = opt('setup', '');
mkdirSync(dirname(out), { recursive: true });

const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
let browser = null;
let launched = false;
try {
  browser = await chromium.connectOverCDP(CDP_ENDPOINT);
} catch (e) {
  console.error(`CDP connect failed (${e.message}), falling back to launch`);
}
if (!browser) {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--single-process', '--disable-gpu', '--disable-dev-shm-usage', '--use-angle=swiftshader'],
  });
  launched = true;
}
const context = browser.contexts()[0] || await browser.newContext();
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

await page.goto(url, { waitUntil: 'load' });
try {
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
} catch {
  consoleErrors.push('timeout waiting for __ready');
}
await page.waitForTimeout(waitMs);
if (setupJs) await page.evaluate(new Function(setupJs));

const framesDir = mkdtempSync(join(tmpdir(), 'videocap-'));
const session = await context.newCDPSession(page);
const frames = [];
session.on('Page.screencastFrame', async (ev) => {
  frames.push(ev.data);
  try {
    await session.send('Page.screencastFrameAck', { sessionId: ev.sessionId });
  } catch { /* session ending */ }
});
await session.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: everyNth });
await page.waitForTimeout(seconds * 1000);
await session.send('Page.stopScreencast').catch(() => {});
await page.waitForTimeout(500);

frames.forEach((b64, i) => {
  writeFileSync(join(framesDir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(b64, 'base64'));
});
const fps = frames.length / seconds;
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', fps.toFixed(2), '-i', join(framesDir, 'f%04d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out]);
// Contact sheet: up to 12 evenly spaced frames in a 4x3 grid.
const step = Math.max(1, Math.floor(frames.length / 12));
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', fps.toFixed(2), '-i', join(framesDir, 'f%04d.jpg'),
  '-vf', `select='not(mod(n\\,${step}))',scale=320:180,tile=4x3`, '-frames:v', '1',
  out.replace(/\.mp4$/, '-sheet.png')]);
rmSync(framesDir, { recursive: true, force: true });

const report = await page.evaluate(() => ({
  errors: window.__errors || [],
  stats: window.__game3d?.stats || null,
}));
if (launched) await browser.close();

const log = {
  url, out, seconds, frames: frames.length,
  fps: Number(fps.toFixed(1)),
  sheet: out.replace(/\.mp4$/, '-sheet.png'),
  time: new Date().toISOString(),
  consoleErrors,
  ...report,
};
writeFileSync(out.replace(/\.mp4$/, '.json'), `${JSON.stringify(log, null, 2)}\n`);
console.log(JSON.stringify(log, null, 2));
const failed = flag('strict') && (log.errors.length > 0 || consoleErrors.length > 0);
process.exit(failed ? 1 : 0);
