// Future showcase (?showcase=demo-battle/future): a scripted Future match,
// both sides evolved to age 4 before kickoff, staged for screenshots.
// Mirrors the Modern showcase one folder over.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { stageShowcase } from '../stage.js';

export function runShowcase(game) {
  stageShowcase(game, 4, (sim) => {
    // Evolve both sides four times (Stone -> Castle -> Renaissance ->
    // Modern -> Future), then stage a mid-battle line like the other ages.
    sim.xp = 99999;
    sim.enemyXp = 99999;
    sim.evolve();
    sim.evolve();
    sim.evolve();
    sim.evolve();
    sim.evolveEnemy();
    sim.evolveEnemy();
    sim.evolveEnemy();
    sim.evolveEnemy();
    // Drain XP so the AI/auto-player cannot evolve further or fire specials.
    sim.xp = 0;
    sim.enemyXp = 0;
    // Staged spawns cost gold (God's Blade 5000 + Blaster 6000 + War
    // Machine 20000 per side, hero 40000, Titanium 24000 + Lazer 40000);
    // fund the full tableau.
    sim.gold = 150000;
    sim.enemyGold = 150000;
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
