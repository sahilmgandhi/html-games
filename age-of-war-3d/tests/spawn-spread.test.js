import { BattleSim } from '../src/simulation/battle.js';

// Instant multi-spawns must not stack on one x: a shared spawn point turns
// the 15px base hit radius into always-AoE. Seeded jitter spreads the muster
// without touching damage numbers.
export default [
  {
    name: 'rapid spawns spread around the gate',
    run(t) {
      const sim = new BattleSim({ seed: 11, autoAI: false });
      sim.gold = 1e6;
      for (let i = 0; i < 6; i++) sim.spawnUnit(0);
      const xs = sim.units.map((u) => u.x);
      const gate = sim.playerBase.x + 420;
      t.assert('not stacked on one x', new Set(xs.map(Math.round)).size >= 4, JSON.stringify(xs.map(Math.round)));
      t.assert('all near the gate', xs.every((x) => Math.abs(x - gate) < 60), JSON.stringify(xs.map(Math.round)));
    },
  },
];
