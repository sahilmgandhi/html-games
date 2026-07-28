#!/usr/bin/env node
// Loads the game, then runs every tests/*.test.js. Each file exports an array of
// { name, run(t) } blocks; t.assert(name, condition, detail) records a result.

const fs = require('fs');
const path = require('path');
const { loadSources } = require('./tests/harness');

const TESTS_DIR = path.join(__dirname, 'tests');

loadSources();

const results = [];
const t = {
  assert(name, condition, detail = '') {
    const pass = !!condition;
    results.push({ name, pass, detail });
    if (!pass) console.log(`  FAIL: ${name}${detail ? ' -- ' + detail : ''}`);
  },
};

console.log('=== Age of War Headless Tests ===');

for (const file of fs.readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.js')).sort()) {
  console.log(`\n=== ${file} ===`);
  for (const block of require(path.join(TESTS_DIR, file))) {
    console.log(`\n--- ${block.name} ---`);
    block.run(t);
  }
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n  ${results.length - failed} passed, ${failed} failed, ${results.length} total`);
if (failed > 0) process.exit(1);
