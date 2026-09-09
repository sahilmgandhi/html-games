import { Game3D } from './core/Game3D.js';
import { createTerrain } from './terrain/terrain.js';
import { createLighting } from './lighting/lighting.js';
import { createEnvironment } from './environment/environment.js';
import { ParticleSystem3D } from './particles/particles.js';
import { HUD } from './hud/hud.js';
import { AudioManager } from './audio/audio.js';
import { BattleSim } from './simulation/battle.js';
import { CONFIG } from './simulation/config.js';
import { attachBattleView, applyBattleAction } from './demo-battle/battle-view.js';

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(`error: ${e.message}`));
window.addEventListener('unhandledrejection', (e) => {
  window.__errors.push(`rejection: ${e.reason?.message || e.reason}`);
});
const _consoleError = console.error.bind(console);
console.error = (...args) => {
  window.__errors.push(`console: ${args.map(String).join(' ')}`);
  _consoleError(...args);
};

const canvas = document.getElementById('gameCanvas');
const game = new Game3D(canvas);

const terrain = createTerrain(game.scene, 0);
const lighting = createLighting(game.scene);
const environment = createEnvironment(game.scene, 0);
const particles = new ParticleSystem3D(game.scene);
// Showcases and Wave 3 reuse the ambient world instead of duplicating it.
window.__world = { terrain, lighting, environment };
particles.setCamera(game.camera);
const hud = new HUD(document.body, game);
const audio = new AudioManager();
window.addEventListener('pointerdown', () => {
  audio.init();
  audio.startMusic(0);
}, { once: true });

const params = new URLSearchParams(location.search);
const showcase = params.get('showcase');

window.__hud = hud;
if (!showcase) {
  // Full playable battle: player via HUD, enemy via AI.
  // Named showcases (including demo-battle) stage their own scene instead.
  const sim = new BattleSim({
    seed: (Math.random() * 1e9) | 0,
    events: game.events,
    audio,
    autoAI: true,
    autoPlayer: false,
  });
  attachBattleView(game, sim, particles, { lockCamera: !!params.get('camera') });
  hud.on((action) => applyBattleAction(sim, action));
  window.__battle = sim;
}

game.onUpdate((dt) => {
  terrain.update(dt);
  lighting.update(dt);
  environment.update(dt);
  particles.update(dt);
  hud.update(window.__battle ? window.__battle.hudState() : stubState());
});

// Placeholder state for module showcases (no battle running). Mirrors the
// BattleSim.hudState() shape so the HUD never renders 'undefined'.
function stubState() {
  const age = CONFIG.AGES[0];
  return {
    gold: CONFIG.STARTING_GOLD,
    xp: CONFIG.STARTING_XP,
    ageIndex: 0,
    ageName: age.name,
    units: age.units.map((u, i) => ({
      name: u.name, cost: u.cost, hotkey: String(i + 1),
      affordable: CONFIG.STARTING_GOLD >= u.cost,
      tier: 0, maxTier: CONFIG.MAX_UPGRADE_TIER,
      upgCost: Math.round(u.cost * CONFIG.UNIT_UPGRADE_COSTS[1]),
      upgAffordable: false,
      tooltip: `${u.name} · HP ${u.hp} · DMG ${u.damage} · RNG ${u.range}`,
    })),
    hero: {
      name: age.hero.name, cost: age.hero.cost, hotkey: 'H',
      affordable: false, cooldownSecs: 0,
    },
    evolve: { label: `Evolve: ${CONFIG.AGES[1].name}`, cost: CONFIG.EVOLVE_XP[1], affordable: false },
    special: { name: age.specialName, ready: false, status: '—', frac: 1 },
    slots: {
      bought: 0, max: CONFIG.TURRET_SLOTS, cost: CONFIG.TURRET_SLOT_COST, affordable: false, full: false,
    },
    turrets: age.turrets.map((t) => ({ name: t.name, cost: t.cost, placeable: false })),
    sell: [],
    buildings: CONFIG.BUILDINGS.map((b) => ({ name: b.name, cost: b.cost, affordable: false })),
    speeds: [1, 2, 3].map((s) => ({ speed: s, active: s === 1 })),
    formation: 'Scatter',
    paused: false,
    over: null,
    hint: CONFIG.HINT,
  };
}

if (params.get('camera')) game.setCameraPreset(params.get('camera'));
game.start();

if (showcase) {
  // Nested showcases (demo-battle/<age>) need static imports: Vite only
  // allows single-level dynamic import variables. Each age adds one line.
  const nested = {
    'demo-battle/castle': () => import('./demo-battle/castle/showcase.js'),
    'demo-battle/renaissance': () => import('./demo-battle/renaissance/showcase.js'),
    'demo-battle/modern': () => import('./demo-battle/modern/showcase.js'),
    'demo-battle/future': () => import('./demo-battle/future/showcase.js'),
  }[showcase];
  (nested ? nested() : import(`./${showcase}/showcase.js`))
    .then((m) => m.runShowcase?.(game))
    .catch((err) => window.__errors.push(`showcase: ${err.message}`));
}

export default game;
