const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px } = require('./helpers');

const TC = TEAM_BLUE;

// ═══════════════════════════════════════════════════════════
// AGE 0 — Stone Age Turrets
// ═══════════════════════════════════════════════════════════

// Rock Slingshot: forked wooden post + rock in sling
function drawTurret_0_0(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 20);
  // wooden post
  rect(ctx, cx - 4, 40, 8, 36, grad(ctx, cx - 4, 40, 8, 36, '#7a5a2a', '#4a3216'));
  outlineRect(ctx, cx - 4, 40, 8, 36, '#3a2a10');
  // fork prongs
  rect(ctx, cx - 10, 26, 5, 18, '#6a4a22'); outlineRect(ctx, cx - 10, 26, 5, 18, '#3a2a10');
  rect(ctx, cx + 5, 26, 5, 18, '#6a4a22'); outlineRect(ctx, cx + 5, 26, 5, 18, '#3a2a10');
  // wood grain
  for (let i = 0; i < 4; i++) line(ctx, cx - 2, 44 + i * 8, cx + 2, 44 + i * 8, '#5a3a16', 0.5);
  for (let i = 0; i < 3; i++) line(ctx, cx - 8, 30 + i * 5, cx - 6, 30 + i * 5, '#4a3216', 0.5);
  // rope bindings
  rect(ctx, cx - 5, 38, 10, 2, '#c2a060'); rect(ctx, cx - 5, 42, 10, 2, '#c2a060');
  rect(ctx, cx - 11, 34, 3, 2, '#c2a060'); rect(ctx, cx + 8, 34, 3, 2, '#c2a060');
  // rubber bands
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 8, 28); ctx.lineTo(cx, 22); ctx.lineTo(cx + 8, 28); ctx.stroke();
  // rock
  const rg = rgrad(ctx, cx, 18, 7, '#b0a090', '#6a5a48');
  circle(ctx, cx, 18, 7, rg); outlineCircle(ctx, cx, 18, 7, '#4a3a28');
  px(ctx, cx - 2, 16, '#c0b0a0'); px(ctx, cx - 1, 17, '#c0b0a0');
  // team color band
  rect(ctx, cx - 5, 50, 10, 3, TC.accent);
}

// Egg Automatic: tall post with stacked eggs
function drawTurret_0_1(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 16);
  // post
  rect(ctx, cx - 4, 32, 8, 44, grad(ctx, cx - 4, 32, 8, 44, '#7a5a2a', '#4a3216'));
  outlineRect(ctx, cx - 4, 32, 8, 44, '#3a2a10');
  for (let i = 0; i < 5; i++) line(ctx, cx - 2, 36 + i * 7, cx + 2, 36 + i * 7, '#5a3a16', 0.5);
  // rope
  rect(ctx, cx - 5, 44, 10, 2, '#c2a060');
  // platform
  rect(ctx, cx - 12, 28, 24, 4, '#6a4a22'); outlineRect(ctx, cx - 12, 28, 24, 4, '#3a2a10');
  // eggs (3 stacked)
  const eggG1 = rgrad(ctx, cx - 4, 22, 5, '#f0e8d0', '#c8b898');
  circle(ctx, cx - 4, 22, 5, eggG1); outlineCircle(ctx, cx - 4, 22, 5, '#a89878');
  const eggG2 = rgrad(ctx, cx + 4, 18, 5, '#f0e8d0', '#c8b898');
  circle(ctx, cx + 4, 18, 5, eggG2); outlineCircle(ctx, cx + 4, 18, 5, '#a89878');
  const eggG3 = rgrad(ctx, cx, 14, 5, '#f0e8d0', '#c8b898');
  circle(ctx, cx, 14, 5, eggG3); outlineCircle(ctx, cx, 14, 5, '#a89878');
  // egg spots
  px(ctx, cx - 5, 21, '#d8c8a8'); px(ctx, cx + 3, 17, '#d8c8a8'); px(ctx, cx - 1, 13, '#d8c8a8');
  // team color
  rect(ctx, cx - 5, 50, 10, 3, TC.accent);
}

