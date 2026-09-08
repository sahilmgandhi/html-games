// Renaissance showcase (?showcase=demo-battle/renaissance): a scripted
// Renaissance match, both sides evolved to age 2 before kickoff, staged for
// screenshots. Mirrors the Castle showcase one folder over.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { BattleSim } from '../../simulation/battle.js';
import { mulberry32 } from '../../simulation/rng.js';
import { ParticleSystem3D } from '../../particles/particles.js';
import { attachBattleView, applyBattleAction } from '../battle-view.js';

export function runShowcase(game) {
  // The ambient world boots Stone; re-mood it before the first frame.
  const world = window.__world;
  world?.terrain?.setAge?.(2);
  world?.lighting?.setAge?.(2);
  world?.environment?.setAge?.(2);

  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  const sim = new BattleSim({
    seed: 7,
    rng: mulberry32(7),
    events: game.events,
    autoAI: true,
    autoPlayer: true,
  });
  // Evolve both sides twice (Stone -> Castle -> Renaissance), then stage a
  // mid-battle line like the other age showcases.
  sim.xp = 99999;
  sim.enemyXp = 99999;
  sim.evolve();
  sim.evolve();
  sim.evolveEnemy();
  sim.evolveEnemy();
  // Drain XP so the AI/auto-player cannot evolve further or fire specials.
  sim.xp = 0;
  sim.enemyXp = 0;
  // Staged spawns cost gold (Dueler 200 + Musketeer 400 + Cannoneer 1000
  // per side, hero 2500, Small 1500 + Large 3000); fund the full tableau.
  sim.gold = 10000;
  sim.enemyGold = 10000;
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
