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

  drawTitleUnit(cx - 160, groundY, 1.8, t, 0, '#8B7355', function(s) {
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath(); ctx.arc(0, -16, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(-5, -8, 10, 20);
    ctx.strokeStyle = '#6B5335'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(16, -14); ctx.stroke();
  });

  drawTitleUnit(cx - 50, groundY, 1.8, t, 1, '#4444aa', function(s) {
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath(); ctx.arc(0, -16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#444';
    ctx.fillRect(-5, -8, 10, 20);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(8, -20); ctx.stroke();
    ctx.fillStyle = '#C0C0C0'; ctx.fillRect(-3, -24, 6, 6);
  });

  drawTitleUnit(cx + 60, groundY, 1.8, t, 2, '#556B2F', function(s) {
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(-14, -4, 28, 10);
    ctx.fillRect(-10, -12, 16, 10);
    ctx.fillStyle = '#333';
    ctx.fillRect(-14, 6, 6, 4); ctx.fillRect(8, 6, 6, 4);
    ctx.strokeStyle = '#556B2F'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(20, -6); ctx.stroke();
  });

  drawTitleUnit(cx + 170, groundY, 1.8, t, 3, '#00e5ff', function(s) {
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(-6, -10, 12, 24);
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, -18, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(8, -4, 16, 3);
    ctx.shadowBlur = 0;
  });
}

function drawTitleUnit(x, groundY, scale, t, index, color, drawFn) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  const bob = Math.sin(t * 3 + index * 1.2) * 3;
  ctx.translate(0, bob);

  drawFn();

  ctx.restore();
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