// Primitive Catapult: A-frame + throwing arm
function drawTurret_0_2(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 28);
  // A-frame legs
  line(ctx, cx - 14, 60, cx - 4, 30, '#5a3a16', 4);
  line(ctx, cx + 14, 60, cx + 4, 30, '#5a3a16', 4);
  // cross brace
  line(ctx, cx - 10, 48, cx + 10, 48, '#5a3a16', 2);
  // pivot
  circle(ctx, cx, 34, 4, '#3a2a10'); circle(ctx, cx, 34, 2, '#6a5a3a');
  // throwing arm
  ctx.save(); ctx.translate(cx, 34); ctx.rotate(-0.5);
  rect(ctx, -2, -20, 4, 24, '#6a4a22'); outlineRect(ctx, -2, -20, 4, 24, '#3a2a10');
  // bucket
  rect(ctx, -6, -24, 12, 6, '#7a5a2a'); outlineRect(ctx, -6, -24, 12, 6, '#3a2a10');
  circle(ctx, 0, -26, 6, '#8a7a5a'); outlineCircle(ctx, 0, -26, 6, '#5a4a2a');
  ctx.restore();
  // rope
  ctx.strokeStyle = '#c2a060'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 8, 30); ctx.lineTo(cx + 2, 44); ctx.stroke();
  // team color band
  rect(ctx, cx - 14, 56, 28, 3, TC.accent);
  // wood texture
  for (let i = 0; i < 3; i++) {
    line(ctx, cx - 12 + i * 5, 50, cx - 12 + i * 5, 58, '#4a3216', 0.5);
  }
}

// ═══════════════════════════════════════════════════════════
// AGE 1 — Castle Age Turrets
// ═══════════════════════════════════════════════════════════

// Catapult: wooden frame + stone projectile
function drawTurret_1_0(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 24);
  // base platform
  rect(ctx, cx - 14, 52, 28, 12, grad(ctx, cx - 14, 52, 28, 12, '#6a5436', '#3a2a18'));
  outlineRect(ctx, cx - 14, 52, 28, 12, '#2a1a0c');
  // wood grain
  for (let i = 0; i < 4; i++) line(ctx, cx - 12 + i * 7, 54, cx - 12 + i * 7, 62, '#4a3a20', 0.5);
  // wheels
  circle(ctx, cx - 12, 66, 5, '#4a3a20'); circle(ctx, cx + 12, 66, 5, '#4a3a20');
  outlineCircle(ctx, cx - 12, 66, 5, '#2a1a0c'); outlineCircle(ctx, cx + 12, 66, 5, '#2a1a0c');
  circle(ctx, cx - 12, 66, 2, '#2a1a0c'); circle(ctx, cx + 12, 66, 2, '#2a1a0c');
  for (let a = 0; a < 4; a++) {
    const angle = a * Math.PI / 2;
    line(ctx, cx - 12, 66, cx - 12 + Math.cos(angle) * 4, 66 + Math.sin(angle) * 4, '#2a1a0c', 1);
    line(ctx, cx + 12, 66, cx + 12 + Math.cos(angle) * 4, 66 + Math.sin(angle) * 4, '#2a1a0c', 1);
  }
  // side walls
  rect(ctx, cx - 14, 36, 6, 16, grad(ctx, cx - 14, 36, 6, 16, '#5a4a2a', '#3a2a14'));
  rect(ctx, cx + 8, 36, 6, 16, grad(ctx, cx + 8, 36, 6, 16, '#5a4a2a', '#3a2a14'));
  outlineRect(ctx, cx - 14, 36, 6, 16, '#2a1a0c'); outlineRect(ctx, cx + 8, 36, 6, 16, '#2a1a0c');
  // arm
  ctx.save(); ctx.translate(cx, 40); ctx.rotate(-0.4);
  rect(ctx, -2, -20, 4, 24, '#5a4a2a'); outlineRect(ctx, -2, -20, 4, 24, '#2a1a0c');
  // bucket/basket
  rect(ctx, -6, -24, 12, 6, '#6a5436'); outlineRect(ctx, -6, -24, 12, 6, '#3a2a18');
  ctx.restore();
  // team color band
  rect(ctx, cx - 14, 50, 28, 3, TC.accent);
}

