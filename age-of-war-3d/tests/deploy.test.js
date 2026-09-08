import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const listJs = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listJs(p) : p.endsWith('.js') ? [p] : [];
  });

// Static imports only; template-literal dynamic imports (showcases) are skipped.
const IMPORT_RE = /(?:import[\s{(][^'"]*?from\s*|export[\s{][^'"]*?from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;

// Strip comments so quoted paths in prose never read as imports.
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');

const importsOf = (src) => {
  const clean = stripComments(src);
  return [...clean.matchAll(IMPORT_RE)].map((m) => m[1]);
};

const relativeOf = (spec) => spec.startsWith('./') || spec.startsWith('../');
const bareOf = (spec) => !relativeOf(spec) && !spec.startsWith('/') && !spec.startsWith('http');

function importMapOf(html) {
  const m = html.match(/<script\s+type="importmap"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return {};
  return JSON.parse(m[1]).imports ?? {};
}

export default [
  {
    name: 'every shipped JS file parses (node --check)',
    run(t) {
      const files = listJs(path.join(ROOT, 'src'));
      const bad = [];
      for (const file of files) {
        try {
          execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
        } catch {
          bad.push(path.relative(ROOT, file));
        }
      }
      t.assert('all src files parse', bad.length === 0, bad.join(', '));
      t.assert('at least one src file was checked', files.length > 0);
    },
  },
  {
    name: 'no root-absolute asset URLs in index.html',
    run(t) {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const hits = [...html.matchAll(/\b(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
      t.assert('index.html has no src="/..." or href="/..."', hits.length === 0, hits.join(', '));
    },
  },
  {
    name: 'every bare import is covered by the import map',
    run(t) {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const map = importMapOf(html);
      const bare = new Set();
      const files = listJs(path.join(ROOT, 'src'));
      for (const file of files) {
        for (const spec of importsOf(fs.readFileSync(file, 'utf8'))) {
          if (bareOf(spec)) bare.add(spec);
        }
      }
      for (const spec of [...bare].sort()) {
        t.assert(`import map covers "${spec}"`, spec in map, 'add an importmap entry');
      }
      t.assert('at least one source file was scanned', files.length > 0);
    },
  },
  {
    name: 'every static relative import resolves to a file on disk',
    run(t) {
      let checked = 0;
      const missing = [];
      const absolute = [];
      const check = (fromFile, spec) => {
        const target = path.resolve(path.dirname(fromFile), spec);
        checked += 1;
        if (!fs.existsSync(target)) missing.push(`${path.relative(ROOT, fromFile)} -> ${spec}`);
      };
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const map = importMapOf(html);
      const roots = [path.join(ROOT, 'src')];
      for (const target of Object.values(map)) {
        if (typeof target === 'string' && relativeOf(target)) {
          const f = path.resolve(ROOT, target);
          if (f.endsWith('.js')) roots.push(path.dirname(f));
        }
      }
      const seen = new Set();
      for (const root of roots) {
        for (const file of listJs(root)) {
          if (seen.has(file)) continue;
          seen.add(file);
          for (const spec of importsOf(fs.readFileSync(file, 'utf8'))) {
            if (spec.startsWith('/')) absolute.push(`${path.relative(ROOT, file)} -> ${spec}`);
            else if (relativeOf(spec) && !spec.includes('${')) check(file, spec);
          }
        }
      }
      for (const m of html.matchAll(/<script[^>]*\bsrc="(\.[^"]*)"[^>]*>/g)) {
        check(path.join(ROOT, 'index.html'), m[1]);
      }
      t.assert('all relative imports resolve', missing.length === 0, missing.join('; '));
      t.assert('no root-absolute imports in JS (404 under a subpath deploy)', absolute.length === 0, absolute.join('; '));
      t.assert('at least one relative import was checked', checked > 0);
    },
  },
  {
    name: 'no non-JS static imports (browsers reject CSS/asset module imports)',
    run(t) {
      const bad = [];
      for (const file of listJs(path.join(ROOT, 'src'))) {
        for (const spec of importsOf(fs.readFileSync(file, 'utf8'))) {
          if (relativeOf(spec) && !spec.includes('${') && !spec.endsWith('.js')) {
            bad.push(`${path.relative(ROOT, file)} imports ${spec}`);
          }
        }
      }
      t.assert('all static relative imports end in .js', bad.length === 0, bad.join('; '));
    },
  },
  {
    name: 'every import-map target exists on disk',
    run(t) {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const map = importMapOf(html);
      const entries = Object.entries(map);
      for (const [spec, target] of entries) {
        if (typeof target !== 'string' || !relativeOf(target)) continue;
        t.assert(
          `"${spec}" target exists (${target})`,
          fs.existsSync(path.resolve(ROOT, target)),
          'vendor file missing',
        );
      }
      t.assert('import map is non-empty', entries.length > 0, 'no importmap in index.html');
    },
  },
];
