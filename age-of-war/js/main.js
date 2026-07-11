const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.VIEWPORT.WIDTH;
canvas.height = CONFIG.VIEWPORT.HEIGHT;

let gameState = 'title';
let game = null;
let selectedDifficulty = 0;

const DIFF_BTN_W = 140;
const DIFF_BTN_H = 32;
const DIFF_BTN_Y = 390;

const audio = new AudioManager();
const ach = new Achievements();
const spriteManager = new SpriteManager();
let showSettings = false;
let showAchievements = false;

function getDiffBtnRect(i) {
  const totalW = CONFIG.DIFFICULTIES.length * (DIFF_BTN_W + 10) - 10;
  const startX = (canvas.width - totalW) / 2;
  return { x: startX + i * (DIFF_BTN_W + 10), y: DIFF_BTN_Y, w: DIFF_BTN_W, h: DIFF_BTN_H };
}

function drawTitleScreen() {
  ctx.fillStyle = '#0a0a1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const t = Date.now() / 1000;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  drawTitleBackground(t);

  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 64px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AGE OF WAR', canvas.width / 2, 170);
  ctx.fillText('AGE OF WAR', canvas.width / 2, 170);

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

  // Settings gear
  const gearX = 20;
  const gearY = 20;
  const gearS = 24;
  if (!showSettings) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(gearX + gearS / 2, gearY + gearS / 2, gearS / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2699', gearX + gearS / 2, gearY + gearS / 2);
    ctx.textBaseline = 'alphabetic';
  }

  // Settings panel
  if (showSettings) {
    const panelX = 10;
    const panelY = 10;
    const panelW = 200;
    const panelH = 90;
    ctx.fillStyle = 'rgba(8,8,20,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Settings', panelX + 12, panelY + 18);

    ctx.fillStyle = audio.musicEnabled ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(panelX + 12, panelY + 30, 176, 22);
    ctx.strokeStyle = audio.musicEnabled ? '#4a8' : '#844';
    ctx.strokeRect(panelX + 12, panelY + 30, 176, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Music: ' + (audio.musicEnabled ? 'ON' : 'OFF'), panelX + 100, panelY + 44);

    ctx.fillStyle = audio.sfxEnabled ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(panelX + 12, panelY + 56, 176, 22);
    ctx.strokeStyle = audio.sfxEnabled ? '#4a8' : '#844';
    ctx.strokeRect(panelX + 12, panelY + 56, 176, 22);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('SFX: ' + (audio.sfxEnabled ? 'ON' : 'OFF'), panelX + 100, panelY + 70);
  }

  const achY = DIFF_BTN_Y + 40;
  ctx.fillStyle = 'rgba(255,200,50,0.08)';
  ctx.fillRect(cx - 110, achY, 220, 24);
  ctx.strokeStyle = 'rgba(255,200,50,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 110, achY, 220, 24);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Achievements (' + ach.unlocked.length + '/' + ach.defs.length + ')', cx, achY + 16);

  // Achievement panel
  if (showAchievements) {
    const panelW = 400;
    const panelH = 420;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;
    ctx.fillStyle = 'rgba(8,8,20,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Achievements', cx, panelY + 24);

    for (let i = 0; i < ach.defs.length; i++) {
      const d = ach.defs[i];
      const unY = panelY + 40 + i * 30;
      const unlocked = ach.isUnlocked(d.id);
      ctx.fillStyle = unlocked ? 'rgba(255,215,0,0.1)' : 'rgba(40,40,40,0.3)';
      ctx.fillRect(panelX + 10, unY, panelW - 20, 26);
      ctx.strokeStyle = unlocked ? 'rgba(255,215,0,0.3)' : 'rgba(60,60,60,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX + 10, unY, panelW - 20, 26);

      ctx.fillStyle = unlocked ? '#ffd700' : '#555';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(unlocked ? '\u2605 ' + d.name : '  ' + d.name, panelX + 16, unY + 16);
      ctx.fillStyle = unlocked ? '#aaa' : '#444';
      ctx.font = '9px sans-serif';
      ctx.fillText(d.desc, panelX + 16, unY + 24);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click anywhere to close', cx, panelY + panelH - 8);
  }

  const pulse = 0.6 + Math.sin(Date.now() / 500) * 0.4;
  ctx.fillStyle = '#e6a817';
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.globalAlpha = pulse;
  ctx.fillText('Click to Start', cx, 470);
  ctx.globalAlpha = 1;

  const hintY = 490;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  const hints = [
    '1-9: Spawn units | Space: Special | E: Evolve | H: Hero',
    'T: Speed | F5: Save | F8: Load | B/N: Buildings',
    '\u2191\u2193\u2190\u2192/A/D: Scroll | ESC/P: Pause',
  ];
  for (let i = 0; i < hints.length; i++) {
    ctx.fillText(hints[i], cx, hintY + i * 14);
  }

}

function drawTitleBackground(t) {
  const groundY = 310;

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
  const groundY = 310;

  const units = [
    { type: 'melee', age: 0, x: -100 },
    { type: 'melee', age: 2, x: 0 },
    { type: 'ranged', age: 4, x: 100 },
  ];

  for (const u of units) {
    ctx.save();
    ctx.translate(cx + u.x, groundY);
    const bob = Math.sin(t * 3 + u.x * 0.01) * 2;
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
    const cx = canvas.width / 2;

    // Settings gear
    if (!showSettings && pointInRect(mx, my, 20, 20, 24, 24)) {
      showSettings = true;
      return;
    }

    // Settings panel
    if (showSettings) {
      if (pointInRect(mx, my, 22, 40, 176, 22)) {
        audio.musicEnabled = !audio.musicEnabled;
        return;
      }
      if (pointInRect(mx, my, 22, 66, 176, 22)) {
        audio.sfxEnabled = !audio.sfxEnabled;
        return;
      }
      if (!pointInRect(mx, my, 10, 10, 200, 100)) {
        showSettings = false;
        return;
      }
      return;
    }

    // Achievement gallery
    if (showAchievements) {
      showAchievements = false;
      return;
    }
    const achY = DIFF_BTN_Y + 40;
    if (pointInRect(mx, my, cx - 110, achY, 220, 24)) {
      showAchievements = true;
      return;
    }

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
