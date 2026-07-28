// Full-screen overlays drawn on top of the game: pause, password gate, debug panel.
// drawDebugScreen must stay in sync with game.handleDebugClick.

Object.assign(Renderer.prototype, {
  drawPauseScreen(game) {
    const ctx = this.ctx;
    const w = CONFIG.VIEWPORT.WIDTH;
    const h = CONFIG.VIEWPORT.HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const panelW = 340;
    const panelH = 360;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', cx, panelY + 40);

    const btnW = 220;
    const btnH = 30;
    const btnX = cx - btnW / 2;

    const musicBtnY = panelY + 70;
    const musicOn = game.audio.musicEnabled;
    ctx.fillStyle = musicOn ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(btnX, musicBtnY, btnW, btnH);
    ctx.strokeStyle = musicOn ? '#4a8' : '#844';
    ctx.strokeRect(btnX, musicBtnY, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Music: ${musicOn ? 'ON' : 'OFF'}`, cx, musicBtnY + 19);

    const sfxBtnY = panelY + 110;
    const sfxOn = game.audio.sfxEnabled;
    ctx.fillStyle = sfxOn ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(btnX, sfxBtnY, btnW, btnH);
    ctx.strokeStyle = sfxOn ? '#4a8' : '#844';
    ctx.strokeRect(btnX, sfxBtnY, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Sound Effects: ${sfxOn ? 'ON' : 'OFF'}`, cx, sfxBtnY + 19);

    const debugBtnY = panelY + 170;
    if (isLocalhost()) {
      ctx.fillStyle = '#3a2a4a';
      ctx.fillRect(btnX, debugBtnY, btnW, btnH);
      ctx.strokeStyle = '#8a6aaa';
      ctx.strokeRect(btnX, debugBtnY, btnW, btnH);
      ctx.fillStyle = '#fff';
      ctx.fillText('Debug Mode', cx, debugBtnY + 19);
    }

    const restartBtnY = panelY + 220;
    ctx.fillStyle = '#4a2a2a';
    ctx.fillRect(btnX, restartBtnY, btnW, btnH);
    ctx.strokeStyle = '#aa4444';
    ctx.strokeRect(btnX, restartBtnY, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.fillText('Restart Game', cx, restartBtnY + 19);

    const resumeBtnY = panelY + 280;
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(btnX, resumeBtnY, btnW, btnH);
    ctx.strokeStyle = '#4a6a8a';
    ctx.strokeRect(btnX, resumeBtnY, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.fillText('Resume', cx, resumeBtnY + 19);

    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText('Press ESC or P to resume', cx, panelY + 340);
  },

  drawPasswordPrompt(game) {
    const ctx = this.ctx;
    const w = CONFIG.VIEWPORT.WIDTH;
    const h = CONFIG.VIEWPORT.HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const panelW = 300;
    const panelH = 160;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#8a6aaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#d4aaff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Debug Access', cx, panelY + 28);

    const inputX = panelX + 20;
    const inputY = panelY + 60;
    const inputW = panelW - 40;
    const inputH = 28;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(inputX, inputY, inputW, inputH);
    ctx.strokeStyle = game.debugPasswordError ? '#f44' : '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(inputX, inputY, inputW, inputH);

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('*'.repeat(game.debugPasswordBuffer.length), inputX + 8, inputY + 19);

    if (game.debugPasswordError) {
      ctx.fillStyle = '#f44';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Incorrect password', cx, inputY + inputH + 16);
    }

    const submitBtnY = panelY + 100;
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(cx - 60, submitBtnY, 120, 28);
    ctx.strokeStyle = '#4a8';
    ctx.strokeRect(cx - 60, submitBtnY, 120, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Submit', cx, submitBtnY + 18);

    const cancelBtnY = submitBtnY + 34;
    ctx.fillStyle = '#4a2a2a';
    ctx.fillRect(cx - 60, cancelBtnY, 120, 28);
    ctx.strokeStyle = '#a44';
    ctx.strokeRect(cx - 60, cancelBtnY, 120, 28);
    ctx.fillStyle = '#fff';
    ctx.fillText('Cancel', cx, cancelBtnY + 18);
  },

  drawDebugScreen(game) {
    const ctx = this.ctx;
    const w = CONFIG.VIEWPORT.WIDTH;
    const h = CONFIG.VIEWPORT.HEIGHT;
    const cx = w / 2;
    const panelW = 620;
    const panelH = 600;
    const panelX = cx - panelW / 2;
    const panelY = (h - panelH) / 2;
    const bw = 185;
    const bh = 26;
    const col1X = panelX + 10;
    const col2X = panelX + 10 + bw + 10;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#8a6aaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#d4aaff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEBUG MODE', cx, panelY + 24);

    const drawBtn = (x, y, label, highlight) => {
      ctx.fillStyle = highlight ? '#2a4a2a' : '#2a2a3a';
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = highlight ? '#4a8' : '#555';
      ctx.strokeRect(x, y, bw, bh);
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + bw / 2, y + 16);
    };

    let y = panelY + 40;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RESOURCES', col1X, y);
    y += 18;

    drawBtn(col1X, y, 'Gold +5,000', true);
    drawBtn(col2X, y, 'XP +10,000', true);
    y += 34;

    drawBtn(col1X, y, 'Gold +50,000', true);
    drawBtn(col2X, y, 'XP +100,000', true);
    y += 42;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMBAT', col1X, y);
    y += 18;

    drawBtn(col1X, y, 'Kill Enemies', false);
    drawBtn(col2X, y, 'Kill Players', false);
    y += 34;

    drawBtn(col1X, y, 'Full Heal Base', true);
    drawBtn(col2X, y, 'Instant Win', false);
    y += 42;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EVOLUTION & STATUS', col1X, y);
    y += 18;

    drawBtn(col1X, y, 'Evolve Player', true);
    drawBtn(col2X, y, 'Evolve Enemy', true);
    y += 34;

    drawBtn(col1X, y, `Invincible: ${game.invincible ? 'ON' : 'OFF'}`, game.invincible);
    drawBtn(col2X, y, `Speed: ${game.gameSpeed}x (click)`, game.gameSpeed > 1);
    y += 42;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPAWN UNIT', col1X, y);
    y += 18;

    const age = CONFIG.AGES[game.currentAge];
    const unitNames = age.units.map((u, i) => u.name.substring(0, 14));
    const spawnColW = bw;
    for (let i = 0; i < unitNames.length; i++) {
      const useTwoCols = unitNames.length <= 3;
      const rowX = useTwoCols ? (i < 2 ? col1X : col2X) : col1X;
      const rowY = useTwoCols ? y + (i % 2) * 28 : y + i * 28;
      ctx.fillStyle = '#2a3a2a';
      ctx.fillRect(rowX, rowY, spawnColW, bh);
      ctx.strokeStyle = '#4a8';
      ctx.strokeRect(rowX, rowY, spawnColW, bh);
      ctx.fillStyle = '#8f8';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', rowX + 12, rowY + 16);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(unitNames[i], rowX + spawnColW / 2 + 8, rowY + 16);

      ctx.fillStyle = '#3a2a2a';
      ctx.fillRect(rowX + spawnColW + 2, rowY, 28, bh);
      ctx.strokeStyle = '#f84';
      ctx.strokeRect(rowX + spawnColW + 2, rowY, 28, bh);
      ctx.fillStyle = '#f88';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('E', rowX + spawnColW + 16, rowY + 16);
    }
    if (unitNames.length <= 2) {
      y += 28;
    } else if (unitNames.length <= 3) {
      y += 56;
    } else {
      y += 4 * 28;
    }
    y += 8;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCENARIOS', col1X, y);
    y += 18;

    drawBtn(col1X, y, 'Wave Defense', false);
    drawBtn(col2X, y, 'Boss Rush', false);
    y += 34;

    drawBtn(col1X, y, 'Max Evolution', false);
    drawBtn(col2X, y, 'Reset Game', false);
    y += 42;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DATA', col1X, y);
    y += 18;

    drawBtn(col1X, y, 'Export JSON', false);
    drawBtn(col2X, y, 'Export CSV', false);
    y += 42;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STATS', col1X, y);
    y += 16;

    const pUnits = game.units.filter(u => u.side === 'player' && u.alive).length;
    const eUnits = game.units.filter(u => u.side === 'enemy' && u.alive).length;
    const pTurrets = game.turrets.filter(t => t.side === 'player' && t.alive).length;
    const eTurrets = game.turrets.filter(t => t.side === 'enemy' && t.alive).length;
    const gameTime = Math.floor(game.gameTime);

    ctx.fillStyle = '#ccc';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const statsText = [
      `Units: ${pUnits}P / ${eUnits}E`,
      `Turrets: ${pTurrets}P / ${eTurrets}E`,
      `Time: ${Math.floor(gameTime / 60)}m${gameTime % 60}s`,
      `Age: ${game.currentAge}P / ${game.enemyAge}E`,
    ];
    statsText.forEach((t, i) => {
      ctx.fillText(t, col1X + (i % 2 === 0 ? 0 : 220), y + Math.floor(i / 2) * 14);
    });

    const backBtnY = panelY + panelH - 36;
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(cx - 90, backBtnY, 180, 28);
    ctx.strokeStyle = '#4a6a8a';
    ctx.strokeRect(cx - 90, backBtnY, 180, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Back', cx, backBtnY + 18);
  },
});
