import { BattleSim } from '../src/simulation/battle.js';
import { applyBattleAction, takesOverBot } from '../src/demo-battle/actions.js';

// Spectate/auto-play bot: HUD BOT button toggles in-sim scripted player.
// Manual gameplay actions take over (bot off); restart preserves bot state.
export default [
  {
    name: 'toggle-bot flips autoPlayer, guarded on game over',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      t.assert('bot off by default', sim.autoPlayer === false, String(sim.autoPlayer));
      applyBattleAction(sim, { type: 'toggle-bot' });
      t.assert('bot on after toggle', sim.autoPlayer === true, String(sim.autoPlayer));
      applyBattleAction(sim, { type: 'toggle-bot' });
      t.assert('bot off after second toggle', sim.autoPlayer === false, String(sim.autoPlayer));
      sim.gameOver = true;
      sim.winner = 'enemy';
      applyBattleAction(sim, { type: 'toggle-bot' });
      t.assert('toggle guarded on game over', sim.autoPlayer === false, String(sim.autoPlayer));
    },
  },
  {
    name: 'hudState exposes bot flag for the BOT button',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      t.assert('bot false initially', sim.hudState().bot === false, String(sim.hudState().bot));
      sim.autoPlayer = true;
      t.assert('bot mirrors autoPlayer', sim.hudState().bot === true, String(sim.hudState().bot));
    },
  },
  {
    name: 'takesOverBot marks manual gameplay actions only',
    run(t) {
      const manual = ['spawn-unit', 'upgrade-unit', 'spawn-hero', 'evolve', 'special',
        'buy-slot', 'spawn-turret', 'sell-turret', 'buy-building'];
      for (const type of manual) {
        t.assert(`${type} takes over`, takesOverBot({ type }) === true, type);
      }
      const nonTakeover = ['set-speed', 'cycle-speed', 'toggle-pause', 'cycle-difficulty',
        'restart', 'toggle-bot', 'gallery', 'unknown-type', null, undefined];
      for (const a of nonTakeover) {
        const action = a == null ? a : { type: a };
        t.assert(`${String(a)} keeps bot`, takesOverBot(action) === false, String(a));
      }
    },
  },
  {
    name: 'restart preserves bot state either way',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: false });
      sim.autoPlayer = true;
      sim.restart();
      t.assert('bot stays on across restart', sim.autoPlayer === true, String(sim.autoPlayer));
      sim.autoPlayer = false;
      sim.restart();
      t.assert('bot stays off across restart', sim.autoPlayer === false, String(sim.autoPlayer));
    },
  },
  {
    name: 'bot-driven competent sim wins on Easy',
    run(t) {
      const sim = new BattleSim({ seed: 7, autoAI: true, autoPlayer: true });
      let secs = 0;
      while (!sim.gameOver && secs < 1500) {
        sim.update(0.5);
        secs += 0.5;
      }
      t.assert('match resolves', sim.gameOver, `no winner after ${secs}s`);
      t.assert('bot wins', sim.winner === 'player',
        `winner=${sim.winner} t=${Math.round(secs)}s ` +
        `pHP=${Math.round(sim.playerBaseHp)} eHP=${Math.round(sim.enemyBaseHp)}`);
    },
  },
];
