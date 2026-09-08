// Demo-battle showcase (?showcase=demo-battle): a scripted Stone Age match,
// both sides driven (player scripted, enemy AI), staged for screenshots.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { BattleSim } from '../simulation/battle.js';
import { mulberry32 } from '../simulation/rng.js';
import { ParticleSystem3D } from '../particles/particles.js';
import { attachBattleView, applyBattleAction } from './battle-view.js';

export function runShowcase(game) {
  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  const sim = new BattleSim({
    seed: 7,
    rng: mulberry32(7),
    events: game.events,
    autoAI: true,
    autoPlayer: true,
  });
  // Open mid-battle so the first screenshot already shows combat: spawn at
  // the gates, then march the lines to mid-field before first paint.
  sim.gold = 400;
  sim.enemyGold = 400;
  const line = [
    ['player', 0, 1000], ['player', 0, 1080], ['player', 1, 940],
    ['enemy', 0, 1400], ['enemy', 0, 1320], ['enemy', 1, 1460],
  ];
  for (const [side, idx, x] of line) {
    const u = sim.spawnUnitForSide(side, idx);
    if (u) u.x = x;
  }
  sim.spawnTurretForSide('player', 0);
  attachBattleView(game, sim, fx);
  game.onUpdate((dt) => fx.update(dt));
  window.__battle = sim;
  window.__hud?.on((action) => applyBattleAction(sim, action));
}
