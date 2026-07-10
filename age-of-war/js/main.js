const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.VIEWPORT.WIDTH;
canvas.height = CONFIG.VIEWPORT.HEIGHT;

let gameState = 'title';

function drawTitleScreen() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AGE OF WAR', canvas.width / 2, 180);

  ctx.fillStyle = '#aaa';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillText('A Strategy Game', canvas.width / 2, 230);

  ctx.fillStyle = '#e6a817';
  ctx.font = '22px "Segoe UI", sans-serif';
  const pulse = 0.7 + Math.sin(Date.now() / 500) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('Click to Start', canvas.width / 2, 420);
  ctx.globalAlpha = 1;

  drawTitleUnits();
}

function drawTitleUnits() {
  const t = Date.now() / 1000;
  const cx = canvas.width / 2;

  drawStoneClubman(cx - 120, 340, 1.8, t);
  drawCastleSwordsman(cx - 40, 340, 1.8, t);
  drawModernTank(cx + 40, 340, 1.8, t);
  drawFutureLaserMech(cx + 120, 340, 1.8, t);
}

function drawStoneClubman(x, y, scale, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bob = Math.sin(t * 3) * 2;
  ctx.translate(0, bob);

  ctx.fillStyle = '#8B7355';
  ctx.fillRect(-5, -8, 10, 20);

  ctx.fillStyle = '#D2B48C';
  ctx.beginPath();
  ctx.arc(0, -16, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(16, -14);
  ctx.stroke();

  ctx.restore();
}

function drawCastleSwordsman(x, y, scale, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bob = Math.sin(t * 3 + 1) * 2;
  ctx.translate(0, bob);

  ctx.fillStyle = '#444';
  ctx.fillRect(-5, -8, 10, 20);

  ctx.fillStyle = '#C0C0C0';
  ctx.beginPath();
  ctx.arc(0, -16, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(8, -20);
  ctx.stroke();

  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(-3, -24, 6, 6);

  ctx.restore();
}

function drawModernTank(x, y, scale, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#556B2F';
  ctx.fillRect(-14, -4, 28, 10);
  ctx.fillRect(-10, -12, 16, 10);

  ctx.fillStyle = '#333';
  ctx.fillRect(-14, 6, 6, 4);
  ctx.fillRect(8, 6, 6, 4);

  ctx.strokeStyle = '#556B2F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(20, -6);
  ctx.stroke();

  ctx.restore();
}

function drawFutureLaserMech(x, y, scale, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bob = Math.sin(t * 3 + 3) * 2;
  ctx.translate(0, bob);

  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(-6, -10, 12, 24);

  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(0, -18, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 6;
  ctx.fillRect(8, -4, 16, 3);
  ctx.shadowBlur = 0;

  ctx.restore();
}

canvas.addEventListener('click', () => {
  if (gameState === 'title') {
    gameState = 'playing';
    startGame();
  }
});

function startGame() {
  const game = new Game(canvas, ctx);
  game.start();
}
