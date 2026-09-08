// Lighting showcase: the ambient world already carries the sun + hemi rig;
// frame both strongholds so key light, shadows and sky read in one shot.
export function runShowcase(game) {
  game.renderer.camera.position.set(12, 7.5, 27);
  game.renderer.camera.lookAt(12, 2.5, 0);
}
