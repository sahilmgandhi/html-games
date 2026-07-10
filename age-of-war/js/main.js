const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.VIEWPORT.WIDTH;
canvas.height = CONFIG.VIEWPORT.HEIGHT;

let gameState = 'title';
let game = null;
let selectedDifficulty = 0;

const DIFF_BTN_W = 140;
const DIFF_BTN_H = 32;
const DIFF_BTN_Y = 370;

function getDiffBtnRect(i) {
  const totalW = CONFIG.DIFFICULTIES.length * (DIFF_BTN_W + 10) - 10;
  const startX = (canvas.width - totalW) / 2;
  return { x: startX + i * (DIFF_BTN_W + 10), y: DIFF_BTN_Y, w: DIFF_BTN_W, h: DIFF_BTN_H };
}

function drawTitleScreen() {
  ctx.fillStyle = '#0a0a1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = Date.now() / 1000;

  drawTitleBackground(t);

  ctx.shadowColor = '#e6a817';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AGE OF WAR', canvas.width / 2, 170);
  ctx.shadowBlur = 15;
  ctx.fillText('AGE OF WAR', canvas.width / 2, 170);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillText('A Strategy Game', canvas.width / 2, 215);

  drawTitleUnits();

  ctx.fillStyle = '#666';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('Select Difficulty', canvas.width / 2, DIFF_BTN_Y - 14);

  for (let i = 0; i < CONFIG.DIFFICULTIES.length; i++) {
    const d = CONFIG.DIFFICULTIES[i];
    const r = getDiffBtnRect(i);
    const sel = i === selectedDifficulty;

    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    if (sel) {
      grad.addColorStop(0, '#3a6a3a');
      grad.addColorStop(1, '#2a4a2a');
    } else {
      grad.addColorStop(0, '#2a2a3a');
      grad.addColorStop(1, '#1a1a2a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = sel ? '#4a8' : '#444';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.fillStyle = sel ? '#fff' : '#aaa';
    ctx.font = `${sel ? 'bold ' : ''}14px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(d.name, r.x + r.w / 2, r.y + 21);
  }

  const pulse = 0.6 + Math.sin(Date.now() / 500) * 0.4;
  ctx.shadowColor = '#e6a817';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.globalAlpha = pulse;
  ctx.fillText('Click to Start', canvas.width / 2, 430);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#555';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('WASD or Arrow Keys to scroll  |  Click units in HUD to spawn  |  ESC to pause', canvas.width / 2, 470);

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
  ctx.fillRect(0, groundY, canvas.width, 10);

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

canvas.addEventListener('click', (e) => {
  if (gameState === 'title') {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (let i = 0; i < CONFIG.DIFFICULTIES.length; i++) {
      const r = getDiffBtnRect(i);
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        selectedDifficulty = i;
        return;
      }
    }

    gameState = 'playing';
    startGame();
  }
});

function startGame() {
  game = new Game(canvas, ctx);
  game.difficulty = selectedDifficulty;
  game.start();
}

titleLoop();
