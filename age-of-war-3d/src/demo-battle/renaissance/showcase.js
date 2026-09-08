// Renaissance showcase (?showcase=demo-battle/renaissance): a scripted
// Renaissance match, both sides evolved to age 2 before kickoff, staged for
// screenshots. Mirrors the Castle showcase one folder over.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { stageShowcase } from '../stage.js';

export function runShowcase(game) {
  stageShowcase(game, 2, (sim) => {
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
  });
}
