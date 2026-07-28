// Headless test harness: stubs the browser APIs the game touches, loads the real game
// sources in the order index.html declares, and exposes helpers for driving real frames.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GAME_ROOT = path.join(__dirname, '..');
const INDEX_HTML = path.join(GAME_ROOT, 'index.html');
const SCRIPT_TAG = /<script\b([^>]*)>/g;
const SRC_ATTR = /\bsrc\s*=\s*"([^"]+)"/;
const ENTRY_ATTR = /\bdata-entry\b/;

global.document = {
  getElementById() { return this.createElement('canvas'); },
  createElement(tag) {
    if (tag === 'canvas') {
      return {
        width: 960, height: 540, style: {},
        addEventListener() {},
        getContext() {
          return {
            fillStyle: '', strokeStyle: '', lineWidth: 1,
            globalAlpha: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
            save() {}, restore() {}, beginPath() {}, closePath() {}, clip() {},
            moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, rect() {}, fill() {}, stroke() {},
            fillRect() {}, strokeRect() {}, clearRect() {}, fillText() {}, strokeText() {},
            measureText(text) { return { width: text.length * 6 }; },
            createLinearGradient() { return { addColorStop() {} }; },
            createRadialGradient() { return { addColorStop() {} }; },
            setLineDash() {}, translate() {}, rotate() {}, scale() {}, drawImage() {},
          };
        },
      };
    }
    return {};
  },
  addEventListener() {},
};

global.window = { addEventListener() {} };
global.performance = { now: () => Date.now() };

global.localStorage = {
  _data: new Map(),
  getItem(k) { return this._data.has(k) ? this._data.get(k) : null; },
  setItem(k, v) { this._data.set(k, String(v)); },
  removeItem(k) { this._data.delete(k); },
};

// index.html is the single source of truth for load order. Entries tagged data-entry are
// browser-only (immediate side effects on load) and are excluded here.
function sourceFiles() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  return [...html.matchAll(SCRIPT_TAG)]
    .map((m) => m[1])
    .filter((attrs) => !ENTRY_ATTR.test(attrs))
    .map((attrs) => (attrs.match(SRC_ATTR) || [])[1])
    .filter((src) => src && src.startsWith('js/'));
}

function loadSources() {
  const files = sourceFiles();
  if (files.length === 0) throw new Error(`No <script src="js/..."> tags found in ${INDEX_HTML}`);

  for (const src of files) {
    const file = path.join(GAME_ROOT, src);
    let code;
    try {
      code = fs.readFileSync(file, 'utf8');
    } catch (e) {
      throw new Error(`${src} is listed in index.html but could not be read: ${e.message}`);
    }
    try {
      vm.runInThisContext(code, { filename: src });
    } catch (e) {
      throw new Error(`Failed to load ${src}: ${e.message}`);
    }
  }

  return files;
}

function makeGame() {
  const canvas = document.createElement('canvas');
  return new Game(canvas, canvas.getContext('2d'));
}

function runFrames(game, seconds, speed = 1) {
  const dt = 1 / 60;
  const frames = Math.ceil(seconds * 60);
  for (let i = 0; i < frames; i++) {
    game.update(dt * speed);
  }
}

module.exports = { GAME_ROOT, loadSources, sourceFiles, makeGame, runFrames };
