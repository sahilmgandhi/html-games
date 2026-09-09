import { applyBattleAction } from '../src/demo-battle/actions.js';

function fakeSim(overrides = {}) {
  const calls = [];
  return {
    calls,
    gameOver: false,
    paused: false,
    gameSpeed: 1,
    formationMode: 0,
    spawnUnit(i) { calls.push(['spawn-unit', i]); },
    upgradeUnit(i) { calls.push(['upgrade-unit', i]); },
    spawnHero() { calls.push(['spawn-hero']); },
    evolve() { calls.push(['evolve']); },
    useSpecial() { calls.push(['special']); },
    buySlot() { calls.push(['buy-slot']); },
    spawnTurret(i) { calls.push(['spawn-turret', i]); },
    sellTurret(i) { calls.push(['sell-turret', i]); },
    buyBuilding(i) { calls.push(['buy-building', i]); },
    restart() { calls.push(['restart']); },
    ...overrides,
  };
}

export default [
  {
    name: 'economy actions need a live sim, pause/restart always pass',
    run(t) {
      const sim = fakeSim();
      applyBattleAction(sim, { type: 'spawn-unit', index: 0 });
      t.assert('spawn passes while live', sim.calls.length === 1);

      sim.calls.length = 0;
      sim.paused = true;
      applyBattleAction(sim, { type: 'spawn-unit', index: 0 });
      t.assert('spawn blocked while paused', sim.calls.length === 0);
      applyBattleAction(sim, { type: 'restart' });
      t.assert('restart passes while paused', sim.calls.length === 1);

      sim.calls.length = 0;
      sim.paused = false;
      sim.gameOver = true;
      applyBattleAction(sim, { type: 'evolve' });
      t.assert('evolve blocked when over', sim.calls.length === 0);
      applyBattleAction(sim, { type: 'toggle-pause' });
      t.assert('pause toggle blocked when over', sim.calls.length === 0);
      applyBattleAction(sim, { type: 'restart' });
      t.assert('restart passes when over', sim.calls.length === 1);

      t.assert('null sim and null action are safe', (() => {
        applyBattleAction(null, { type: 'restart' });
        applyBattleAction(sim, null);
        return true;
      })());
    },
  },
  {
    name: 'speed pacing survives pause but dies with the game',
    run(t) {
      const sim = fakeSim({ paused: true });
      applyBattleAction(sim, { type: 'set-speed', speed: 3 });
      t.assert('set-speed applies while paused', sim.gameSpeed === 3);
      applyBattleAction(sim, { type: 'cycle-speed' });
      t.assert('cycle-speed wraps while paused', sim.gameSpeed === 1);

      sim.gameOver = true;
      sim.paused = false;
      applyBattleAction(sim, { type: 'set-speed', speed: 3 });
      t.assert('set-speed ignored when over', sim.gameSpeed === 1);
      applyBattleAction(sim, { type: 'cycle-speed' });
      t.assert('cycle-speed ignored when over', sim.gameSpeed === 1);

      applyBattleAction(sim, { type: 'set-speed', speed: 99 });
      t.assert('bogus speed resets instead of sticking', sim.gameSpeed === 1 || sim.gameOver);
    },
  },
  {
    name: 'formation cycles 0-1-2 only while live',
    run(t) {
      const sim = fakeSim();
      applyBattleAction(sim, { type: 'cycle-formation' });
      t.assert('formation advances', sim.formationMode === 1);
      sim.formationMode = 2;
      applyBattleAction(sim, { type: 'cycle-formation' });
      t.assert('formation wraps to 0', sim.formationMode === 0);
      sim.paused = true;
      applyBattleAction(sim, { type: 'cycle-formation' });
      t.assert('formation frozen while paused', sim.formationMode === 0);
    },
  },
];
