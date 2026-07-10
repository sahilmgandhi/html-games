const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.VIEWPORT.WIDTH;
canvas.height = CONFIG.VIEWPORT.HEIGHT;

let gameState = 'title';
let game = null;

function drawTitleScreen() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = Date.now() / 1000;

  drawTitleBackground(t);

  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#e6a817';
  ctx.shadowBlur = 20;
  ctx.fillText('AGE OF WAR', canvas.width / 2, 180);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#aaa';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillText('A Strategy Game', canvas.width / 2, 230);

  ctx.fillStyle = '#e6a817';
  ctx.font = '22px "Segoe UI", sans-serif';
  const pulse = 0.7 + Math.sin(Date.now() / 500) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Click to Start', canvas.width / 2, 440);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#666';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('WASD or Arrow Keys to scroll  |  Click units in HUD to spawn  |  ESC to pause', canvas.width / 2, 480);

  drawTitleUnits();
}

function drawTitleBackground(t) {
  const groundY = 380;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0a1e');
  grad.addColorStop(0.5, '#1a1a3e');
  grad.addColorStop(1, '#2a2a4e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1a1a10';
  for (let i = 0; i < 5; i++) {
    const mx = (i * 500 + t * 3) % (canvas.width + 200) - 100;
    const mh = 40 + Math.sin(i * 2.1) * 20;
    ctx.beginPath();
    ctx.moveTo(mx - 60, groundY);
    ctx.lineTo(mx, groundY - mh);
    ctx.lineTo(mx + 60, groundY);
    ctx.fill();
  }

  ctx.fillStyle = '#2a2a1a';
  ctx.fillRect(0, groundY, canvas.height - groundY, 10);

  for (let i = 0; i < 8; i++) {
    const tx = (i * 160 + 30) % canvas.width;
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(tx - 2, groundY + 10, 4, 20);
    ctx.fillStyle = '#2a4a1a';
    ctx.beginPath();
    ctx.arc(tx, groundY + 5, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 4; i++) {
    const cx = (i * 350 + t * 8) % (canvas.width + 200) - 100;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.ellipse(cx, 60 + i * 20, 50 + i * 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTitleUnits() {
  const t = Date.now() / 1000;
  const cx = canvas.width / 2;
  const groundY = 380;

  const units = [
    { type: 'melee', age: 0, x: -160 },
    { type: 'melee', age: 1, x: -50 },
    { type: 'armored', age: 3, x: 60 },
    { type: 'ranged', age: 4, x: 170 },
  ];

  for (const u of units) {
    ctx.save();
    ctx.translate(cx + u.x, groundY);
    ctx.scale(1.8, 1.8);
    const bob = Math.sin(t * 3 + u.x * 0.01) * 3;
    ctx.translate(0, bob);
    spriteManager.draw(ctx, u.type, u.age, 0, 0, 1);
    ctx.restore();
  }
}

function titleLoop() {
  if (gameState === 'title') {
    drawTitleScreen();
    requestAnimationFrame(titleLoop);
  }
}

canvas.addEventListener('click', () => {
  if (gameState === 'title') {
    gameState = 'playing';
    startGame();
  }
});

function startGame() {
  game = new Game(canvas, ctx);
  game.start();
}

titleLoop();