// Fire Catapult: same but with fire bucket
function drawTurret_1_1(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 24);
  rect(ctx, cx - 14, 52, 28, 12, grad(ctx, cx - 14, 52, 28, 12, '#6a5436', '#3a2a18'));
  outlineRect(ctx, cx - 14, 52, 28, 12, '#2a1a0c');
  for (let i = 0; i < 4; i++) line(ctx, cx - 12 + i * 7, 54, cx - 12 + i * 7, 62, '#4a3a20', 0.5);
  circle(ctx, cx - 12, 66, 5, '#4a3a20'); circle(ctx, cx + 12, 66, 5, '#4a3a20');
  outlineCircle(ctx, cx - 12, 66, 5, '#2a1a0c'); outlineCircle(ctx, cx + 12, 66, 5, '#2a1a0c');
  circle(ctx, cx - 12, 66, 2, '#2a1a0c'); circle(ctx, cx + 12, 66, 2, '#2a1a0c');
  for (let a = 0; a < 4; a++) {
    const angle = a * Math.PI / 2;
    line(ctx, cx - 12, 66, cx - 12 + Math.cos(angle) * 4, 66 + Math.sin(angle) * 4, '#2a1a0c', 1);
    line(ctx, cx + 12, 66, cx + 12 + Math.cos(angle) * 4, 66 + Math.sin(angle) * 4, '#2a1a0c', 1);
  }
  rect(ctx, cx - 14, 36, 6, 16, grad(ctx, cx - 14, 36, 6, 16, '#5a4a2a', '#3a2a14'));
  rect(ctx, cx + 8, 36, 6, 16, grad(ctx, cx + 8, 36, 6, 16, '#5a4a2a', '#3a2a14'));
  outlineRect(ctx, cx - 14, 36, 6, 16, '#2a1a0c'); outlineRect(ctx, cx + 8, 36, 6, 16, '#2a1a0c');
  ctx.save(); ctx.translate(cx, 40); ctx.rotate(-0.7);
  rect(ctx, -2, -20, 4, 24, '#8a3a16'); outlineRect(ctx, -2, -20, 4, 24, '#4a1a08');
  // fire pot
  rect(ctx, -6, -24, 12, 6, '#6a2a10'); outlineRect(ctx, -6, -24, 12, 6, '#3a1a06');
  // flames
  const fG = rgrad(ctx, 0, -30, 6, '#ff6a0a', '#ff2a0a');
  circle(ctx, 0, -30, 5, fG);
  px(ctx, -2, -33, '#ffaa2a'); px(ctx, 1, -35, '#ffee4a'); px(ctx, -1, -32, '#ff8a0a');
  ctx.restore();
  rect(ctx, cx - 14, 50, 28, 3, TC.accent);
}

// Oil: stone tower + cauldron
function drawTurret_1_2(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 18);
  // stone tower
  rect(ctx, cx - 6, 32, 12, 44, grad(ctx, cx - 6, 32, 12, 44, '#5a5a6a', '#3a3a4a'));
  outlineRect(ctx, cx - 6, 32, 12, 44, '#2a2a3a');
  // stone texture
  for (let y = 36; y < 72; y += 6) {
    line(ctx, cx - 5, y, cx + 5, y, '#4a4a5a', 0.5);
    line(ctx, cx, y, cx, y + 6, '#4a4a5a', 0.5);
  }
  // cauldron
  rect(ctx, cx - 10, 24, 20, 10, '#1a1a1a');
  ctx.beginPath(); ctx.ellipse(cx, 28, 10, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, 28, 8, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#77aa33'; ctx.fill();
  // steam
  px(ctx, cx - 2, 22, '#aadaaa'); px(ctx, cx + 2, 20, '#aadaaa'); px(ctx, cx, 18, '#aadaaa');
  // team color
  rect(ctx, cx - 7, 50, 14, 3, TC.accent);
}

