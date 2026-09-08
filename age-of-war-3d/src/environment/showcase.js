// Vista showcase: the ambient Stone Age world (built by main.js) under a
// slow scenic camera. No new content here — this shot IS the default scene.
export function runShowcase(game) {
  if (!window.__world) {
    window.__errors?.push('showcase: main ambient world missing');
    return;
  }
  game.renderer.camera.position.set(12, 6, 24);
  game.renderer.camera.lookAt(12, 3, -6);
}
