// Shared staging for the scripted age showcases (?showcase=demo-battle,
// demo-battle/castle, demo-battle/renaissance, ...). Re-moods the ambient
// world to the target age, builds a seeded mid-battle sim, lets the caller
// stage it, then attaches the battle view and HUD wiring.
// Contract: stageShowcase(game, age, stage) -> BattleSim
import { BattleSim } from '../simulation/battle.js';
import { mulberry32 } from '../simulation/rng.js';
import { ParticleSystem3D } from '../particles/particles.js';
import { attachBattleView, applyBattleAction } from './battle-view.js';

export function stageShowcase(game, age, stage) {
  // The ambient world boots Stone; re-mood it before the first frame.
  const world = window.__world;
  world?.terrain?.setAge?.(age);
  world?.lighting?.setAge?.(age);
  world?.environment?.setAge?.(age);

  const fx = new ParticleSystem3D(game.scene);
  fx.setCamera(game.camera);
  const sim = new BattleSim({
    seed: 7,
    rng: mulberry32(7),
    events: game.events,
    autoAI: true,
    autoPlayer: true,
  });
  stage(sim);
  attachBattleView(game, sim, fx);
  game.onUpdate((dt) => fx.update(dt));
  window.__battle = sim;
  window.__hud?.on((action) => applyBattleAction(sim, action));
  return sim;
}
