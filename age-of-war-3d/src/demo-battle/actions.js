// Maps HUD actions onto a BattleSim.
//
// Pacing (set-speed/cycle-speed) stays available while paused so the player
// can change speed mid-pause; everything else needs a live sim. Pause toggle
// and restart always go through (restart is the way out of game-over).
export function applyBattleAction(sim, action) {
  if (!sim || !action) return;
  const live = !sim.gameOver && !sim.paused;
  switch (action.type) {
    case 'spawn-unit': if (live) sim.spawnUnit(action.index); break;
    case 'upgrade-unit': if (live) sim.upgradeUnit(action.index); break;
    case 'spawn-hero': if (live) sim.spawnHero('player'); break;
    case 'evolve': if (live) sim.evolve(); break;
    case 'special': if (live) sim.useSpecial(); break;
    case 'buy-slot': if (live) sim.buySlot(); break;
    case 'spawn-turret': if (live) sim.spawnTurret(action.index); break;
    case 'sell-turret': if (live) sim.sellTurret(action.index); break;
    case 'buy-building': if (live) sim.buyBuilding(action.index); break;
    case 'set-speed':
      if (!sim.gameOver) sim.gameSpeed = [1, 2, 3].includes(action.speed) ? action.speed : 1;
      break;
    case 'cycle-speed':
      if (!sim.gameOver) sim.gameSpeed = sim.gameSpeed >= 3 ? 1 : sim.gameSpeed + 1;
      break;
    case 'toggle-pause': if (!sim.gameOver) sim.paused = !sim.paused; break;
    case 'cycle-difficulty':
      if (!sim.gameOver) sim.setDifficulty(sim.difficulty + 1);
      break;
    case 'restart': sim.restart(); break;
    case 'toggle-bot': if (!sim.gameOver) sim.autoPlayer = !sim.autoPlayer; break;
    default: break;
  }
}

// Manual gameplay actions hand control to the player: when the spectate bot
// is on, any of these switches it off (takeover). Pacing, pause, difficulty,
// restart, the bot toggle itself and navigation never disengage the bot.
// Pure so the live-battle handler and node tests share one definition.
const TAKEOVER_ACTIONS = new Set([
  'spawn-unit', 'upgrade-unit', 'spawn-hero', 'evolve', 'special',
  'buy-slot', 'spawn-turret', 'sell-turret', 'buy-building',
]);
export function takesOverBot(action) {
  return !!action && TAKEOVER_ACTIONS.has(action.type);
}
