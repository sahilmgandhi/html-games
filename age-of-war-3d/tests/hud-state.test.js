import { BattleSim } from '../src/simulation/battle.js';

// The HUD danger vignette keys off hudState().base.frac: full HP reads 1,
// gate damage tracks down from there.
export default [
  {
    name: 'hudState exposes player base HP fraction',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      t.assert('full at start', sim.hudState().base.frac === 1, JSON.stringify(sim.hudState().base));
      sim.playerBase.takeDamage(sim.playerBase.maxHp * 0.8);
      const frac = sim.hudState().base.frac;
      t.assert('tracks damage', Math.abs(frac - 0.2) < 1e-9, `frac=${frac}`);
    },
  },
];