// ═══════════════════════════════════════════════════════════
// AGE 2 — Renaissance Turrets
// ═══════════════════════════════════════════════════════════

// Small Cannon: bronze barrel on wooden mount
function drawTurret_2_0(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 22);
  // wooden mount
  rect(ctx, cx - 10, 48, 20, 16, grad(ctx, cx - 10, 48, 20, 16, '#6a5436', '#3a2a18'));
  outlineRect(ctx, cx - 10, 48, 20, 16, '#2a1a0c');
  for (let i = 0; i < 3; i++) line(ctx, cx - 8 + i * 7, 50, cx - 8 + i * 7, 62, '#4a3a20', 0.5);
  // wheels
  circle(ctx, cx - 10, 66, 5, '#4a3a20'); circle(ctx, cx + 10, 66, 5, '#4a3a20');
  outlineCircle(ctx, cx - 10, 66, 5, '#2a1a0c'); outlineCircle(ctx, cx + 10, 66, 5, '#2a1a0c');
  circle(ctx, cx - 10, 66, 2, '#2a1a0c'); circle(ctx, cx + 10, 66, 2, '#2a1a0c');
  // bronze barrel
  const bG = gradH(ctx, cx - 4, 30, 36, 8, '#8a6a2e', '#caa24e');
  rect(ctx, cx - 4, 30, 36, 8, bG);
  outlineRect(ctx, cx - 4, 30, 36, 8, '#6a4a1e');
  // barrel bands
  rect(ctx, cx, 29, 3, 10, '#6a4a1e'); rect(ctx, cx + 16, 29, 3, 10, '#6a4a1e');
  // muzzle
  circle(ctx, cx + 34, 34, 5, '#5a4a2a'); outlineCircle(ctx, cx + 34, 34, 5, '#3a2a10');
  circle(ctx, cx + 34, 34, 3, '#2a1a0c');
  // team color
  rect(ctx, cx - 10, 50, 20, 3, TC.accent);
}

// Large Cannon: bigger barrel with more detail
function drawTurret_2_1(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 26);
  rect(ctx, cx - 12, 48, 24, 16, grad(ctx, cx - 12, 48, 24, 16, '#6a5436', '#3a2a18'));
  outlineRect(ctx, cx - 12, 48, 24, 16, '#2a1a0c');
  for (let i = 0; i < 4; i++) line(ctx, cx - 10 + i * 6, 50, cx - 10 + i * 6, 62, '#4a3a20', 0.5);
  circle(ctx, cx - 12, 66, 6, '#4a3a20'); circle(ctx, cx + 12, 66, 6, '#4a3a20');
  outlineCircle(ctx, cx - 12, 66, 6, '#2a1a0c'); outlineCircle(ctx, cx + 12, 66, 6, '#2a1a0c');
  circle(ctx, cx - 12, 66, 2, '#2a1a0c'); circle(ctx, cx + 12, 66, 2, '#2a1a0c');
  for (let a = 0; a < 4; a++) {
    const angle = a * Math.PI / 2;
    line(ctx, cx - 12, 66, cx - 12 + Math.cos(angle) * 5, 66 + Math.sin(angle) * 5, '#2a1a0c', 1);
    line(ctx, cx + 12, 66, cx + 12 + Math.cos(angle) * 5, 66 + Math.sin(angle) * 5, '#2a1a0c', 1);
  }
  // large bronze barrel
  const bG = gradH(ctx, cx - 6, 28, 44, 10, '#8a6a2e', '#caa24e');
  rect(ctx, cx - 6, 28, 44, 10, bG);
  outlineRect(ctx, cx - 6, 28, 44, 10, '#6a4a1e');
  rect(ctx, cx - 2, 27, 3, 12, '#6a4a1e'); rect(ctx, cx + 16, 27, 3, 12, '#6a4a1e');
  // ornate muzzle
  circle(ctx, cx + 40, 33, 6, '#5a4a2a'); outlineCircle(ctx, cx + 40, 33, 6, '#3a2a10');
  circle(ctx, cx + 40, 33, 3, '#2a1a0c');
  // decorative ring
  rect(ctx, cx + 34, 29, 4, 8, '#caa24e');
  rect(ctx, cx - 12, 50, 24, 3, TC.accent);
}

