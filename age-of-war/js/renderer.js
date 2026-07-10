class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
  }

  scrollTo(x) {
    this.camera.x = clamp(x, 0, CONFIG.WORLD.WIDTH - CONFIG.VIEWPORT.WIDTH);
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.camera.x, y: wy };
  }

  drawTerrain(ageIndex) {
    const ctx = this.ctx;
    const age = CONFIG.AGES[ageIndex];
    const camX = this.camera.x;
    const W = CONFIG.VIEWPORT.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const groundY = H - 100;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, age.skyGradient[0]);
    grad.addColorStop(1, age.skyGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const starCount = ageIndex >= 3 ? 40 : ageIndex >= 1 ? 15 : 5;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137 + 42) % W);
      const sy = ((i * 89 + 17) % (H * 0.4));
      const flicker = 0.4 + Math.sin(Date.now() / 1000 + i) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${flicker})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    const cloudY = 40 + ageIndex * 8;
    const cloudCount = 6;
    for (let i = 0; i < cloudCount; i++) {
      const cx = ((i * 400 + 80 - camX * 0.05) % (W + 300)) - 150;
      const cy = cloudY + Math.sin(i * 1.7) * 20;
      const alpha = 0.03 + ageIndex * 0.005;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + i * 8, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 30, cy - 5, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const mtnY = H - 130;
    ctx.fillStyle = this.darkenColor(age.skyGradient[1], 0.5);
    for (let i = 0; i < 8; i++) {
      const mx = ((i * 350 - camX * 0.1) % (W + 400)) - 200;
      const mh = 60 + Math.sin(i * 2.3) * 30;
      const mw = 100 + Math.sin(i * 1.1) * 40;
      ctx.beginPath();
      ctx.moveTo(mx - mw, mtnY + 30);
      ctx.lineTo(mx, mtnY - mh);
      ctx.lineTo(mx + mw, mtnY + 30);
      ctx.fill();
    }

    ctx.fillStyle = this.darkenColor(age.skyGradient[1], 0.7);
    for (let i = 0; i < 10; i++) {
      const mx = ((i * 280 + 100 - camX * 0.2) % (W + 300)) - 150;
      const mh = 35 + Math.sin(i * 3.1) * 15;
      const mw = 70 + Math.sin(i * 1.9) * 25;
      ctx.beginPath();
      ctx.moveTo(mx - mw, mtnY + 20);
      ctx.lineTo(mx, mtnY - mh);
      ctx.lineTo(mx + mw, mtnY + 20);
      ctx.fill();
    }

    this.drawAgeBackground(ageIndex, camX, groundY);

    ctx.fillStyle = age.groundColor;
    ctx.fillRect(0, groundY, W, 100);

    ctx.fillStyle = this.lightenColor(age.groundColor, 1.15);
    for (let i = 0; i < 20; i++) {
      const gx = ((i * 130 - camX * 0.5) % W);
      ctx.fillRect(gx, groundY + 5, 3, 2);
      ctx.fillRect(gx + 50, groundY + 15, 4, 2);
      ctx.fillRect(gx + 80, groundY + 8, 2, 3);
    }

    const treeCount = ageIndex <= 1 ? 8 : ageIndex <= 2 ? 5 : ageIndex === 3 ? 3 : 0;
    for (let i = 0; i < treeCount; i++) {
      const tx = ((i * 320 + 50 - camX * 0.35) % (W + 200)) - 100;
      this.drawTree(tx, groundY, ageIndex);
    }

    ctx.strokeStyle = age.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    for (let wx = -camX % 80; wx < W; wx += 80) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(wx, groundY);
      ctx.lineTo(wx, H);
      ctx.stroke();
    }
  }

  drawAgeBackground(ageIndex, camX, groundY) {
    const ctx = this.ctx;
    const W = CONFIG.VIEWPORT.WIDTH;

    switch (ageIndex) {
      case 0: {
        for (let i = 0; i < 3; i++) {
          const vx = ((i * 700 + 300 - camX * 0.15) % (W + 400)) - 200;
          const vw = 60 + i * 20;
          const vh = 40 + i * 10;
          ctx.fillStyle = '#3a2010';
          ctx.beginPath();
          ctx.moveTo(vx - vw, groundY + 20);
          ctx.lineTo(vx - 15, groundY - vh);
          ctx.lineTo(vx + 5, groundY - vh - 15);
          ctx.lineTo(vx + 20, groundY - vh + 5);
          ctx.lineTo(vx + vw, groundY + 20);
          ctx.fill();
          ctx.fillStyle = '#ff440033';
          ctx.beginPath();
          ctx.arc(vx + 5, groundY - vh - 10, 6 + Math.sin(Date.now() / 500 + i) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 4; i++) {
          const hx = ((i * 500 + 100 - camX * 0.3) % (W + 200)) - 100;
          ctx.fillStyle = '#5a4030';
          ctx.fillRect(hx, groundY - 25, 30, 25);
          ctx.fillStyle = '#8a6040';
          ctx.beginPath();
          ctx.moveTo(hx - 5, groundY - 25);
          ctx.lineTo(hx + 15, groundY - 40);
          ctx.lineTo(hx + 35, groundY - 25);
          ctx.fill();
        }
        break;
      }
      case 1: {
        for (let i = 0; i < 2; i++) {
          const cx = ((i * 900 + 200 - camX * 0.12) % (W + 400)) - 200;
          const cw = 80;
          const ch = 90;
          ctx.fillStyle = '#3a3a5a';
          ctx.fillRect(cx - cw / 2, groundY - ch, cw, ch);
          ctx.fillStyle = '#4a4a6a';
          ctx.fillRect(cx - cw / 2 - 8, groundY - ch - 10, cw + 16, 12);
          ctx.fillStyle = '#2a2a4a';
          for (let t = 0; t < 3; t++) {
            const tw = 12;
            const th = 15;
            const tx = cx - cw / 2 + 10 + t * 25;
            ctx.fillRect(tx, groundY - ch - 25, tw, th);
            ctx.fillStyle = '#4444aa';
            ctx.fillRect(tx + 2, groundY - ch - 28, 4, 8);
            ctx.fillRect(tx + 6, groundY - ch - 28, 4, 8);
            ctx.fillStyle = '#2a2a4a';
          }
        }
        for (let i = 0; i < 6; i++) {
          const bx = ((i * 350 + 50 - camX * 0.25) % (W + 200)) - 100;
          ctx.fillStyle = '#4444aa';
          ctx.fillRect(bx, groundY - 50, 2, 50);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(bx + 3, groundY - 48, 12, 8);
        }
        break;
      }
      case 2: {
        for (let i = 0; i < 2; i++) {
          const sx = ((i * 800 + 400 - camX * 0.12) % (W + 400)) - 200;
          ctx.fillStyle = '#6a5a40';
          ctx.fillRect(sx - 3, groundY - 70, 6, 70);
          ctx.fillRect(sx - 15, groundY - 70, 30, 6);
          ctx.fillStyle = '#8a7a50';
          ctx.beginPath();
          ctx.moveTo(sx, groundY - 90);
          ctx.lineTo(sx - 12, groundY - 70);
          ctx.lineTo(sx + 12, groundY - 70);
          ctx.fill();
          ctx.fillStyle = '#aa9a60';
          ctx.fillRect(sx - 2, groundY - 85, 4, 4);
        }
        for (let i = 0; i < 8; i++) {
          const fx = ((i * 280 + 30 - camX * 0.4) % W);
          ctx.strokeStyle = '#7a6a40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fx, groundY + 2);
          ctx.lineTo(fx + 20, groundY + 2);
          ctx.stroke();
        }
        break;
      }
      case 3: {
        for (let i = 0; i < 4; i++) {
          const bx = ((i * 500 + 150 - camX * 0.25) % (W + 300)) - 150;
          const bh = 50 + Math.sin(i * 2.7) * 20;
          ctx.fillStyle = '#3a3a3a';
          ctx.fillRect(bx - 10, groundY - bh, 20, bh);
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(bx - 14, groundY - bh - 6, 28, 8);
          ctx.fillStyle = ageIndex === 3 ? '#ff4444' : '#00e5ff';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 3;
          for (let w = 0; w < 2; w++) {
            for (let j = 0; j < 3; j++) {
              ctx.fillRect(bx - 6 + w * 10, groundY - bh + 8 + j * 12, 4, 6);
            }
          }
          ctx.shadowBlur = 0;
        }
        for (let i = 0; i < 2; i++) {
          const sx = ((i * 700 + 500 - camX * 0.2) % (W + 300)) - 150;
          ctx.fillStyle = '#555';
          ctx.fillRect(sx, groundY - 45, 4, 45);
          ctx.fillRect(sx - 15, groundY - 45, 30, 3);
          ctx.fillRect(sx - 10, groundY - 42, 20, 2);
        }
        ctx.fillStyle = 'rgba(80,80,80,0.15)';
        for (let i = 0; i < 5; i++) {
          const sx = ((i * 400 + 100 - camX * 0.08) % (W + 300)) - 150;
          ctx.beginPath();
          ctx.arc(sx, groundY - 30, 10 + Math.sin(Date.now() / 2000 + i) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 4: {
        for (let i = 0; i < 5; i++) {
          const bx = ((i * 450 + 100 - camX * 0.25) % (W + 300)) - 150;
          const bh = 70 + Math.sin(i * 1.9) * 25;
          ctx.fillStyle = '#1a1a3a';
          ctx.fillRect(bx - 12, groundY - bh, 24, bh);
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 6;
          for (let j = 0; j < 4; j++) {
            ctx.fillRect(bx - 8, groundY - bh + 10 + j * 14, 16, 3);
          }
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ff00ff';
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 4;
          ctx.fillRect(bx - 3, groundY - bh - 8, 6, 8);
          ctx.shadowBlur = 0;
        }
        for (let i = 0; i < 3; i++) {
          const fx = ((i * 600 + 200 - camX * 0.15) % (W + 300)) - 150;
          const fy = 60 + i * 25;
          const hover = Math.sin(Date.now() / 800 + i * 2) * 3;
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(fx - 8, fy + hover, 16, 5);
          ctx.fillRect(fx - 15, fy + hover + 2, 30, 3);
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 3;
          ctx.fillRect(fx - 2, fy + hover + 5, 4, 2);
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = 'rgba(0,229,255,0.06)';
        for (let i = 0; i < 4; i++) {
          const gx = ((i * 500 + 50 - camX * 0.1) % (W + 300)) - 150;
          ctx.fillRect(gx, groundY - 20, 80, 20);
        }
        break;
      }
    }
  }

  drawTree(x, groundY, ageIndex) {
    const ctx = this.ctx;
    if (ageIndex <= 1) {
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(x - 3, groundY - 30, 6, 30);
      ctx.fillStyle = '#2a5a1a';
      ctx.beginPath();
      ctx.arc(x, groundY - 35, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a4a0a';
      ctx.beginPath();
      ctx.arc(x - 5, groundY - 30, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (ageIndex === 2) {
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(x - 2, groundY - 28, 5, 28);
      ctx.fillStyle = '#3a6a2a';
      ctx.beginPath();
      ctx.arc(x, groundY - 33, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#555';
      ctx.fillRect(x - 2, groundY - 25, 4, 25);
      ctx.fillStyle = '#5a5a3a';
      ctx.beginPath();
      ctx.arc(x, groundY - 30, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
  }

  lightenColor(hex, factor) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
  }

  hpColor(frac) {
    const r = Math.round(255 * (1 - frac));
    const g = Math.round(255 * frac);
    return `rgb(${r},${g},30)`;
  }

  drawBase(base, ageIndex) {
    const ctx = this.ctx;
    const s = this.worldToScreen(base.x - base.width / 2, base.y - base.height);
    const age = CONFIG.AGES[ageIndex];

    ctx.fillStyle = age.color;
    ctx.fillRect(s.x, s.y, base.width, base.height);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(base.side === 'player' ? 'YOUR BASE' : 'ENEMY BASE', s.x + base.width / 2, s.y - 8);

    const hpFrac = base.hp / base.maxHp;
    const barW = base.width;
    const barH = 8;
    const barY = s.y - 16;

    ctx.fillStyle = '#333';
    ctx.fillRect(s.x, barY, barW, barH);
    ctx.fillStyle = this.hpColor(hpFrac);
    ctx.fillRect(s.x, barY, barW * hpFrac, barH);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(s.x, barY, barW, barH);

    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(base.hp)}/${base.maxHp}`, s.x + barW / 2, barY + barH - 1);
  }

  drawUnit(unit, ageIndex) {
    if (!unit.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(unit.x, unit.y);
    const bobSpeed = unit.attackCooldown > 0 ? 0 : unit.speed * 600;
    const bob = Math.sin(Date.now() / (bobSpeed || 300) + unit.x) * 2;
    const lean = unit.attackCooldown > 0 ? 0.05 * (unit.side === 'player' ? 1 : -1) : 0;

    ctx.save();
    ctx.translate(s.x, s.y + bob);
    ctx.rotate(lean);

    if (unit.hitFlash > 0) {
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
    }

    const facing = unit.side === 'player' ? 1 : -1;
    spriteManager.draw(ctx, unit.type, ageIndex, 0, 0, facing);

    ctx.shadowBlur = 0;
    ctx.restore();

    const hpFrac = unit.hp / unit.maxHp;
    if (hpFrac < 1) {
      const barW = 30;
      const barH = 5;
      const barX = s.x - barW / 2;
      const barY = s.y - 52 + bob;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(barX, barY, barW * hpFrac, barH);
    }
  }

  drawTurret(turret, ageIndex) {
    if (!turret.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(turret.x, turret.y);
    const age = CONFIG.AGES[ageIndex];
    const sideColor = turret.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;

    ctx.fillStyle = age.color;
    ctx.fillRect(s.x - 8, s.y - 38, 16, 38);
    ctx.fillRect(s.x - 12, s.y, 24, 8);

    ctx.fillStyle = '#555';
    ctx.fillRect(s.x - 10, s.y - 42, 20, 6);
    ctx.fillStyle = '#444';
    ctx.fillRect(s.x - 6, s.y - 44, 12, 4);

    ctx.fillStyle = sideColor;
    ctx.fillRect(s.x - 2, s.y - 52, 4, 10);
  }

  drawProjectile(proj) {
    if (!proj.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(proj.x, proj.y);
    ctx.fillStyle = proj.side === 'player' ? '#ffcc00' : '#ff4444';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTurretSlots(game) {
    const ctx = this.ctx;

    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      const pos = game.turretSlotPositions[i];
      const s = this.worldToScreen(pos.x, pos.y);

      if (i < game.playerSlotsBought) {
        ctx.strokeStyle = 'rgba(74,138,244,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x - 14, s.y - 50, 28, 58);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x - 14, s.y - 50, 28, 58);
        ctx.setLineDash([]);
      }
    }

    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      const pos = game.enemyTurretSlotPositions[i];
      const s = this.worldToScreen(pos.x, pos.y);

      if (i < game.enemySlotsBought) {
        ctx.strokeStyle = 'rgba(244,74,74,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x - 14, s.y - 50, 28, 58);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x - 14, s.y - 50, 28, 58);
        ctx.setLineDash([]);
      }
    }
  }

  drawHUD(game) {
    const ctx = this.ctx;
    const hudH = 100;
    const y = CONFIG.VIEWPORT.HEIGHT - hudH;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, y, CONFIG.VIEWPORT.WIDTH, hudH);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${Math.floor(game.gold)}`, 10, y + 18);

    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`XP: ${Math.floor(game.xp)}`, 10, y + 36);

    const age = CONFIG.AGES[game.currentAge];
    ctx.fillStyle = age.color;
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(age.name, 65, y + 54);

    const unitStartX = 120;
    for (let i = 0; i < age.units.length; i++) {
      const u = age.units[i];
      const bx = unitStartX + i * 90;
      const canAfford = game.gold >= u.cost;

      ctx.fillStyle = canAfford ? '#2a4a2a' : '#3a2a2a';
      ctx.fillRect(bx, y + 5, 80, 28);
      ctx.strokeStyle = canAfford ? '#4a8' : '#844';
      ctx.strokeRect(bx, y + 5, 80, 28);

      ctx.fillStyle = canAfford ? '#fff' : '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(u.name, bx + 40, y + 17);
      ctx.fillText(`${u.cost}g`, bx + 40, y + 27);
    }

    const evoNeeded = CONFIG.EVOLVE_XP[game.currentAge + 1];
    if (evoNeeded !== undefined) {
      const evoX = unitStartX + age.units.length * 90 + 10;
      const canEvolve = game.xp >= evoNeeded;
      ctx.fillStyle = canEvolve ? '#4a2a6a' : '#2a2a3a';
      ctx.fillRect(evoX, y + 5, 90, 28);
      ctx.strokeStyle = canEvolve ? '#a4f' : '#448';
      ctx.strokeRect(evoX, y + 5, 90, 28);
      ctx.fillStyle = canEvolve ? '#fff' : '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Evolve', evoX + 45, y + 17);
      ctx.fillText(`${evoNeeded} xp`, evoX + 45, y + 27);
    }

    const spX = CONFIG.VIEWPORT.WIDTH - 110;
    const spReady = game.specialCooldown <= 0;
    ctx.fillStyle = spReady ? '#6a2a0a' : '#2a2a2a';
    ctx.fillRect(spX, y + 5, 100, 28);
    ctx.strokeStyle = spReady ? '#fa4' : '#444';
    ctx.strokeRect(spX, y + 5, 100, 28);
    ctx.fillStyle = spReady ? '#fff' : '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(age.specialName, spX + 50, y + 17);
    ctx.fillText(spReady ? 'READY' : `${Math.ceil(game.specialCooldown)}s`, spX + 50, y + 27);

    this.drawPauseButton(game);

    const row2Y = y + 38;

    const slotsFull = game.playerSlotsBought >= CONFIG.TURRET_SLOTS;
    const canBuySlot = game.gold >= CONFIG.TURRET_SLOT_COST && !slotsFull;
    ctx.fillStyle = canBuySlot ? '#2a3a4a' : '#2a2a2a';
    ctx.fillRect(10, row2Y, 90, 24);
    ctx.strokeStyle = canBuySlot ? '#48f' : '#444';
    ctx.strokeRect(10, row2Y, 90, 24);
    ctx.fillStyle = canBuySlot ? '#fff' : '#888';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Slot (${game.playerSlotsBought}/${CONFIG.TURRET_SLOTS})`, 55, row2Y + 10);
    ctx.fillText(slotsFull ? 'FULL' : `${CONFIG.TURRET_SLOT_COST}g`, 55, row2Y + 20);

    const occupiedCount = game.turrets.filter(t => t.side === 'player').length;
    for (let i = 0; i < age.turrets.length; i++) {
      const t = age.turrets[i];
      const bx = 110 + i * 100;
      const canPlace = game.gold >= t.cost && occupiedCount < game.playerSlotsBought;
      const turretBtnColor = canPlace ? '#2a3a2a' : '#2a2a2a';

      ctx.fillStyle = turretBtnColor;
      ctx.fillRect(bx, row2Y, 90, 24);
      ctx.strokeStyle = canPlace ? '#8a4' : '#444';
      ctx.strokeRect(bx, row2Y, 90, 24);
      ctx.fillStyle = canPlace ? '#fff' : '#888';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.name, bx + 45, row2Y + 10);
      ctx.fillText(`${t.cost}g`, bx + 45, row2Y + 20);
    }

    const playerTurrets = game.turrets.filter(t => t.side === 'player');
    const row3Y = row2Y + 28;
    for (let i = 0; i < playerTurrets.length; i++) {
      const t = playerTurrets[i];
      const bx = 110 + i * 100;
      const refund = Math.floor(t.cost * 0.5);

      ctx.fillStyle = '#4a2a2a';
      ctx.fillRect(bx, row3Y, 90, 18);
      ctx.strokeStyle = '#a44';
      ctx.strokeRect(bx, row3Y, 90, 18);
      ctx.fillStyle = '#faa';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Sell ${refund}g`, bx + 45, row3Y + 12);
    }
  }

  drawPauseButton(game) {
    const ctx = this.ctx;
    const bx = CONFIG.VIEWPORT.WIDTH - 30;
    const by = 22;

    ctx.fillStyle = game.paused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, 24, 24);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeRect(bx, by, 24, 24);

    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('||', bx + 12, by + 16);
  }

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
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(btnX, debugBtnY, btnW, btnH);
    ctx.strokeStyle = '#8a6aaa';
    ctx.strokeRect(btnX, debugBtnY, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.fillText('Debug Mode', cx, debugBtnY + 19);

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
  }

  drawDebugScreen(game) {
    const ctx = this.ctx;
    const w = CONFIG.VIEWPORT.WIDTH;
    const h = CONFIG.VIEWPORT.HEIGHT;
    const cx = w / 2;
    const panelW = 560;
    const panelH = 540;
    const panelX = cx - panelW / 2;
    const panelY = (h - panelH) / 2;
    const bw = 170;
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

    let y = panelY + 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('RESOURCES', col1X, y);
    y += 16;

    drawBtn(col1X, y, 'Gold +5,000', true);
    drawBtn(col2X, y, 'XP +10,000', true);
    y += 30;

    drawBtn(col1X, y, 'Gold +50,000', true);
    drawBtn(col2X, y, 'XP +100,000', true);
    y += 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMBAT', col1X, y);
    y += 16;

    drawBtn(col1X, y, 'Kill Enemies', false);
    drawBtn(col2X, y, 'Kill Players', false);
    y += 30;

    drawBtn(col1X, y, 'Full Heal Base', true);
    drawBtn(col2X, y, 'Instant Win', false);
    y += 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EVOLUTION & STATUS', col1X, y);
    y += 16;

    drawBtn(col1X, y, 'Evolve Player', true);
    drawBtn(col2X, y, 'Evolve Enemy', true);
    y += 30;

    drawBtn(col1X, y, `Invincible: ${game.invincible ? 'ON' : 'OFF'}`, game.invincible);
    drawBtn(col2X, y, `Speed: ${game.gameSpeed}x (click)`, game.gameSpeed > 1);
    y += 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPAWN UNIT', col1X, y);
    y += 16;

    const age = CONFIG.AGES[game.currentAge];
    const unitNames = age.units.map((u, i) => u.name.substring(0, 14));
    const spawnColW = bw;
    for (let i = 0; i < unitNames.length; i++) {
      const rowX = i < 2 ? col1X : col2X;
      const rowY = y + (i % 2) * 26;
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
      y += 26;
    } else {
      y += 52;
    }
    y += 6;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCENARIOS', col1X, y);
    y += 16;

    drawBtn(col1X, y, 'Wave Defense', false);
    drawBtn(col2X, y, 'Boss Rush', false);
    y += 30;

    drawBtn(col1X, y, 'Max Evolution', false);
    drawBtn(col2X, y, 'Reset Game', false);
    y += 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DATA', col1X, y);
    y += 16;

    drawBtn(col1X, y, 'Export JSON', false);
    drawBtn(col2X, y, 'Export CSV', false);
    y += 36;

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('STATS', col1X, y);
    y += 14;

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
  }

  drawSpecialAnim(anim, playerAge, enemyAge) {
    const ctx = this.ctx;
    const camX = this.camera.x;
    const W = CONFIG.VIEWPORT.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const groundY = H - 100;
    const age = CONFIG.AGES[anim.ageIndex];
    const isPlayer = anim.side === 'player';
    const color = isPlayer ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;

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
        for (const p of anim.particles) {
          const sx = p.x - camX;
          const sy = p.y;
          if (sx < -50 || sx > W + 50 || sy < -50) continue;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(p.angle);

          // Arrow shaft
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();

          // Arrowhead
          ctx.fillStyle = color;
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
  }
}
