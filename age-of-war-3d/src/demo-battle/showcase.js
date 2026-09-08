// Demo-battle showcase (?showcase=demo-battle): a scripted Stone Age match,
// both sides driven (player scripted, enemy AI), staged for screenshots.
// Contract: runShowcase(game) -> void (registers its own update via the view).
import { stageShowcase } from './stage.js';

export function runShowcase(game) {
  stageShowcase(game, 0, (sim) => {
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
  });
}