// Explosive Cannon: wider barrel + orange accent
function drawTurret_2_2(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 28);
  rect(ctx, cx - 12, 46, 24, 18, grad(ctx, cx - 12, 46, 24, 18, '#6a5436', '#3a2a18'));
  outlineRect(ctx, cx - 12, 46, 24, 18, '#2a1a0c');
  for (let i = 0; i < 4; i++) line(ctx, cx - 10 + i * 6, 48, cx - 10 + i * 6, 62, '#4a3a20', 0.5);
  circle(ctx, cx - 12, 66, 6, '#4a3a20'); circle(ctx, cx + 12, 66, 6, '#4a3a20');
  outlineCircle(ctx, cx - 12, 66, 6, '#2a1a0c'); outlineCircle(ctx, cx + 12, 66, 6, '#2a1a0c');
  circle(ctx, cx - 12, 66, 2, '#2a1a0c'); circle(ctx, cx + 12, 66, 2, '#2a1a0c');
  // wide barrel
  const bG = gradH(ctx, cx - 8, 24, 48, 12, '#7a5a2a', '#b8923a');
  rect(ctx, cx - 8, 24, 48, 12, bG);
  outlineRect(ctx, cx - 8, 24, 48, 12, '#5a3a1a');
  rect(ctx, cx - 4, 23, 3, 14, '#5a3a1a'); rect(ctx, cx + 16, 23, 3, 14, '#5a3a1a');
  // wide muzzle
  circle(ctx, cx + 42, 30, 7, '#4a3a1a'); outlineCircle(ctx, cx + 42, 30, 7, '#2a1a0c');
  circle(ctx, cx + 42, 30, 4, '#1a0a00');
  // orange explosion accent
  rect(ctx, cx + 38, 26, 8, 2, '#ff6600'); rect(ctx, cx + 38, 32, 8, 2, '#ff6600');
  rect(ctx, cx - 12, 48, 24, 3, TC.accent);
}

// ═══════════════════════════════════════════════════════════
// AGE 3 — Modern Age Turrets
// ═══════════════════════════════════════════════════════════

// Single Turret: military green base + single barrel
function drawTurret_3_0(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 22);
  // base
  rect(ctx, cx - 10, 42, 20, 34, grad(ctx, cx - 10, 42, 20, 34, '#5a6b30', '#2f3a1a'));
  outlineRect(ctx, cx - 10, 42, 20, 34, '#1c2410');
  // hatch
  rect(ctx, cx - 8, 34, 16, 10, grad(ctx, cx - 8, 34, 16, 10, '#4a5a28', '#2a3418'));
  outlineRect(ctx, cx - 8, 34, 16, 10, '#1c2410');
  // barrel
  rect(ctx, cx - 2, 18, 4, 20, '#2a2a2a');
  outlineRect(ctx, cx - 2, 18, 4, 20, '#1a1a1a');
  // muzzle brake
  rect(ctx, cx - 4, 16, 8, 4, '#3a3a3a'); outlineRect(ctx, cx - 4, 16, 8, 4, '#1a1a1a');
  // bolt details
  px(ctx, cx - 5, 36, '#5a6a3a'); px(ctx, cx + 4, 36, '#5a6a3a');
  px(ctx, cx - 5, 40, '#5a6a3a'); px(ctx, cx + 4, 40, '#5a6a3a');
  // team color
  rect(ctx, cx - 8, 50, 16, 3, TC.accent);
}

