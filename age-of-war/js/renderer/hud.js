// The bottom HUD bar. Geometry comes from CONFIG.HUD_HEIGHT / UNIT_START_X / UNIT_SPACING,
// which js/input.js hit-tests against — never hardcode a rect on either side.

Object.assign(Renderer.prototype, {
  drawHUD(game) {
    const ctx = this.ctx;
    const W = CONFIG.VIEWPORT.WIDTH;
    const HH = CONFIG.HUD_HEIGHT;
    const y = CONFIG.VIEWPORT.HEIGHT - HH;

    this._currentAge = game.currentAge;
    this.hudTime = (this.hudTime || 0) + 1 / 60;
    this.tooltip = null;

    ctx.save();

    this.roundRect(ctx, 0, y, W, HH, 8);
    ctx.clip();

    const bgGrad = ctx.createLinearGradient(0, y, 0, y + HH);
    bgGrad.addColorStop(0, 'rgba(12,12,24,0.88)');
    bgGrad.addColorStop(0.5, 'rgba(8,8,18,0.92)');
    bgGrad.addColorStop(1, 'rgba(4,4,12,0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, y, W, HH);

    const age = CONFIG.AGES[game.currentAge];
    const accent = age.color;

    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    this.roundRect(ctx, 0.5, y + 0.5, W - 1, HH - 1, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(8, y + 1);
    ctx.lineTo(W - 8, y + 1);
    ctx.stroke();

    const gold = Math.floor(game.gold);
    const xp = Math.floor(game.xp);

    this.xpBarProgress += (xp - this.xpBarProgress) * 0.15;
    const evoNext = CONFIG.EVOLVE_XP[game.currentAge + 1];
    const evoPrev = game.currentAge > 0 ? CONFIG.EVOLVE_XP[game.currentAge] : 0;
    const xpMax = evoNext !== undefined ? evoNext - evoPrev : 1;
    const xpInAge = this.xpBarProgress - evoPrev;
    const xpFrac = evoNext !== undefined ? clamp(xpInAge / xpMax, 0, 1) : 1;

    const barX = 12;
    const barY = y + 8;
    const barW = 150;
    const barH = 16;

    ctx.fillStyle = '#1a1a2a';
    this.roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const barFillW = Math.max(2, barW * xpFrac);
    const xpGrad = ctx.createLinearGradient(barX, barY, barX + barFillW, barY);
    xpGrad.addColorStop(0, '#00b8d4');
    xpGrad.addColorStop(0.5, '#00e5ff');
    xpGrad.addColorStop(1, '#80f0ff');
    ctx.fillStyle = xpGrad;
    this.roundRect(ctx, barX, barY, barFillW, barH, 4);
    ctx.fill();

    const shimmer = (Math.sin(this.hudTime * 3) + 1) * 0.5;
    ctx.globalAlpha = 0.15 + shimmer * 0.1;
    ctx.fillStyle = '#fff';
    this.roundRect(ctx, barX, barY, barFillW, barH / 2, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`XP ${xp}${evoNext !== undefined ? '/' + evoNext : ''}`, barX + barW / 2, barY + 12);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${gold}`, barX, barY + 34);
    const goldW = ctx.measureText(`${gold}`).width;
    ctx.fillStyle = '#b8960a';
    ctx.font = '10px sans-serif';
    ctx.fillText('G', barX + goldW + 3, barY + 34);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${xp}`, barX, barY + 50);
    const xpW = ctx.measureText(`${xp}`).width;
    ctx.fillStyle = '#0090a0';
    ctx.font = '10px sans-serif';
    ctx.fillText('XP', barX + xpW + 3, barY + 50);

    ctx.fillStyle = accent;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(age.name, 100, barY + 66);

    const diffName = CONFIG.DIFFICULTIES[game.difficulty].name;
    ctx.fillStyle = game.difficulty === 0 ? '#777' : game.difficulty === 1 ? '#fa4' : '#f44';
    ctx.font = '9px sans-serif';
    ctx.fillText(diffName, 100, barY + 78);

    const unitStartX = CONFIG.UNIT_START_X;
    for (let i = 0; i < age.units.length; i++) {
      const u = age.units[i];
      const bx = unitStartX + i * CONFIG.UNIT_SPACING;
      const tier = game.unitUpgrades[i] || 0;
      const tierHpMult = CONFIG.UNIT_UPGRADE_HP_MULT[tier];
      const tierDmgMult = CONFIG.UNIT_UPGRADE_DMG_MULT[tier];
      const canAfford = game.gold >= u.cost;
      const bw = 68;
      const bh = 34;
      const by = y + 6;

      const hover = pointInRect(this.mouseX || 0, (this.mouseY || 0), bx, by, bw, bh);

      if (hover) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        this.roundRect(ctx, bx, by, bw, bh, 5);
        ctx.fill();
      }

      const btnGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
      if (canAfford) {
        btnGrad.addColorStop(0, hover ? 'rgba(42,100,60,0.9)' : 'rgba(34,72,48,0.85)');
        btnGrad.addColorStop(1, hover ? 'rgba(26,68,40,0.9)' : 'rgba(20,48,32,0.85)');
      } else {
        btnGrad.addColorStop(0, 'rgba(50,30,30,0.7)');
        btnGrad.addColorStop(1, 'rgba(35,20,20,0.7)');
      }
      ctx.fillStyle = btnGrad;
      this.roundRect(ctx, bx, by, bw, bh, 5);
      ctx.fill();

      ctx.strokeStyle = canAfford ? (hover ? '#6cf' : '#3a8a5a') : '#4a3333';
      ctx.lineWidth = 1;
      this.roundRect(ctx, bx, by, bw, bh, 5);
      ctx.stroke();

      ctx.fillStyle = canAfford ? '#fff' : '#666';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(u.name, bx + bw / 2, by + 13);

      ctx.fillStyle = canAfford ? '#ffd700' : '#554444';
      ctx.font = '9px monospace';
      ctx.fillText(`${u.cost}g`, bx + bw / 2, by + 23);

      for (let t = 0; t < CONFIG.MAX_UPGRADE_TIER; t++) {
        const dx = bx + bw / 2 - 5 + t * 7;
        const dy = by + bh - 5;
        ctx.fillStyle = t < tier ? '#ffcc00' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (i < 9) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${i + 1}`, bx + bw - 3, by + 10);
        ctx.textAlign = 'center';
      }

      const upgCost = game.getUnitUpgradeCost(i);
      const ubx = bx + bw + 2;
      const ubw = 14;
      const canUpgrade = upgCost !== null && game.gold >= upgCost;
      const maxed = tier >= CONFIG.MAX_UPGRADE_TIER;
      const upgHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), ubx, by, ubw, bh);

      ctx.fillStyle = maxed ? 'rgba(20,20,20,0.3)' : (upgHover ? 'rgba(80,60,120,0.8)' : 'rgba(40,30,60,0.6)');
      this.roundRect(ctx, ubx, by, ubw, bh, 3);
      ctx.fill();
      ctx.strokeStyle = maxed ? '#333' : (canUpgrade ? (upgHover ? '#c8f' : '#84c') : '#444');
      ctx.lineWidth = 1;
      this.roundRect(ctx, ubx, by, ubw, bh, 3);
      ctx.stroke();

      ctx.fillStyle = maxed ? '#555' : (canUpgrade ? '#fff' : '#666');
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(maxed ? '★' : '↑', ubx + ubw / 2, by + 15);

      if (!maxed) {
        ctx.fillStyle = canUpgrade ? '#ffd700' : '#554';
        ctx.font = '7px monospace';
        ctx.fillText(`${upgCost}g`, ubx + ubw / 2, by + 28);
      }

      if (hover) {
        const effHp = Math.round(u.hp * tierHpMult);
        const effDmg = Math.round(u.damage * tierDmgMult);
        const lines = [
          `HP: ${effHp}  DMG: ${effDmg}`,
          `SPD: ${(u.speed * (CONFIG.UNIT_UPGRADE_SPD_MULT[tier] || 1)).toFixed(2)}  RNG: ${u.range}`,
          `ATK: ${u.attackSpeed}s  Tier: ${tier}/${CONFIG.MAX_UPGRADE_TIER}`
        ];
        this.tooltip = { x: bx + bw / 2, y: by - 8, lines };
      }
    }

    const evoNeeded = CONFIG.EVOLVE_XP[game.currentAge + 1];
    const evoX = unitStartX + age.units.length * CONFIG.UNIT_SPACING + 8;
    const evoW = 80;
    const evoH = 34;
    const evoY = y + 6;
    if (evoNeeded !== undefined) {
      const canEvolve = game.xp >= evoNeeded;
      const evoHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), evoX, evoY, evoW, evoH);

      const evoGrad = ctx.createLinearGradient(evoX, evoY, evoX, evoY + evoH);
      if (canEvolve) {
        evoGrad.addColorStop(0, evoHover ? 'rgba(100,40,140,0.95)' : 'rgba(80,30,120,0.9)');
        evoGrad.addColorStop(1, evoHover ? 'rgba(60,24,90,0.95)' : 'rgba(48,18,72,0.9)');
      } else {
        evoGrad.addColorStop(0, 'rgba(35,28,45,0.7)');
        evoGrad.addColorStop(1, 'rgba(22,18,30,0.7)');
      }
      ctx.fillStyle = evoGrad;
      this.roundRect(ctx, evoX, evoY, evoW, evoH, 5);
      ctx.fill();
      ctx.strokeStyle = canEvolve ? (evoHover ? '#daf' : '#84c') : '#334';
      ctx.lineWidth = 1;
      this.roundRect(ctx, evoX, evoY, evoW, evoH, 5);
      ctx.stroke();

      if (canEvolve) {
        const evoPulse = 0.6 + Math.sin(this.hudTime * 3.5) * 0.4;
        ctx.strokeStyle = `rgba(180,100,255,${evoPulse * 0.3})`;
        ctx.lineWidth = 2;
        this.roundRect(ctx, evoX - 2, evoY - 2, evoW + 4, evoH + 4, 7);
        ctx.stroke();
      }

      ctx.fillStyle = canEvolve ? '#fff' : '#666';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Evolve', evoX + evoW / 2, evoY + 14);
      ctx.fillStyle = canEvolve ? '#dd88ff' : '#444';
      ctx.font = '9px monospace';
      ctx.fillText(`${evoNeeded} XP`, evoX + evoW / 2, evoY + 26);
    }

    const heroBtnX = evoNeeded !== undefined ? evoX + evoW + 8 : unitStartX + age.units.length * CONFIG.UNIT_SPACING + 8;
    const heroBtnW = 80;
    const heroBtnH = 34;
    const heroBtnY = y + 6;
    const canBuyHero = age.hero && game.gold >= age.hero.cost && game.heroCooldown <= 0;
    const heroHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), heroBtnX, heroBtnY, heroBtnW, heroBtnH);

    const heroGrad = ctx.createLinearGradient(heroBtnX, heroBtnY, heroBtnX, heroBtnY + heroBtnH);
    if (canBuyHero) {
      heroGrad.addColorStop(0, heroHover ? 'rgba(160,60,60,0.95)' : 'rgba(120,40,40,0.9)');
      heroGrad.addColorStop(1, heroHover ? 'rgba(100,36,36,0.95)' : 'rgba(80,24,24,0.9)');
    } else {
      heroGrad.addColorStop(0, 'rgba(35,28,28,0.7)');
      heroGrad.addColorStop(1, 'rgba(22,18,18,0.7)');
    }
    ctx.fillStyle = heroGrad;
    this.roundRect(ctx, heroBtnX, heroBtnY, heroBtnW, heroBtnH, 5);
    ctx.fill();
    const heroBorderColor = canBuyHero ? (heroHover ? '#faa' : '#c66') : '#443';
    ctx.strokeStyle = heroBorderColor;
    ctx.lineWidth = 1;
    this.roundRect(ctx, heroBtnX, heroBtnY, heroBtnW, heroBtnH, 5);
    ctx.stroke();

    if (game.heroCooldown <= 0 && age.hero) {
      const heroPulse = 0.6 + Math.sin(this.hudTime * 3) * 0.4;
      ctx.strokeStyle = `rgba(255,100,100,${heroPulse * 0.3})`;
      ctx.lineWidth = 2;
      this.roundRect(ctx, heroBtnX - 2, heroBtnY - 2, heroBtnW + 4, heroBtnH + 4, 7);
      ctx.stroke();
    }

    ctx.fillStyle = canBuyHero ? '#fff' : '#666';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(age.hero ? age.hero.name : 'Hero', heroBtnX + heroBtnW / 2, heroBtnY + 13);
    const heroCostStr = age.hero && game.heroCooldown > 0 ? `${Math.ceil(game.heroCooldown)}s` : `${age.hero ? age.hero.cost : '-'}g`;
    ctx.fillStyle = game.heroCooldown > 0 ? '#666' : (canBuyHero ? '#ffd700' : '#554');
    ctx.font = '8px monospace';
    ctx.fillText(heroCostStr, heroBtnX + heroBtnW / 2, heroBtnY + 25);

    const spX = W - 120;
    const spW = 108;
    const spH = 34;
    const spY = y + 6;
    const spCost = (CONFIG.SPECIAL_XP_COST && CONFIG.SPECIAL_XP_COST[game.currentAge]) || 0;
    const hasXp = game.xp >= spCost;
    const spReady = game.specialCooldown <= 0 && hasXp;

    const hover = pointInRect(this.mouseX || 0, (this.mouseY || 0), spX, spY, spW, spH);
    const spGrad = ctx.createLinearGradient(spX, spY, spX, spY + spH);
    if (spReady) {
      spGrad.addColorStop(0, hover ? 'rgba(160,80,20,0.95)' : 'rgba(120,60,14,0.9)');
      spGrad.addColorStop(1, hover ? 'rgba(100,50,10,0.95)' : 'rgba(80,40,8,0.9)');
    } else {
      spGrad.addColorStop(0, 'rgba(30,30,35,0.7)');
      spGrad.addColorStop(1, 'rgba(20,20,25,0.7)');
    }
    ctx.fillStyle = spGrad;
    this.roundRect(ctx, spX, spY, spW, spH, 5);
    ctx.fill();
    ctx.strokeStyle = spReady ? (hover ? '#ffa' : '#cc8800') : '#333';
    ctx.lineWidth = 1;
    this.roundRect(ctx, spX, spY, spW, spH, 5);
    ctx.stroke();

    if (spReady) {
      const pulse = 0.7 + Math.sin(this.hudTime * 4) * 0.3;
      ctx.strokeStyle = `rgba(255,180,0,${pulse * 0.4})`;
      ctx.lineWidth = 2;
      this.roundRect(ctx, spX - 2, spY - 2, spW + 4, spH + 4, 7);
      ctx.stroke();
    }

    ctx.fillStyle = spReady ? '#fff' : '#888';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(age.specialName, spX + spW / 2, spY + 14);
    ctx.fillStyle = spReady ? '#ffd700' : (!hasXp ? '#ff6666' : '#555');
    ctx.font = '9px monospace';
    const spStatusText = game.specialCooldown > 0
      ? `${Math.ceil(game.specialCooldown)}s`
      : (!hasXp ? `${spCost} XP` : `READY (${spCost}XP)`);
    ctx.fillText(spStatusText, spX + spW / 2, spY + 26);

    const speedBtns = [1, 2, 3];
    const spdStartX = W - 230;
    for (let i = 0; i < speedBtns.length; i++) {
      const sx = spdStartX + i * 32;
      const sw = 28;
      const sh = 22;
      const sy = y + 10;
      const isActive = game.gameSpeed === speedBtns[i];
      const spdHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), sx, sy, sw, sh);

      ctx.fillStyle = isActive ? 'rgba(0,180,220,0.3)' : (spdHover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)');
      this.roundRect(ctx, sx, sy, sw, sh, 3);
      ctx.fill();
      ctx.strokeStyle = isActive ? '#00b8dc' : (spdHover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)');
      ctx.lineWidth = 1;
      this.roundRect(ctx, sx, sy, sw, sh, 3);
      ctx.stroke();

      ctx.fillStyle = isActive ? '#00e5ff' : (spdHover ? '#aaa' : '#666');
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${speedBtns[i]}x`, sx + sw / 2, sy + 15);
    }

    const formNames = ['Scatter', 'Line', 'Wedge'];
    const formX = spdStartX;
    const formY = y + 34;
    const formW = 90;
    const formH = 16;
    const formHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), formX, formY, formW, formH);
    ctx.fillStyle = formHover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)';
    this.roundRect(ctx, formX, formY, formW, formH, 3);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    this.roundRect(ctx, formX, formY, formW, formH, 3);
    ctx.stroke();
    ctx.fillStyle = '#aaa';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Form: ' + formNames[game.formationMode], formX + formW / 2, formY + 11);

    const row2Y = y + 56;
    const slotsFull = game.playerSlotsBought >= CONFIG.TURRET_SLOTS;
    const canBuySlot = game.gold >= CONFIG.TURRET_SLOT_COST && !slotsFull;

    const slotHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), 12, row2Y, 80, 22);
    const slotGrad = ctx.createLinearGradient(12, row2Y, 12, row2Y + 22);
    slotGrad.addColorStop(0, canBuySlot ? (slotHover ? 'rgba(42,90,110,0.9)' : 'rgba(34,74,90,0.8)') : 'rgba(30,30,35,0.6)');
    slotGrad.addColorStop(1, canBuySlot ? 'rgba(26,58,74,0.9)' : 'rgba(20,20,25,0.6)');
    ctx.fillStyle = slotGrad;
    this.roundRect(ctx, 12, row2Y, 80, 22, 4);
    ctx.fill();
    ctx.strokeStyle = canBuySlot ? (slotHover ? '#6cf' : '#3a7a9a') : '#333';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 12, row2Y, 80, 22, 4);
    ctx.stroke();

    ctx.fillStyle = canBuySlot ? '#fff' : '#555';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Slot ${game.playerSlotsBought}/${CONFIG.TURRET_SLOTS}`, 52, row2Y + 10);
    ctx.fillStyle = canBuySlot ? '#88ccff' : '#444';
    ctx.font = '8px sans-serif';
    ctx.fillText(slotsFull ? 'FULL' : `${CONFIG.TURRET_SLOT_COST}g`, 52, row2Y + 19);

    const playerTurrets = game.playerTurrets();
    for (let i = 0; i < age.turrets.length; i++) {
      const t = age.turrets[i];
      const bx = 100 + i * 96;
      const canPlace = game.gold >= t.cost && playerTurrets.length < game.playerSlotsBought;
      const tw = 88;
      const th = 22;

      const tHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), bx, row2Y, tw, th);
      const tGrad = ctx.createLinearGradient(bx, row2Y, bx, row2Y + th);
      tGrad.addColorStop(0, canPlace ? (tHover ? 'rgba(42,90,42,0.9)' : 'rgba(34,74,34,0.8)') : 'rgba(30,30,35,0.6)');
      tGrad.addColorStop(1, canPlace ? 'rgba(26,58,26,0.9)' : 'rgba(20,20,25,0.6)');
      ctx.fillStyle = tGrad;
      this.roundRect(ctx, bx, row2Y, tw, th, 4);
      ctx.fill();
      ctx.strokeStyle = canPlace ? (tHover ? '#afa' : '#5a8a4a') : '#333';
      ctx.lineWidth = 1;
      this.roundRect(ctx, bx, row2Y, tw, th, 4);
      ctx.stroke();

      ctx.fillStyle = canPlace ? '#fff' : '#555';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.name, bx + tw / 2, row2Y + 10);
      ctx.fillStyle = canPlace ? '#aaddaa' : '#444';
      ctx.font = '8px sans-serif';
      ctx.fillText(`${t.cost}g`, bx + tw / 2, row2Y + 19);
    }

    const buildingStartX = 100 + age.turrets.length * 96 + 16;
    const buildingBtnW = 80;
    for (let i = 0; i < CONFIG.BUILDINGS.length; i++) {
      const bData = CONFIG.BUILDINGS[i];
      const bbX = buildingStartX + i * (buildingBtnW + 8);
      const canBuyB = game.gold >= bData.cost;
      const bHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), bbX, row2Y, buildingBtnW, 22);

      const bGrad = ctx.createLinearGradient(bbX, row2Y, bbX, row2Y + 22);
      bGrad.addColorStop(0, canBuyB ? (bHover ? 'rgba(42,70,90,0.9)' : 'rgba(34,58,74,0.8)') : 'rgba(30,30,35,0.6)');
      bGrad.addColorStop(1, canBuyB ? 'rgba(26,46,58,0.9)' : 'rgba(20,20,25,0.6)');
      ctx.fillStyle = bGrad;
      this.roundRect(ctx, bbX, row2Y, buildingBtnW, 22, 4);
      ctx.fill();
      ctx.strokeStyle = canBuyB ? (bHover ? '#aaf' : '#68a') : '#333';
      ctx.lineWidth = 1;
      this.roundRect(ctx, bbX, row2Y, buildingBtnW, 22, 4);
      ctx.stroke();

      ctx.fillStyle = canBuyB ? '#fff' : '#555';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bData.name, bbX + buildingBtnW / 2, row2Y + 10);
      ctx.fillStyle = canBuyB ? '#ffd700' : '#444';
      ctx.font = '7px monospace';
      ctx.fillText(`${bData.cost}g`, bbX + buildingBtnW / 2, row2Y + 19);
    }

    const row3Y = row2Y + 34;
    for (let i = 0; i < playerTurrets.length; i++) {
      const t = playerTurrets[i];
      const bx = 100 + i * 96;
      const refund = Math.floor(t.cost * CONFIG.TURRET_REFUND_RATE);

      const sellHover = pointInRect(this.mouseX || 0, (this.mouseY || 0), bx, row3Y, 88, 18);
      ctx.fillStyle = sellHover ? 'rgba(90,30,30,0.8)' : 'rgba(50,20,20,0.6)';
      this.roundRect(ctx, bx, row3Y, 88, 18, 3);
      ctx.fill();
      ctx.strokeStyle = sellHover ? '#f66' : '#633';
      ctx.lineWidth = 1;
      this.roundRect(ctx, bx, row3Y, 88, 18, 3);
      ctx.stroke();
      ctx.fillStyle = sellHover ? '#fcc' : '#faa';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Sell ${refund}g`, bx + 44, row3Y + 12);
    }

    this._drawHudSeparators(ctx, {
      W, y, age, unitStartX, spX, spW, buildingStartX, buildingBtnW,
      heroEndX: heroBtnX + heroBtnW,
      speedStartX: spdStartX,
      turretCount: playerTurrets.length,
    });

    this.drawTooltip(ctx);

    ctx.restore();
    this.drawPauseButton(game);
  },

  _drawHudSeparators(ctx, layout) {
    const { W, y, age, unitStartX, spX, spW, buildingStartX, buildingBtnW, heroEndX, speedStartX, turretCount } = layout;
    const unitGroupEndX = heroEndX + 6;
    const speedGroupStartX = speedStartX - 8;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(10, y + 50); ctx.lineTo(W - 10, y + 50);
    ctx.moveTo(10, y + 88); ctx.lineTo(W - 10, y + 88);
    ctx.moveTo(160, y + 4); ctx.lineTo(160, y + 56);
    ctx.moveTo(unitGroupEndX, y + 4); ctx.lineTo(unitGroupEndX, y + 56);
    ctx.moveTo(speedGroupStartX, y + 4); ctx.lineTo(speedGroupStartX, y + 56);
    ctx.moveTo(94, y + 50); ctx.lineTo(94, y + 86);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    const unitGroupMid = unitStartX + (age.units.length * CONFIG.UNIT_SPACING) / 2 - 6;
    ctx.fillText('UNITS', unitGroupMid, y + 2);
    ctx.fillText('SPECIAL', spX + spW / 2, y + 2);
    ctx.fillText('TURRETS', 100 + (age.turrets.length * 96) / 2 - 4, y + 52);
    ctx.fillText('BUILD', buildingStartX + (CONFIG.BUILDINGS.length * (buildingBtnW + 8)) / 2 - 4, y + 52);
    if (turretCount > 0) {
      ctx.fillText('SELL', 100 + (turretCount * 96) / 2 - 4, y + 90);
    }
    ctx.restore();
  },

  drawTooltip(ctx) {
    if (!this.tooltip) return;
    const { x, y, lines } = this.tooltip;
    const lineH = 14;
    const pad = 8;
    const tw = 170;
    const th = lines.length * lineH + pad * 2;
    let tx = x - tw / 2;
    let ty = y - th - 4;

    if (tx < 4) tx = 4;
    if (tx + tw > CONFIG.VIEWPORT.WIDTH - 4) tx = CONFIG.VIEWPORT.WIDTH - tw - 4;
    if (ty < 4) ty = y + 40;

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(8,8,20,0.95)';
    this.roundRect(ctx, tx, ty, tw, th, 6);
    ctx.fill();

    const age = CONFIG.AGES[this._currentAge || 0];
    ctx.strokeStyle = age ? age.color : '#444';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    this.roundRect(ctx, tx, ty, tw, th, 6);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ddd';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], tx + pad, ty + pad + 10 + i * lineH);
    }
    ctx.restore();
  },

  drawPauseButton(game) {
    const ctx = this.ctx;
    const bx = CONFIG.VIEWPORT.WIDTH - 30;
    const by = 22;

    ctx.fillStyle = game.paused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx, by, 24, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 24, 24);

    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + 7, by + 6, 3, 12);
    ctx.fillRect(bx + 14, by + 6, 3, 12);
  },
});
