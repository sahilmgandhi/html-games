// Everything that lives in world space: bases, units, turrets, buildings, projectiles.

Object.assign(Renderer.prototype, {
  drawBase(base, ageIndex, occupied) {
    const ctx = this.ctx;
    occupied = occupied || 0;
    const bw = base.width;
    const bh = base.height;
    const s = this.worldToScreen(base.x - bw / 2, base.y);
    const groundY = s.y;
    const topY = groundY - bh;
    const sideColor = base.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
    const t = Date.now();

    switch (ageIndex) {
      case 0: { // Stone Age — stone hut with thatched roof
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(s.x + bw / 2, groundY + 2, bw / 2 + 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Walls with gradient
        const wg = ctx.createLinearGradient(s.x, topY + 20, s.x + bw, groundY);
        wg.addColorStop(0, '#8a7a6a');
        wg.addColorStop(1, '#5a4a3a');
        ctx.fillStyle = wg;
        ctx.fillRect(s.x, topY + 20, bw, bh - 20);
        // Stones
        ctx.fillStyle = '#7a6a5a';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(s.x + 4 + c * 26, topY + 24 + r * 24, 22, 18);
          }
        }
        ctx.fillStyle = '#6a5a4a';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(s.x + 6 + c * 26, topY + 26 + r * 24, 18, 14);
          }
        }
        // Door
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(s.x + bw / 2 - 10, groundY - 30, 20, 30);
        // Thatched roof with texture
        ctx.fillStyle = '#8a6535';
        ctx.beginPath();
        ctx.moveTo(s.x - 8, topY + 20);
        ctx.lineTo(s.x + bw / 2, topY - 10);
        ctx.lineTo(s.x + bw + 8, topY + 20);
        ctx.fill();
        ctx.fillStyle = '#7a5525';
        for (let i = 0; i < 7; i++) {
          ctx.fillRect(s.x - 4 + i * 16, topY + 16, 14, 5);
        }
        // Roof ridge
        ctx.fillStyle = '#9a7545';
        ctx.fillRect(s.x + bw / 2 - 2, topY - 10, 4, 30);
        // Campfire
        const fireFlicker = Math.sin(t / 80) * 2;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(s.x - 20, groundY - 4);
        ctx.lineTo(s.x - 16 + fireFlicker, groundY - 18 - Math.abs(fireFlicker));
        ctx.lineTo(s.x - 12, groundY - 4);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(s.x - 18, groundY - 4);
        ctx.lineTo(s.x - 16, groundY - 12 + fireFlicker);
        ctx.lineTo(s.x - 14, groundY - 4);
        ctx.fill();
        // Smoke
        ctx.fillStyle = 'rgba(180,170,160,0.25)';
        for (let i = 0; i < 3; i++) {
          const sy = groundY - 20 - i * 12;
          const sx = s.x - 16 + Math.sin(t / 600 + i) * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 4 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Team flag
        const flagWave = Math.sin(t / 200) * 3;
        ctx.fillStyle = '#5a4a30';
        ctx.fillRect(s.x + bw - 8, topY - 5, 3, 28);
        ctx.fillStyle = sideColor;
        ctx.beginPath();
        ctx.moveTo(s.x + bw - 5, topY - 5);
        ctx.lineTo(s.x + bw + 12, topY + flagWave);
        ctx.lineTo(s.x + bw - 5, topY + 5);
        ctx.fill();
        break;
      }

      case 1: { // Castle Age — stone wall with crenellations + towers
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(s.x + bw / 2, groundY + 2, bw / 2 + 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main wall with gradient
        const cg = ctx.createLinearGradient(s.x, topY, s.x, groundY);
        cg.addColorStop(0, '#5a5a7a');
        cg.addColorStop(1, '#3a3a5a');
        ctx.fillStyle = cg;
        ctx.fillRect(s.x, topY + 10, bw, bh - 10);
        // Stone blocks
        ctx.fillStyle = '#4a4a6a';
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillRect(s.x + 2 + c * 27, topY + 14 + r * 20, 24, 16);
          }
        }
        // Crenellations
        ctx.fillStyle = '#5a5a7a';
        for (let i = 0; i < 6; i++) {
          if (i % 2 === 0) {
            ctx.fillRect(s.x + i * 16 - 2, topY, 12, 14);
          }
        }
        // Towers
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(s.x - 8, topY + 5, 16, bh - 5);
        ctx.fillRect(s.x + bw - 8, topY + 5, 16, bh - 5);
        ctx.fillStyle = '#5a5a7a';
        for (let i = 0; i < 2; i++) {
          const tx = i === 0 ? s.x - 8 : s.x + bw - 8;
          ctx.fillRect(tx, topY - 2, 16, 7);
          ctx.fillRect(tx + 2, topY - 4, 4, 4);
          ctx.fillRect(tx + 10, topY - 4, 4, 4);
        }
        // Gate
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(s.x + bw / 2 - 10, groundY - 35, 20, 35);
        ctx.fillStyle = '#4444aa';
        ctx.fillRect(s.x + bw / 2 - 14, groundY - 38, 28, 6);
        // Gate portcullis lines
        ctx.strokeStyle = '#3333aa';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(s.x + bw / 2 - 8 + i * 5, groundY - 34);
          ctx.lineTo(s.x + bw / 2 - 8 + i * 5, groundY);
          ctx.stroke();
        }
        // Torch glow
        const torchFlicker = Math.sin(t / 100) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(255,160,40,${0.2 * torchFlicker})`;
        ctx.beginPath();
        ctx.arc(s.x + 12, topY + 30, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x + bw - 12, topY + 30, 10, 0, Math.PI * 2);
        ctx.fill();
        // Flag
        const fWave = Math.sin(t / 180) * 4;
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(s.x + bw / 2 - 1, topY - 18, 3, 20);
        ctx.fillStyle = sideColor;
        ctx.beginPath();
        ctx.moveTo(s.x + bw / 2 + 2, topY - 18);
        ctx.lineTo(s.x + bw / 2 + 18, topY - 12 + fWave);
        ctx.lineTo(s.x + bw / 2 + 2, topY - 8);
        ctx.fill();
        break;
      }

      case 2: { // Renaissance — fortified building with dome
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(s.x + bw / 2, groundY + 2, bw / 2 + 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Walls with warm gradient
        const rg = ctx.createLinearGradient(s.x, topY + 15, s.x + bw, groundY);
        rg.addColorStop(0, '#9a8a60');
        rg.addColorStop(1, '#6a5a40');
        ctx.fillStyle = rg;
        ctx.fillRect(s.x, topY + 15, bw, bh - 15);
        // Columns
        ctx.fillStyle = '#aa9a60';
        for (let c = 0; c < 4; c++) {
          ctx.fillRect(s.x + 4 + c * 20, topY + 40, 14, bh - 55);
        }
        ctx.fillStyle = '#baa870';
        for (let c = 0; c < 4; c++) {
          ctx.fillRect(s.x + 6 + c * 20, topY + 42, 10, bh - 59);
        }
        // Windows with glow
        ctx.fillStyle = '#ffd080';
        for (let c = 0; c < 4; c++) {
          ctx.fillRect(s.x + 8 + c * 20, topY + 50, 6, 10);
        }
        // Dome
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, topY + 15, 22, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#aa9a60';
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, topY + 15, 16, Math.PI, 0);
        ctx.fill();
        // Dome finial
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(s.x + bw / 2 - 1, topY - 8, 2, 10);
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, topY - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        // Door
        ctx.fillStyle = '#5a4a30';
        ctx.fillRect(s.x + bw / 2 - 8, groundY - 30, 16, 30);
        ctx.fillStyle = '#6a5a40';
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, groundY - 30, 8, Math.PI, 0);
        ctx.fill();
        // Base trim
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(s.x + 2, groundY - 4, bw - 4, 4);
        // Weather vane rotation
        const vaneAngle = Math.sin(t / 800) * 0.3;
        ctx.save();
        ctx.translate(s.x + bw / 2, topY - 14);
        ctx.rotate(vaneAngle);
        ctx.fillStyle = '#6a5a40';
        ctx.fillRect(-8, -1, 16, 2);
        ctx.fillRect(-1, -4, 2, 8);
        ctx.restore();
        break;
      }

      case 3: { // Modern Age — concrete bunker
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(s.x + bw / 2, groundY + 3, bw / 2 + 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main structure
        const mg = ctx.createLinearGradient(s.x, topY + 10, s.x, groundY);
        mg.addColorStop(0, '#5a5a5a');
        mg.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = mg;
        ctx.fillRect(s.x - 4, topY + 20, bw + 8, bh - 20);
        // Top slab
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(s.x, topY + 10, bw, 14);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(s.x, topY + 10, bw, 3);
        // Sandbag layer
        ctx.fillStyle = '#5a5a3a';
        ctx.fillRect(s.x - 6, topY + 8, bw + 12, 6);
        // Windows / gun slits
        ctx.fillStyle = '#2a2a2a';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(s.x + 6 + i * 26, topY + 26, 18, 12);
        }
        ctx.fillStyle = '#3a4a2a';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(s.x + 8 + i * 26, topY + 28, 14, 8);
        }
        // Command door
        ctx.fillStyle = '#555';
        ctx.fillRect(s.x + bw / 2 - 8, groundY - 28, 16, 28);
        ctx.fillStyle = '#444';
        ctx.fillRect(s.x + bw / 2 - 10, groundY - 30, 20, 4);
        // Sandbags on sides
        ctx.fillStyle = '#6a6a4a';
        ctx.fillRect(s.x - 10, groundY - 14, 14, 14);
        ctx.fillRect(s.x + bw - 4, groundY - 14, 14, 14);
        ctx.fillStyle = '#5a5a3a';
        ctx.fillRect(s.x - 8, groundY - 12, 10, 10);
        ctx.fillRect(s.x + bw - 2, groundY - 12, 10, 10);
        // Radar dish rotation
        const radarAngle = (t / 20) % (Math.PI * 2);
        ctx.save();
        ctx.translate(s.x + bw / 2, topY + 6);
        ctx.rotate(radarAngle);
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(0, 0, 6, -0.6, 0.6);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();
        // Blinking red light
        const blink = Math.sin(t / 300) > 0;
        if (blink) {
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(s.x + bw - 6, topY + 6, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 4: { // Future Age — tech tower with energy shield
        ctx.fillStyle = 'rgba(0,229,255,0.06)';
        ctx.beginPath();
        ctx.ellipse(s.x + bw / 2, groundY + 3, bw / 2 + 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main structure
        ctx.fillStyle = '#1a2a4a';
        ctx.fillRect(s.x - 2, topY, bw + 4, bh);
        // Light panel gradient
        const fg = ctx.createLinearGradient(s.x, topY, s.x, groundY);
        fg.addColorStop(0, '#1a2a4a');
        fg.addColorStop(0.5, '#1a3a5a');
        fg.addColorStop(1, '#1a2a4a');
        ctx.fillStyle = fg;
        ctx.fillRect(s.x, topY + 4, bw, bh - 8);
        // Circuit lines with pulse
        const pulse = (t / 1000) % 1;
        for (let j = 0; j < 5; j++) {
          const lineY = topY + 10 + j * 20;
          ctx.fillStyle = '#00e5ff';
          ctx.globalAlpha = 0.4 + Math.sin(t / 300 + j) * 0.3;
          ctx.fillRect(s.x + 4, lineY, bw - 8, 2);
          // Pulse dot traveling along line
          const dotX = s.x + 4 + ((pulse + j * 0.2) % 1) * (bw - 8);
          ctx.globalAlpha = 0.9;
          ctx.fillRect(dotX - 2, lineY - 1, 4, 4);
        }
        ctx.globalAlpha = 1;
        // Top module
        ctx.fillStyle = '#2a3a5a';
        ctx.fillRect(s.x + bw / 2 - 12, topY - 10, 24, 14);
        ctx.fillStyle = '#3a4a6a';
        ctx.fillRect(s.x + bw / 2 - 10, topY - 8, 20, 10);
        // Core orb with pulsing glow
        const orbPulse = 0.7 + Math.sin(t / 400) * 0.3;
        ctx.fillStyle = `rgba(255,0,255,${orbPulse})`;
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, topY - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,100,255,${orbPulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, topY - 12, 9, 0, Math.PI * 2);
        ctx.fill();
        // Energy shield arc
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(s.x + bw / 2, groundY - 8, 30, Math.PI, 0);
        ctx.globalAlpha = 0.1 + Math.sin(t / 500) * 0.05;
        ctx.fill();
        ctx.globalAlpha = 1;
        // Side energy strips
        ctx.fillStyle = '#00e5ff';
        ctx.globalAlpha = 0.3 + Math.sin(t / 250) * 0.2;
        ctx.fillRect(s.x - 2, topY + 10, 3, bh - 20);
        ctx.fillRect(s.x + bw - 1, topY + 10, 3, bh - 20);
        ctx.globalAlpha = 1;
        // Holographic team color
        ctx.fillStyle = sideColor;
        ctx.globalAlpha = 0.15 + Math.sin(t / 350) * 0.1;
        ctx.fillRect(s.x + bw / 2 - 8, topY + 20, 16, 10);
        ctx.globalAlpha = 1;
        break;
      }
    }

    // ── Growing turret tower (scales with occupied turret slots) ──
    const age = CONFIG.AGES[ageIndex];
    if (occupied > 0) {
      const dir = base.side === 'player' ? 1 : -1;
      const ts = this.worldToScreen(base.x + dir * CONFIG.TURRET_SLOT_OFFSET_X, base.y);
      const tx = ts.x;
      const pw = 38;
      const topSlot = groundY - (occupied - 1) * CONFIG.TURRET_SLOT_SPACING;
      const towerTop = topSlot - 18;
      const towerH = groundY - towerTop;

      ctx.save();
      ctx.shadowColor = age.color;
      ctx.shadowBlur = 8 + occupied * 4;
      const tg = ctx.createLinearGradient(tx - pw / 2, towerTop, tx + pw / 2, groundY);
      tg.addColorStop(0, age.color);
      tg.addColorStop(0.4, '#3a3a50');
      tg.addColorStop(1, '#1a1a2a');
      ctx.fillStyle = tg;
      this.roundRect(ctx, tx - pw / 2, towerTop, pw, towerH, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let yy = towerTop + 8; yy < groundY; yy += 12) {
        ctx.fillRect(tx - pw / 2 + 2, yy, pw - 4, 2);
      }

      for (let i = 0; i < occupied; i++) {
        const ly = groundY - i * CONFIG.TURRET_SLOT_SPACING;
        const barGrad = ctx.createLinearGradient(tx - pw / 2 - 8, ly, tx + pw / 2 + 8, ly);
        barGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        barGrad.addColorStop(0.5, age.color);
        barGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
        ctx.fillStyle = barGrad;
        this.roundRect(ctx, tx - pw / 2 - 8, ly - 5, pw + 16, 8, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(tx - pw / 2 - 8, ly - 5, pw + 16, 2);
      }

      const orbRadius = 6 + occupied;
      const orbGlow = ctx.createRadialGradient(tx, towerTop - 6, 0, tx, towerTop - 6, orbRadius * 2);
      orbGlow.addColorStop(0, age.color);
      orbGlow.addColorStop(0.5, 'rgba(255,255,255,0.3)');
      orbGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = orbGlow;
      ctx.beginPath();
      ctx.arc(tx, towerTop - 6, orbRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sideColor;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(tx, towerTop - 6, orbRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(tx - 2, towerTop - 8, orbRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const hpFrac = base.displayHp / base.maxHp;
    const barW = bw + 14;
    const barH = 10;
    const barX = s.x - 7;
    const barY = topY - 38;

    // HP bar background with rounded corners
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = this.hpColor(hpFrac);
    ctx.fillRect(barX, barY, barW * hpFrac, barH);
    // Inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW * hpFrac, barH / 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(base.hp)}/${base.maxHp}`, barX + barW / 2, barY + barH - 2);

    ctx.fillStyle = sideColor;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(base.side === 'player' ? 'YOUR BASE' : 'ENEMY BASE', s.x + bw / 2, topY - 50);
  },

  drawUnit(unit, ageIndex) {
    if (!unit.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(unit.x, unit.y);
    if (s.x < -100 || s.x > CONFIG.VIEWPORT.WIDTH + 100) return;
    let unitAlpha = 1;
    let unitScale = 1;
    if (unit.dying) {
      const dp = Math.min(1, unit.deathTimer / 0.35);
      unitAlpha = 1 - dp;
      unitScale = 1 - dp * 0.5;
    }
    const bob = unit.attackCooldown > 0 ? 0 : Math.sin(unit.walkPhase) * 2;
    const lean = unit.attackCooldown > 0 ? 0.05 * (unit.side === 'player' ? 1 : -1) : 0;

    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.scale(unitScale, unitScale);
    ctx.rotate(lean);
    ctx.globalAlpha = unitAlpha;

    if (unit.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(unit.hitFlash * 20) * 0.3;
    }

    const facing = unit.side === 'player' ? 1 : -1;
    const spriteType = unit.isHero ? 'hero' : unit.type;
    spriteManager.draw(ctx, spriteType, ageIndex, 0, 0, facing, unit.side);

    if (unit.isHero) {
      const pulse = 0.15 + Math.sin(Date.now() / 400) * 0.1;
      ctx.globalAlpha = pulse;
      const sideColor = unit.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.arc(0, -32, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    if (unit.isHero) {
      const pulse = 0.5 + Math.sin(this.hudTime * 3 + unit.x) * 0.3;
      ctx.save();
      ctx.strokeStyle = `rgba(255,200,100,${pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 32, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,200,100,${pulse * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 32, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const hpFrac = unit.displayHp / unit.maxHp;
    if (hpFrac < 1) {
      const barW = 36;
      const barH = 5;
      const barX = s.x - barW / 2;
      const barY = s.y - 68 + bob;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(barX, barY, barW * hpFrac, barH);
    }
  },

  drawTurret(turret, ageIndex, turretIndex) {
    if (!turret.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(turret.x, turret.y);
    if (s.x < -100 || s.x > CONFIG.VIEWPORT.WIDTH + 100) return;

    if (turret.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(turret.hitFlash * 20) * 0.3;
    }

    if (typeof spriteManager !== 'undefined') {
      spriteManager.drawTurret(ctx, turretIndex | 0, ageIndex, s.x, s.y, turret.side);
    }

    ctx.globalAlpha = 1;
    
    const hpFrac = turret.hp / turret.maxHp;
    if (hpFrac < 1) {
      const barW = 22;
      const barH = 4;
      const barX = s.x - barW / 2;
      const barY = s.y - 50;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(barX, barY, barW * hpFrac, barH);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }
  },

  drawBuilding(building, ageIndex) {
    if (!building.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(building.x, building.y);
    if (s.x < -100 || s.x > CONFIG.VIEWPORT.WIDTH + 100) return;
    const isMine = building.buildingIndex === 0;
    const sideColor = building.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;

    if (building.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(building.hitFlash * 20) * 0.3;
    }

    const bw = isMine ? 20 : 22;
    const bh = isMine ? 18 : 20;

    const bodyG = ctx.createLinearGradient(s.x, s.y - bh, s.x, s.y);
    if (isMine) {
      bodyG.addColorStop(0, '#9a8246');
      bodyG.addColorStop(1, '#5a4a2a');
    } else {
      bodyG.addColorStop(0, '#5a4a6a');
      bodyG.addColorStop(1, '#34283f');
    }
    ctx.fillStyle = bodyG;
    this.roundRect(ctx, s.x - bw / 2, s.y - bh, bw, bh, 3);
    ctx.fill();

    ctx.fillStyle = isMine ? '#b89a55' : '#6a5a7a';
    ctx.fillRect(s.x - bw / 2 + 2, s.y - bh + 2, bw - 4, bh / 2 - 2);

    if (isMine) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(s.x - 2, s.y - bh / 2 - 3, 4, 6);
      ctx.fillStyle = '#c8a000';
      ctx.fillRect(s.x - 1, s.y - bh / 2 - 5, 2, 2);
    } else {
      ctx.fillStyle = sideColor;
      ctx.fillRect(s.x - 6, s.y - bh - 4, 3, 5);
      ctx.fillRect(s.x + 3, s.y - bh - 4, 3, 5);
      ctx.fillRect(s.x - 3, s.y - bh - 6, 6, 3);
    }

    ctx.strokeStyle = isMine ? '#4a3a2a' : '#2a1f3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - bw / 2, s.y - bh, bw, bh);

    ctx.globalAlpha = 1;

    const hpFrac = building.hp / building.maxHp;
    if (hpFrac < 1) {
      const barW = 18;
      const barH = 3;
      const barX = s.x - barW / 2;
      const barY = s.y - bh - 6;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(barX, barY, barW * hpFrac, barH);
    }
  },

  drawProjectile(proj, ageIndex) {
    if (!proj.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(proj.x, proj.y);
    if (s.x < -100 || s.x > CONFIG.VIEWPORT.WIDTH + 100) return;
    const isPlayer = proj.side === 'player';
    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

    switch (ageIndex) {
      case 0: { // Stone — thrown rock
        const trailLen = Math.min(speed * 1.5, 10);
        if (trailLen > 2) {
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = '#8a7a6a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - (proj.vx / speed) * trailLen, s.y - (proj.vy / speed) * trailLen);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#8a7a6a';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a09080';
        ctx.beginPath();
        ctx.arc(s.x - 1, s.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 1: { // Castle — arrow
        ctx.save();
        ctx.translate(s.x, s.y);
        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(angle);
        const arrColor = isPlayer ? '#4477dd' : '#dd4444';
        ctx.strokeStyle = arrColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.fillStyle = arrColor;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(4, -3);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12, -2);
        ctx.lineTo(-12, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }

      case 2: { // Renaissance — cannonball
        const trailLen = Math.min(speed * 1.2, 8);
        if (trailLen > 2) {
          ctx.globalAlpha = 0.15;
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - (proj.vx / speed) * trailLen, s.y - (proj.vy / speed) * trailLen);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(s.x - 1, s.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 3: { // Modern — bullet with tracer
        const trailLen = Math.min(speed * 2, 16);
        if (trailLen > 2) {
          const grad = ctx.createLinearGradient(
            s.x, s.y,
            s.x - (proj.vx / speed) * trailLen,
            s.y - (proj.vy / speed) * trailLen
          );
          const tracerColor = isPlayer ? '#ffcc00' : '#ff4444';
          grad.addColorStop(0, tracerColor);
          grad.addColorStop(1, 'rgba(255,200,0,0)');
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - (proj.vx / speed) * trailLen, s.y - (proj.vy / speed) * trailLen);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = isPlayer ? '#ffcc00' : '#ff6644';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 4: { // Future — energy bolt
        const t = Date.now();
        const pulse = 0.7 + Math.sin(t / 50) * 0.3;
        const boltColor = isPlayer ? '#00e5ff' : '#ff00ff';

        // Outer glow
        ctx.globalAlpha = 0.2 * pulse;
        ctx.fillStyle = boltColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        const trailLen = Math.min(speed * 2, 20);
        if (trailLen > 2) {
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = boltColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - (proj.vx / speed) * trailLen, s.y - (proj.vy / speed) * trailLen);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Core
        ctx.globalAlpha = pulse;
        ctx.fillStyle = boltColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
    }
  },

  drawTurretSlots(game) {
    const ctx = this.ctx;
    this.drawSlotRow(ctx, game.turretSlotPositions, game.playerSlotsBought, 'rgba(74,138,244,0.4)', 'rgba(255,255,255,0.08)');
    this.drawSlotRow(ctx, game.enemyTurretSlotPositions, game.enemySlotsBought, 'rgba(244,74,74,0.4)', 'rgba(255,255,255,0.05)');
  },

  drawSlotRow(ctx, positions, slotsBought, activeColor, inactiveColor) {
    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      const pos = positions[i];
      const s = this.worldToScreen(pos.x, pos.y);
      ctx.strokeStyle = i < slotsBought ? activeColor : inactiveColor;
      ctx.lineWidth = i < slotsBought ? 1.5 : 1;
      ctx.setLineDash(i < slotsBought ? [6, 3] : [4, 4]);
      ctx.strokeRect(s.x - 14, s.y - 50, 28, 58);
      ctx.setLineDash([]);
    }
  },

  drawSpecialAnim(anim, playerAge, enemyAge) {
    const ctx = this.ctx;
    const camX = this.camera.x;
    const W = CONFIG.VIEWPORT.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const groundY = CONFIG.GROUND_Y;
    const age = CONFIG.AGES[anim.ageIndex];
    const isPlayer = anim.side === 'player';

    switch (anim.ageIndex) {
      case 0: // Meteor Shower
        for (const p of anim.particles) {
          const sx = p.x - camX;
          const sy = p.y;
          if (sx < -50 || sx > W + 50) continue;

          // Trail
          ctx.globalAlpha = 0.4;
          ctx.strokeStyle = '#ff6600';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < p.trail.length; i++) {
            const tx = p.trail[i].x - camX;
            const ty = p.trail[i].y;
            if (i === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Meteor rock
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(sx - 1, sy - 1, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 1: // Arrow Volley
        const arrowColor = isPlayer ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
        for (const p of anim.particles) {
          const sx = p.x - camX;
          const sy = p.y;
          if (sx < -50 || sx > W + 50 || sy < -50) continue;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(p.angle);

          // Arrow shaft
          ctx.strokeStyle = arrowColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();

          // Arrowhead
          ctx.fillStyle = arrowColor;
          ctx.beginPath();
          ctx.moveTo(p.size + 4, 0);
          ctx.lineTo(p.size - 2, -3);
          ctx.lineTo(p.size - 2, 3);
          ctx.closePath();
          ctx.fill();

          // Fletching
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(-p.size - 4, -2);
          ctx.lineTo(-p.size - 4, 2);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
        break;

      case 2: // Artillery Strike
        for (const p of anim.particles) {
          const sx = p.x - camX;
          const sy = p.y;

          if (!p.exploded) {
            // Falling cannonball
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(sx, sy, p.size + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(sx - 1, sy - 1, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.explosionRadius > 0) {
            // Explosion ring
            const r = p.explosionRadius;
            ctx.globalAlpha = 1 - r / 50;
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx, groundY, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,100,0,0.2)';
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        break;

      case 3: // Airstrike
        for (const plane of anim.particles) {
          const sx = plane.x - camX;
          const sy = plane.y;

          // Plane body
          if (sx > -80 && sx < W + 80) {
            ctx.fillStyle = '#888';
            // Fuselage
            ctx.fillRect(sx - 15, sy - 3, 30, 6);
            // Wings
            ctx.fillStyle = '#666';
            ctx.fillRect(sx - 5, sy - 12, 10, 24);
            // Tail
            ctx.fillRect(sx - 15, sy - 8, 5, 16);
            // Cockpit
            ctx.fillStyle = '#aaf';
            ctx.fillRect(sx + 10, sy - 2, 5, 4);
          }

          // Bombs
          for (const bomb of plane.bombs) {
            const bx = bomb.x - camX;
            const by = bomb.y;

            if (!bomb.exploded) {
              // Falling bomb
              ctx.fillStyle = '#333';
              ctx.fillRect(bx - 2, by - 4, 4, 8);
              ctx.fillStyle = '#555';
              ctx.fillRect(bx - 3, by + 4, 6, 3);
            } else if (bomb.explosionRadius > 0) {
              const r = bomb.explosionRadius;
              ctx.globalAlpha = 1 - r / 40;
              ctx.strokeStyle = '#ff8800';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(bx, groundY, r, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = 'rgba(255,136,0,0.15)';
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }
        break;

      case 4: // Orbital Laser
        const laser = anim.particles[0];
        if (laser.charging) {
          // Charge-up beam from sky
          const chargeFrac = laser.chargeTimer / laser.chargeDuration;
          const beamX = W / 2;
          ctx.globalAlpha = chargeFrac * 0.6;
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(beamX - 2, 0, 4, H);
          ctx.globalAlpha = chargeFrac * 0.3;
          ctx.fillRect(beamX - 8, 0, 16, H);
          ctx.globalAlpha = 1;

          // Charge glow
          ctx.fillStyle = `rgba(0,229,255,${chargeFrac * 0.4})`;
          ctx.beginPath();
          ctx.arc(beamX, 0, 20 + chargeFrac * 30, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sweeping laser beam
          const beamX = laser.sweepX - camX;
          if (beamX > -20 && beamX < W + 20) {
            // Outer glow
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(beamX - 15, 0, 30, H);

            // Inner beam
            ctx.globalAlpha = 0.8;
            ctx.fillRect(beamX - laser.width / 2, 0, laser.width, H);

            // Core
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.fillRect(beamX - 1, 0, 2, H);

            // Ground impact glow
            ctx.fillStyle = 'rgba(0,229,255,0.4)';
            ctx.beginPath();
            ctx.arc(beamX, groundY, 15, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        break;
    }
  },
});