// Rocket Turret: 3-tube pod
function drawTurret_3_1(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 24);
  rect(ctx, cx - 10, 42, 20, 34, grad(ctx, cx - 10, 42, 20, 34, '#5a6b30', '#2f3a1a'));
  outlineRect(ctx, cx - 10, 42, 20, 34, '#1c2410');
  rect(ctx, cx - 9, 34, 18, 10, grad(ctx, cx - 9, 34, 18, 10, '#4a5a28', '#2a3418'));
  outlineRect(ctx, cx - 9, 34, 18, 10, '#1c2410');
  // 3 rocket tubes
  for (let r = -1; r <= 1; r++) {
    rect(ctx, cx - 4 + r * 5, 16, 4, 20, '#333');
    outlineRect(ctx, cx - 4 + r * 5, 16, 4, 20, '#1a1a1a');
    // tube opening
    rect(ctx, cx - 4 + r * 5, 14, 4, 3, '#5a5a5a');
    // rocket tip
    rect(ctx, cx - 3 + r * 5, 13, 2, 2, '#cc3333');
  }
  px(ctx, cx - 5, 36, '#5a6a3a'); px(ctx, cx + 4, 36, '#5a6a3a');
  rect(ctx, cx - 9, 50, 18, 3, TC.accent);
}

// Double Turret: twin barrels
function drawTurret_3_2(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 26);
  rect(ctx, cx - 12, 42, 24, 34, grad(ctx, cx - 12, 42, 24, 34, '#5a6b30', '#2f3a1a'));
  outlineRect(ctx, cx - 12, 42, 24, 34, '#1c2410');
  rect(ctx, cx - 10, 32, 20, 12, grad(ctx, cx - 10, 32, 20, 12, '#4a5a28', '#2a3418'));
  outlineRect(ctx, cx - 10, 32, 20, 12, '#1c2410');
  // twin barrels
  rect(ctx, cx - 5, 16, 4, 20, '#2a2a2a'); outlineRect(ctx, cx - 5, 16, 4, 20, '#1a1a1a');
  rect(ctx, cx + 1, 16, 4, 20, '#2a2a2a'); outlineRect(ctx, cx + 1, 16, 4, 20, '#1a1a1a');
  // muzzle brakes
  rect(ctx, cx - 7, 14, 8, 4, '#3a3a3a'); outlineRect(ctx, cx - 7, 14, 8, 4, '#1a1a1a');
  rect(ctx, cx - 1, 14, 8, 4, '#3a3a3a'); outlineRect(ctx, cx - 1, 14, 8, 4, '#1a1a1a');
  px(ctx, cx - 7, 34, '#5a6a3a'); px(ctx, cx + 6, 34, '#5a6a3a');
  rect(ctx, cx - 10, 50, 20, 3, TC.accent);
}

// ═══════════════════════════════════════════════════════════
// AGE 4 — Future Age Turrets
// ═══════════════════════════════════════════════════════════

// Titanium Shooter: dark spire + energy orb
function drawTurret_4_0(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 20);
  // spire
  rect(ctx, cx - 7, 28, 14, 48, grad(ctx, cx - 7, 28, 14, 48, '#26405f', '#0f1c33'));
  outlineRect(ctx, cx - 7, 28, 14, 48, '#0a1420');
  // tech lines
  for (let i = 0; i < 3; i++) {
    rect(ctx, cx - 5, 34 + i * 12, 10, 2, TC.accent);
  }
  // energy orb
  const oG = rgrad(ctx, cx, 22, 6, '#ffffff', TC.accent);
  circle(ctx, cx, 22, 6, oG);
  const gG = rgrad(ctx, cx, 22, 10, TC.accent, 'rgba(0,229,255,0)');
  ctx.fillStyle = gG; ctx.beginPath(); ctx.arc(cx, 22, 10, 0, Math.PI * 2); ctx.fill();
  // team color glow on sides
  rect(ctx, cx - 8, 40, 2, 20, TC.light); rect(ctx, cx + 6, 40, 2, 20, TC.light);
  rect(ctx, cx - 8, 50, 16, 3, TC.accent);
}

