#!/usr/bin/env node
// Runs every tests/*.test.js. Each file exports an array of
// { name, run(t) } blocks; t.assert(name, condition, detail) records a result.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.join(ROOT, 'tests');

// Headless canvas stub: render modules build CanvasTextures via document.
// Tests measure geometry, never pixels, so a no-op 2d context is enough.
if (typeof document === 'undefined') {
  const grad = { addColorStop() {} };
  const ctx2d = new Proxy({}, {
    get: (t, p) => {
      if (typeof p !== 'string') return undefined;
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => grad;
      if (p === 'getImageData') return () => ({ data: [], width: 0, height: 0 });
      if (p === 'measureText') return () => ({ width: 0 });
      return () => ctx2d;
    },
    set: () => true,
  });
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
  };
}

// three's loaders report progress via ProgressEvent (browser-only).
if (typeof ProgressEvent === 'undefined') {
  globalThis.ProgressEvent = class ProgressEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
  };
}

const results = [];
const t = {
  assert(name, condition, detail = '') {
    const pass = !!condition;
    results.push({ name, pass, detail });
    if (!pass) console.log(`  FAIL: ${name}${detail ? ' -- ' + detail : ''}`);
  },
};

console.log('=== Age of War 3D Static-Deploy Tests ===');

for (const file of fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.js')).sort()) {
  console.log(`\n=== ${file} ===`);
  for (const block of (await import(pathToFileURL(path.join(TESTS_DIR, file)).href)).default) {
    console.log(`\n--- ${block.name} ---`);
    await block.run(t);
  }
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n  ${results.length - failed} passed, ${failed} failed, ${results.length} total`);
if (failed > 0) process.exit(1);
