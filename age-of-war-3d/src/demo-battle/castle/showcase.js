// Castle Age showcase (?showcase=demo-battle/castle): a scripted Castle Age
// match, both sides evolved before kickoff, staged for screenshots.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { BattleSim } from '../../simulation/battle.js';
import { mulberry32 } from '../../simulation/rng.js';
import { ParticleSystem3D } from '../../particles/particles.js';
import { attachBattleView, applyBattleAction } from '../battle-view.js';

export function runShowcase(game) {
  // The ambient world boots Stone; re-mood it before the first frame.
  const world = window.__world;
  world?.terrain?.setAge?.(1);
  world?.lighting?.setAge?.(1);
  world?.environment?.setAge?.(1);

  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  const sim = new BattleSim({
    seed: 7,
    rng: mulberry32(7),
    events: game.events,
    autoAI: true,
    autoPlayer: true,
  });
  // Evolve both sides, then stage a mid-battle line like the Stone showcase.
  sim.xp = 99999;
  sim.enemyXp = 99999;
  sim.evolve();
  sim.evolveEnemy();
  // Drain XP so the AI/auto-player cannot evolve further or fire specials.
  sim.xp = 0;
  sim.enemyXp = 0;
  sim.gold = 3000;
  sim.enemyGold = 3000;
  const line = [
    ['player', 0, 1000], ['player', 1, 1080], ['player', 2, 940],
    ['enemy', 0, 1400], ['enemy', 1, 1320], ['enemy', 2, 1460],
  ];
  for (const [side, idx, x] of line) {
    const u = sim.spawnUnitForSide(side, idx);
    if (u) u.x = x;
  }
  sim.spawnHero('player');
  sim.spawnTurretForSide('player', 0);
  sim.buySlot();
  sim.spawnTurretForSide('player', 1);
  attachBattleView(game, sim, fx);
  game.onUpdate((dt) => fx.update(dt));
  window.__battle = sim;
  window.__hud?.on((action) => applyBattleAction(sim, action));
}