// Lazer Cannon: thin barrel + glow tip
function drawTurret_4_1(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 20);
  rect(ctx, cx - 7, 34, 14, 42, grad(ctx, cx - 7, 34, 14, 42, '#26405f', '#0f1c33'));
  outlineRect(ctx, cx - 7, 34, 14, 42, '#0a1420');
  for (let i = 0; i < 3; i++) {
    rect(ctx, cx - 5, 40 + i * 10, 10, 2, TC.accent);
  }
  // thin long barrel
  rect(ctx, cx - 2, 10, 4, 28, '#1a2a44'); outlineRect(ctx, cx - 2, 10, 4, 28, '#0a1420');
  // barrel segments
  rect(ctx, cx - 3, 18, 6, 2, '#2a3a54'); rect(ctx, cx - 3, 26, 6, 2, '#2a3a54');
  // glow tip
  const tG = rgrad(ctx, cx, 8, 6, '#ffffff', TC.accent);
  circle(ctx, cx, 8, 5, tG);
  const gG = rgrad(ctx, cx, 8, 10, TC.accent, 'rgba(0,229,255,0)');
  ctx.fillStyle = gG; ctx.beginPath(); ctx.arc(cx, 8, 10, 0, Math.PI * 2); ctx.fill();
  rect(ctx, cx - 8, 50, 16, 3, TC.accent);
}

// Ion Ray: large orb on spire
function drawTurret_4_2(ctx) {
  const cx = 48;
  shadow(ctx, cx, 76, 22);
  // wide base spire
  rect(ctx, cx - 8, 30, 16, 46, grad(ctx, cx - 8, 30, 16, 46, '#26405f', '#0f1c33'));
  outlineRect(ctx, cx - 8, 30, 16, 46, '#0a1420');
  for (let i = 0; i < 4; i++) {
    rect(ctx, cx - 6, 36 + i * 8, 12, 2, TC.accent);
  }
  // side glow strips
  rect(ctx, cx - 9, 38, 2, 24, TC.light); rect(ctx, cx + 7, 38, 2, 24, TC.light);
  // support arms
  line(ctx, cx - 8, 34, cx - 14, 24, '#2a3a54', 2);
  line(ctx, cx + 8, 34, cx + 14, 24, '#2a3a54', 2);
  // large orb
  const oG = rgrad(ctx, cx, 18, 10, '#ffffff', TC.accent);
  circle(ctx, cx, 18, 10, oG);
  const gG = rgrad(ctx, cx, 18, 16, TC.accent, 'rgba(0,229,255,0)');
  ctx.fillStyle = gG; ctx.beginPath(); ctx.arc(cx, 18, 16, 0, Math.PI * 2); ctx.fill();
  // inner core
  circle(ctx, cx, 18, 4, '#ffffff');
  // energy ring
  ctx.strokeStyle = TC.light; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, 18, 14, 8, 0, 0, Math.PI * 2); ctx.stroke();
  rect(ctx, cx - 8, 50, 16, 3, TC.accent);
}

// Export all 15 draw functions in age-then-turret order:
// age0: [0]=Rock Slingshot, [1]=Egg Automatic, [2]=Primit. Catapult
// age1: [0]=Catapult, [1]=Fire Catapult, [2]=Oil
// age2: [0]=Small Cannon, [1]=Large Cannon, [2]=Explos. Cannon
// age3: [0]=Single Turret, [1]=Rocket Turret, [2]=Double Turret
// age4: [0]=Titanium Shooter, [1]=Lazer Cannon, [2]=Ion Ray
module.exports = [
  drawTurret_0_0, drawTurret_0_1, drawTurret_0_2,
  drawTurret_1_0, drawTurret_1_1, drawTurret_1_2,
  drawTurret_2_0, drawTurret_2_1, drawTurret_2_2,
  drawTurret_3_0, drawTurret_3_1, drawTurret_3_2,
  drawTurret_4_0, drawTurret_4_1, drawTurret_4_2,
];
