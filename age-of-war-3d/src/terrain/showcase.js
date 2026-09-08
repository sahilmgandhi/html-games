// Terrain showcase: slow drift down the lane showing ground, lane strip,
// horizon skirt and sky dome of the Stone Age battlefield.
export function runShowcase(game) {
  game.renderer.camera.position.set(12, 9, 26);
  game.renderer.camera.lookAt(12, 1, 0);
  let t = 0;
  game.onUpdate((dt) => {
    t += dt;
    const x = 12 + Math.sin(t * 0.12) * 6;
    game.renderer.camera.position.set(x, 9, 26);
    game.renderer.camera.lookAt(x, 1, 0);
  });
}
