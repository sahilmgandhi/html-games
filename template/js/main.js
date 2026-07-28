// Browser entry point. Runs side effects immediately, so index.html marks it data-entry
// and the test harness skips it — everything testable belongs in game.js.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.VIEWPORT.WIDTH;
canvas.height = CONFIG.VIEWPORT.HEIGHT;

function fitCanvas() {
  const aspect = CONFIG.VIEWPORT.WIDTH / CONFIG.VIEWPORT.HEIGHT;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  canvas.style.width = Math.round(w) + 'px';
  canvas.style.height = Math.round(h) + 'px';
}

window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
fitCanvas();

let game = null;
let lastTime = 0;

function drawTitle() {
  ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
  ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = CONFIG.COLORS.TEXT;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('__GAME_NAME__', CONFIG.VIEWPORT.WIDTH / 2, CONFIG.VIEWPORT.HEIGHT / 2 - 20);
  ctx.fillStyle = CONFIG.COLORS.DIM;
  ctx.font = '18px sans-serif';
  ctx.fillText('Click to start', CONFIG.VIEWPORT.WIDTH / 2, CONFIG.VIEWPORT.HEIGHT / 2 + 30);
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', (e) => {
  const p = canvasPoint(canvas, e.clientX, e.clientY);
  if (!game) {
    game = new Game(canvas, ctx);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  } else if (game.gameOver) {
    game.restart();
  }
  game.aimAt(p.x, p.y);
});

canvas.addEventListener('mousemove', (e) => {
  if (!game || game.gameOver) return;
  const p = canvasPoint(canvas, e.clientX, e.clientY);
  game.aimAt(p.x, p.y);
});

drawTitle();
