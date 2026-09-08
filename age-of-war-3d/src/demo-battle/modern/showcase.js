// Modern showcase (?showcase=demo-battle/modern): a scripted Modern match,
// both sides evolved to age 3 before kickoff, staged for screenshots.
// Mirrors the Renaissance showcase one folder over.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { stageShowcase } from '../stage.js';

export function runShowcase(game) {
  stageShowcase(game, 3, (sim) => {
    // Evolve both sides three times (Stone -> Castle -> Renaissance ->
    // Modern), then stage a mid-battle line like the other age showcases.
    sim.xp = 99999;
    sim.enemyXp = 99999;
    sim.evolve();
    sim.evolve();
    sim.evolve();
    sim.evolveEnemy();
    sim.evolveEnemy();
    sim.evolveEnemy();
    // Drain XP so the AI/auto-player cannot evolve further or fire specials.
    sim.xp = 0;
    sim.enemyXp = 0;
    // Staged spawns cost gold (Melee 1500 + Infantry 2000 + Tank 7000 per
    // side, hero 12000, Single 7000 + Rocket 9000); fund the full tableau.
    sim.gold = 45000;
    sim.enemyGold = 45000;
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
