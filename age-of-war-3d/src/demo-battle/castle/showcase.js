// Castle Age showcase (?showcase=demo-battle/castle): a scripted Castle Age
// match, both sides evolved before kickoff, staged for screenshots.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { stageShowcase } from '../stage.js';

export function runShowcase(game) {
  stageShowcase(game, 1, (sim) => {
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
  });
}
