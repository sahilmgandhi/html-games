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

    const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.VIEWPORT.HEIGHT);
    grad.addColorStop(0, age.skyGradient[0]);
    grad.addColorStop(1, age.skyGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    const starCount = ageIndex >= 3 ? 40 : ageIndex >= 1 ? 15 : 5;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137 + 42) % CONFIG.VIEWPORT.WIDTH);
      const sy = ((i * 89 + 17) % (CONFIG.VIEWPORT.HEIGHT * 0.4));
      const flicker = 0.4 + Math.sin(Date.now() / 1000 + i) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${flicker})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    const cloudY = 40 + ageIndex * 8;
    const cloudCount = 6;
    for (let i = 0; i < cloudCount; i++) {
      const cx = ((i * 400 + 80 - camX * 0.05) % (CONFIG.VIEWPORT.WIDTH + 300)) - 150;
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

    const mtnY = CONFIG.VIEWPORT.HEIGHT - 130;
    ctx.fillStyle = this.darkenColor(age.skyGradient[1], 0.5);
    for (let i = 0; i < 8; i++) {
      const mx = ((i * 350 - camX * 0.1) % (CONFIG.VIEWPORT.WIDTH + 400)) - 200;
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
      const mx = ((i * 280 + 100 - camX * 0.2) % (CONFIG.VIEWPORT.WIDTH + 300)) - 150;
      const mh = 35 + Math.sin(i * 3.1) * 15;
      const mw = 70 + Math.sin(i * 1.9) * 25;
      ctx.beginPath();
      ctx.moveTo(mx - mw, mtnY + 20);
      ctx.lineTo(mx, mtnY - mh);
      ctx.lineTo(mx + mw, mtnY + 20);
      ctx.fill();
    }

    const groundY = CONFIG.VIEWPORT.HEIGHT - 100;
    ctx.fillStyle = age.groundColor;
    ctx.fillRect(0, groundY, CONFIG.VIEWPORT.WIDTH, 100);

    ctx.fillStyle = this.lightenColor(age.groundColor, 1.15);
    for (let i = 0; i < 20; i++) {
      const gx = ((i * 130 - camX * 0.5) % CONFIG.VIEWPORT.WIDTH);
      ctx.fillRect(gx, groundY + 5, 3, 2);
      ctx.fillRect(gx + 50, groundY + 15, 4, 2);
      ctx.fillRect(gx + 80, groundY + 8, 2, 3);
    }

    const treeCount = ageIndex <= 1 ? 8 : ageIndex <= 2 ? 5 : ageIndex === 3 ? 3 : 0;
    for (let i = 0; i < treeCount; i++) {
      const tx = ((i * 320 + 50 - camX * 0.35) % (CONFIG.VIEWPORT.WIDTH + 200)) - 100;
      const ty = groundY;
      this.drawTree(tx, ty, ageIndex);
    }

    if (ageIndex >= 3) {
      for (let i = 0; i < 3; i++) {
        const bx = ((i * 500 + 200 - camX * 0.3) % (CONFIG.VIEWPORT.WIDTH + 200)) - 100;
        const by = groundY;
        ctx.fillStyle = '#444';
        ctx.fillRect(bx - 8, by - 35, 16, 35);
        ctx.fillStyle = '#555';
        ctx.fillRect(bx - 12, by - 40, 24, 8);
        ctx.fillStyle = ageIndex === 4 ? '#00e5ff' : '#ff4444';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;
        ctx.fillRect(bx - 2, by - 42, 4, 3);
        ctx.shadowBlur = 0;
      }
    }

    ctx.strokeStyle = age.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.VIEWPORT.WIDTH, groundY);
    ctx.stroke();

    for (let wx = -camX % 80; wx < CONFIG.VIEWPORT.WIDTH; wx += 80) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(wx, groundY);
      ctx.lineTo(wx, CONFIG.VIEWPORT.HEIGHT);
      ctx.stroke();
    }
  }

  drawTree(x, groundY, ageIndex) {
    const ctx = this.ctx;
    ctx.fillStyle = ageIndex <= 1 ? '#4a3520' : '#555';
    ctx.fillRect(x - 3, groundY - 30, 6, 30);

    if (ageIndex <= 1) {
      ctx.fillStyle = '#2a5a1a';
      ctx.beginPath();
      ctx.arc(x, groundY - 35, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a4a0a';
      ctx.beginPath();
      ctx.arc(x - 5, groundY - 30, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (ageIndex === 2) {
      ctx.fillStyle = '#3a6a2a';
      ctx.beginPath();
      ctx.arc(x, groundY - 35, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#5a5a3a';
      ctx.beginPath();
      ctx.arc(x, groundY - 32, 10, 0, Math.PI * 2);
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
    const age = CONFIG.AGES[ageIndex];
    const sideColor = unit.side === 'player' ? '#4a8af4' : '#f44a4a';
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

    this.drawUnitSprite(unit.type, ageIndex, sideColor, ctx);

    ctx.restore();

    const hpFrac = unit.hp / unit.maxHp;
    if (hpFrac < 1) {
      const barW = 24;
      const barH = 4;
      const barX = s.x - barW / 2;
      const barY = s.y - 32 + bob;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(barX, barY, barW * hpFrac, barH);
    }
  }

  drawUnitSprite(type, ageIndex, color, ctx) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

    switch (type) {
      case 'melee':
        if (ageIndex === 0) {
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -18, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(-4, -12, 8, 16);
          ctx.fillRect(-6, 4, 4, 8);
          ctx.fillRect(2, 4, 4, 8);
          ctx.strokeStyle = '#6B5335';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(6, -8);
          ctx.lineTo(14, -16);
          ctx.stroke();
        } else if (ageIndex === 1) {
          ctx.fillStyle = '#C0C0C0';
          ctx.beginPath();
          ctx.arc(0, -18, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#666';
          ctx.fillRect(-5, -12, 10, 16);
          ctx.fillStyle = '#888';
          ctx.fillRect(-3, -14, 6, 4);
          ctx.fillStyle = '#C0C0C0';
          ctx.fillRect(7, -12, 3, 18);
          ctx.fillRect(5, -14, 7, 3);
        } else if (ageIndex === 2) {
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -18, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#8B6914';
          ctx.fillRect(-5, -12, 10, 16);
          ctx.fillStyle = '#666';
          ctx.fillRect(6, -20, 2, 22);
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.moveTo(6, -20);
          ctx.lineTo(2, -24);
          ctx.lineTo(10, -24);
          ctx.closePath();
          ctx.fill();
        } else if (ageIndex === 3) {
          ctx.fillStyle = '#556B2F';
          ctx.fillRect(-5, -12, 10, 16);
          ctx.fillRect(-6, 4, 4, 8);
          ctx.fillRect(2, 4, 4, 8);
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#556B2F';
          ctx.fillRect(-6, -22, 12, 6);
          ctx.fillStyle = '#333';
          ctx.fillRect(5, -8, 8, 3);
        } else {
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(-6, -14, 12, 20);
          ctx.fillRect(-7, 6, 5, 8);
          ctx.fillRect(2, 6, 5, 8);
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, -20, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(8, -8, 12, 3);
          ctx.shadowBlur = 0;
        }
        break;

      case 'ranged':
        if (ageIndex === 0) {
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -16, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(-4, -11, 8, 14);
          ctx.fillRect(-5, 3, 4, 6);
          ctx.fillRect(1, 3, 4, 6);
          ctx.strokeStyle = '#6B5335';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(10, -12, 8, -0.8, 0.8);
          ctx.stroke();
        } else if (ageIndex === 1) {
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -16, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#2a5a2a';
          ctx.fillRect(-4, -11, 8, 14);
          ctx.fillRect(-5, 3, 4, 6);
          ctx.fillRect(1, 3, 4, 6);
          ctx.strokeStyle = '#8B7355';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(6, -10);
          ctx.lineTo(6, -20);
          ctx.lineTo(4, -22);
          ctx.stroke();
        } else if (ageIndex === 2) {
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -16, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#333';
          ctx.fillRect(-4, -11, 8, 14);
          ctx.fillRect(-5, 3, 4, 6);
          ctx.fillRect(1, 3, 4, 6);
          ctx.fillStyle = '#888';
          ctx.fillRect(5, -14, 12, 2);
        } else if (ageIndex === 3) {
          ctx.fillStyle = '#556B2F';
          ctx.fillRect(-4, -11, 8, 14);
          ctx.fillRect(-5, 3, 4, 6);
          ctx.fillRect(1, 3, 4, 6);
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(0, -16, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#333';
          ctx.fillRect(5, -10, 10, 2);
        } else {
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(-5, -12, 10, 18);
          ctx.fillRect(-6, 6, 4, 6);
          ctx.fillRect(2, 6, 4, 6);
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(6, -8, 14, 2);
          ctx.shadowBlur = 0;
        }
        break;

      case 'fast':
        if (ageIndex === 0) {
          ctx.fillStyle = '#4a8a2a';
          ctx.beginPath();
          ctx.ellipse(0, -10, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#3a6a1a';
          ctx.beginPath();
          ctx.ellipse(-8, -14, 5, 3, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#3a6a1a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-12, -8);
          ctx.lineTo(-16, -4);
          ctx.moveTo(-12, -6);
          ctx.lineTo(-16, -2);
          ctx.stroke();
        } else if (ageIndex === 1) {
          ctx.fillStyle = '#8B7355';
          ctx.beginPath();
          ctx.ellipse(0, -12, 12, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(-6, -18, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#444';
          ctx.fillRect(-4, -16, 2, 8);
        } else if (ageIndex === 2) {
          ctx.fillStyle = '#8B6914';
          ctx.beginPath();
          ctx.ellipse(0, -10, 10, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(-4, -16, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (ageIndex === 3) {
          ctx.fillStyle = '#556B2F';
          ctx.beginPath();
          ctx.ellipse(0, -8, 14, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.ellipse(0, -6, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#D2B48C';
          ctx.beginPath();
          ctx.arc(-6, -14, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1a3a5a';
          ctx.beginPath();
          ctx.ellipse(0, -8, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.ellipse(-8, -10, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        break;

      case 'siege':
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(-10, -8, 20, 12);
        ctx.fillRect(-12, 4, 24, 4);
        ctx.fillStyle = '#666';
        ctx.fillRect(-6, -6, 12, 4);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(18, -6);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.fillRect(-12, 8, 6, 4);
        ctx.fillRect(6, 8, 6, 4);
        break;

      case 'elite':
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(-7, -14, 14, 20);
        ctx.fillRect(-8, 6, 6, 8);
        ctx.fillRect(2, 6, 6, 8);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -18, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 4;
        ctx.fillRect(8, -6, 14, 3);
        ctx.fillRect(-22, -6, 14, 3);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, -18, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'armored':
        ctx.fillStyle = '#556B2F';
        ctx.fillRect(-14, -6, 28, 12);
        ctx.fillRect(-10, -14, 16, 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(-14, 6, 6, 4);
        ctx.fillRect(8, 6, 6, 4);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(20, -8);
        ctx.stroke();
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.arc(0, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        ctx.fillRect(-5, -15, 10, 20);
        break;
    }
  }

  drawTurret(turret, ageIndex) {
    if (!turret.alive) return;
    const ctx = this.ctx;
    const s = this.worldToScreen(turret.x - 15, turret.y - 25);
    const age = CONFIG.AGES[ageIndex];
    const sideColor = turret.side === 'player' ? '#4a8af4' : '#f44a4a';

    ctx.fillStyle = age.color;
    ctx.fillRect(s.x, s.y, 30, 25);
    ctx.fillRect(s.x - 5, s.y + 25, 40, 10);

    ctx.fillStyle = sideColor;
    ctx.fillRect(s.x + 10, s.y - 8, 4, 12);

    if (turret.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(s.x, s.y, 30, 25);
    }

    const hpFrac = turret.hp / turret.maxHp;
    if (hpFrac < 1) {
      const barW = 30;
      const barH = 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(s.x, s.y - 8, barW, barH);
      ctx.fillStyle = this.hpColor(hpFrac);
      ctx.fillRect(s.x, s.y - 8, barW * hpFrac, barH);
    }
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
      const s = this.worldToScreen(pos.x - 15, pos.y - 25);

      if (i < game.playerSlotsBought) {
        ctx.strokeStyle = 'rgba(74,138,244,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, 30, 35);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, 30, 35);
        ctx.setLineDash([]);
      }
    }

    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      const pos = game.enemyTurretSlotPositions[i];
      const s = this.worldToScreen(pos.x - 15, pos.y - 25);

      if (i < game.enemySlotsBought) {
        ctx.strokeStyle = 'rgba(244,74,74,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, 30, 35);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(s.x, s.y, 30, 35);
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

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2, h / 2 - 40);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press ESC or P to resume', w / 2, h / 2 + 10);

    const settingsX = w / 2 - 50;
    const settingsY = h / 2 + 40;
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(settingsX, settingsY, 100, 36);
    ctx.strokeStyle = '#6a6aaa';
    ctx.strokeRect(settingsX, settingsY, 100, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Settings', w / 2, settingsY + 23);
  }

  drawSettingsScreen(game) {
    const ctx = this.ctx;
    const w = CONFIG.VIEWPORT.WIDTH;
    const h = CONFIG.VIEWPORT.HEIGHT;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);

    const panelW = 300;
    const panelH = 260;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Settings', cx, panelY + 35);

    const musicBtnY = panelY + 90;
    const musicOn = game.audio.musicEnabled;
    ctx.fillStyle = musicOn ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(cx - 100, musicBtnY, 200, 36);
    ctx.strokeStyle = musicOn ? '#4a8' : '#844';
    ctx.strokeRect(cx - 100, musicBtnY, 200, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Music: ${musicOn ? 'ON' : 'OFF'}`, cx, musicBtnY + 22);

    const sfxBtnY = panelY + 140;
    const sfxOn = game.audio.sfxEnabled;
    ctx.fillStyle = sfxOn ? '#2a4a2a' : '#4a2a2a';
    ctx.fillRect(cx - 100, sfxBtnY, 200, 36);
    ctx.strokeStyle = sfxOn ? '#4a8' : '#844';
    ctx.strokeRect(cx - 100, sfxBtnY, 200, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Sound Effects: ${sfxOn ? 'ON' : 'OFF'}`, cx, sfxBtnY + 22);

    const muteBtnY = panelY + 190;
    const muted = game.audio.muted;
    ctx.fillStyle = muted ? '#4a2a2a' : '#2a4a2a';
    ctx.fillRect(cx - 100, muteBtnY, 200, 36);
    ctx.strokeStyle = muted ? '#844' : '#4a8';
    ctx.strokeRect(cx - 100, muteBtnY, 200, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Mute All: ${muted ? 'ON' : 'OFF'}`, cx, muteBtnY + 22);

    const resumeBtnY = panelY + 235;
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(cx - 100, resumeBtnY, 200, 36);
    ctx.strokeStyle = '#4a6a8a';
    ctx.strokeRect(cx - 100, resumeBtnY, 200, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Resume', cx, resumeBtnY + 22);
  }
}
