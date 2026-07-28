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

// A canvas whose 2d context records nothing. getContext() memoizes and back-references its
// canvas, because real contexts do and the renderer sizes offscreen caches via ctx.canvas.
function makeCanvas() {
  const canvas = {
    width: 1200, height: 600, style: {},
    addEventListener() {},
    getContext() {
      if (!this._ctx) {
        this._ctx = {
          canvas: this,
          fillStyle: '', strokeStyle: '', lineWidth: 1,
          lineCap: 'butt', lineJoin: 'miter', miterLimit: 10,
          shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
          globalAlpha: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
          save() {}, restore() {}, beginPath() {}, closePath() {}, clip() {},
          moveTo() {}, lineTo() {}, arcTo() {}, quadraticCurveTo() {}, rect() {}, fill() {}, stroke() {},
          arc() {}, ellipse() {}, fillRect() {}, strokeRect() {}, clearRect() {},
          fillText() {}, strokeText() {},
          measureText(text) { return { width: text.length * 6 }; },
          createLinearGradient() { return { addColorStop() {} }; },
          createRadialGradient() { return { addColorStop() {} }; },
          setLineDash() {}, translate() {}, rotate() {}, scale() {}, drawImage() {},
        };
      }
      return this._ctx;
    },
  };
  return canvas;
}

global.document = {
  getElementById() { return makeCanvas(); },
  createElement(tag) { return tag === 'canvas' ? makeCanvas() : {}; },
  addEventListener() {},
};

global.window = { addEventListener() {}, AudioContext: null, webkitAudioContext: null };
global.performance = { now: () => Date.now() };
// isLocalhost() gates the debug panel; tests run as if served from localhost.
global.location = { hostname: 'localhost' };

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

  global.spriteManager = new SpriteManager();
  return files;
}

function makeGame() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const game = new Game(canvas, ctx);
  game.audio.initialized = true;
  game.audio.ctx = null;
  game.ai = new AI(game);
  game.started = true;
  return game;
}

function runFrames(game, seconds, speed = 1) {
  const dt = 1 / 60;
  const frames = Math.ceil(seconds * 60);
  for (let i = 0; i < frames; i++) {
    game.update(dt * speed);
  }
}

function makeAudioContext() {
  const param = () => ({
    setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
  });
  const node = () => ({
    connect() {}, start() {}, stop() {},
    frequency: param(), gain: param(), Q: param(),
  });
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createOscillator: node,
    createGain: node,
    createBiquadFilter: node,
    createBufferSource: node,
    createBuffer: (channels, length) => ({ getChannelData: () => new Float32Array(length) }),
  };
}

module.exports = { GAME_ROOT, loadSources, sourceFiles, makeGame, runFrames, makeAudioContext };
