import { BaseMesh } from './bases.js';

// Both strongholds: player at full health, enemy battered to 30% so the
// damage states (rubble, fallen timber, torn banner) read on camera.
export function runShowcase(game) {
  const player = BaseMesh('player', 0);
  player.mesh.position.set(1, 0, 0);
  player.setHp(1);
  game.scene.add(player.mesh);

  const enemy = BaseMesh('enemy', 0);
  enemy.mesh.position.set(23, 0, 0);
  enemy.setHp(0.3);
  game.scene.add(enemy.mesh);

  game.renderer.camera.position.set(12, 7.5, 27);
  game.renderer.camera.lookAt(12, 2.5, 0);

  game.onUpdate((dt) => {
    player.update(dt);
    enemy.update(dt);
  });
}
