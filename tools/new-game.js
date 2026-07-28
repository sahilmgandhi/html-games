#!/usr/bin/env node
// Scaffolds a new game from template/ and registers it as an npm workspace.
// Usage: npm run new-game <slug> "<Display Name>"

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const TEMPLATE_DIR = path.join(REPO_ROOT, 'template');
const ROOT_PACKAGE = path.join(REPO_ROOT, 'package.json');
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function substitute(text, slug, name) {
  return text.split('__GAME_SLUG__').join(slug).split('__GAME_NAME__').join(name);
}

function copyTree(from, to, slug, name) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, substitute(entry.name, slug, name));
    if (entry.isDirectory()) copyTree(src, dest, slug, name);
    else fs.writeFileSync(dest, substitute(fs.readFileSync(src, 'utf8'), slug, name), 'utf8');
  }
}

const [slug, name] = process.argv.slice(2);

if (!slug || !name) fail('usage: npm run new-game <slug> "<Display Name>"');
if (!SLUG_PATTERN.test(slug)) fail(`slug must be lowercase-kebab-case, got "${slug}"`);

const gameDir = path.join(REPO_ROOT, slug);
if (fs.existsSync(gameDir)) fail(`${slug}/ already exists`);

copyTree(TEMPLATE_DIR, gameDir, slug, name);

const pkg = JSON.parse(fs.readFileSync(ROOT_PACKAGE, 'utf8'));
if (!pkg.workspaces.includes(slug)) {
  pkg.workspaces.push(slug);
  pkg.workspaces.sort();
  fs.writeFileSync(ROOT_PACKAGE, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

console.log(`Created ${slug}/ and registered it as a workspace.

Next:
  1. npm install                        # links the new workspace
  2. npm test                           # the skeleton ships with passing tests
  3. npm run serve                      # then open localhost:8081/${slug}/
  4. Add a row for ${name} to the Games table in README.md`);
