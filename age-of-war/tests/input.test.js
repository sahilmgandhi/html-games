const { makeGame } = require('./harness');

module.exports = [
  {
    name: 'Canvas Click Scaling',
    run(t) {
      // fitCanvas() CSS-scales the canvas, so client coords must be divided by the
      // CSS/backing-store ratio before they can be hit-tested against HUD rects.
      const canvas = {
        width: CONFIG.VIEWPORT.WIDTH,
        height: CONFIG.VIEWPORT.HEIGHT,
        getBoundingClientRect: () => ({ left: 40, top: 10, width: 600, height: 300 }),
      };
      const p = canvasPoint(canvas, 40 + 300, 10 + 150);
      t.assert('Click maps to canvas center on a half-size canvas',
        p.x === CONFIG.VIEWPORT.WIDTH / 2 && p.y === CONFIG.VIEWPORT.HEIGHT / 2, `x=${p.x} y=${p.y}`);
      const origin = canvasPoint(canvas, 40, 10);
      t.assert('Canvas origin maps to (0,0)', origin.x === 0 && origin.y === 0);

      const unscaled = { ...canvas, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 600 }) };
      const q = canvasPoint(unscaled, 168, 500);
      t.assert('Unscaled canvas is a pass-through', q.x === 168 && q.y === 500);
    },
  },
  {
    name: 'Key Normalization',
    run(t) {
      t.assert('Shifted letters normalize', normalizeKey('A') === 'a' && normalizeKey('D') === 'd');
      t.assert('Named keys pass through', normalizeKey('ArrowLeft') === 'ArrowLeft' && normalizeKey('F5') === 'F5');
      t.assert('Space passes through', normalizeKey(' ') === ' ');
    },
  },
  {
    name: 'Debug Click: Add Gold',
    run(t) {
      const g = makeGame();
      g.debugOpen = true;
      const panelY = (CONFIG.VIEWPORT.HEIGHT - 600) / 2;
      const panelX = CONFIG.VIEWPORT.WIDTH / 2 - 620 / 2;
      g.input.mouseX = panelX + 10;       // col1X (RESOURCES +5000)
      g.input.mouseY = panelY + 40 + 18;  // first button row
      const before = g.gold;
      g.handleDebugClick();
      t.assert('Debug +5000 gold applied', g.gold === before + 5000, `delta=${g.gold - before}`);
    },
  },
];
