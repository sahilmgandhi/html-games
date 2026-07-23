class Renderer {
  constructor(canvas, ctx) {
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    this.terrainCache = null;
    this.terrainCacheAge = -1;
    this.terrainCacheWidth = 0;

    this.hudCache = null;
    this.hudCacheGold = -1;
    this.hudCacheXp = -1;
    this.hudCacheAge = -1;
    this.hudCacheSlots = -1;
    this.hudCacheSpecial = -1;

    this.xpBarProgress = 0;
    this.tooltip = null;
    this.hudTime = 0;

    this.crossfadeAge = -1;
    this.crossfadeTimer = 0;
    this.crossfadeDuration = 0.5;
    this._crossfadeCanvas = null;
    this.parallaxCache = null;
    this.parallaxCacheAge = -1;
  }

  screenShake(intensity, duration) {
    if (intensity > this.shakeIntensity) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
    }
  }

  updateShake(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const frac = this.shakeDuration > 0 ? this.shakeDuration / 0.3 : 0;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2 * frac;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2 * frac;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  scrollTo(x) {
    this.camera.x = clamp(x, 0, CONFIG.WORLD.WIDTH - CONFIG.VIEWPORT.WIDTH);
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.camera.x + this.shakeX, y: wy + this.shakeY };
  }

  buildTerrainCache(ageIndex) {
    const W = CONFIG.VIEWPORT.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const groundY = CONFIG.GROUND_Y;
    const age = CONFIG.AGES[ageIndex];

    if (!this.terrainCache || this.terrainCacheWidth !== W) {
      this.terrainCache = document.createElement('canvas');
      this.terrainCache.width = W;
      this.terrainCache.height = H;
    }
    const tc = this.terrainCache.getContext('2d');
    tc.clearRect(0, 0, W, H);

    const grad = tc.createLinearGradient(0, 0, 0, H * 0.3);
    grad.addColorStop(0, age.skyGradient[0]);
    grad.addColorStop(0.6, age.skyGradient[1]);
    grad.addColorStop(1, this.lightenColor(age.skyGradient[1], 1.15));
    tc.fillStyle = grad;
    tc.fillRect(0, 0, W, H);

    const starCount = ageIndex >= 3 ? 40 : ageIndex >= 1 ? 15 : 5;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137 + 42) % W);
      const sy = ((i * 89 + 17) % (H * 0.4));
      const size = 0.8 + (i % 3) * 0.5;
      tc.fillStyle = 'rgba(255,255,255,0.4)';
      tc.fillRect(sx, sy, size, size);
    }

    const mtnBaseY = H - 130;

    const farMtnColor = this.blendColor(age.skyGradient[1], '#ffffff', 0.15);
    for (let i = 0; i < 12; i++) {
      const mx = ((i * 250) % (W + 500)) - 250;
      const mh = 80 + Math.sin(i * 1.7) * 35;
      const mw = 120 + Math.sin(i * 0.9) * 50;
      tc.fillStyle = farMtnColor;
      tc.beginPath();
      tc.moveTo(mx - mw, mtnBaseY + 40);
      tc.quadraticCurveTo(mx - mw * 0.4, mtnBaseY - mh * 0.5, mx, mtnBaseY - mh);
      tc.quadraticCurveTo(mx + mw * 0.3, mtnBaseY - mh * 0.6, mx + mw, mtnBaseY + 40);
      tc.fill();
    }

    const midMtnColor = this.blendColor(age.skyGradient[1], '#000000', 0.3);
    for (let i = 0; i < 10; i++) {
      const mx = ((i * 300 + 80) % (W + 400)) - 200;
      const mh = 50 + Math.sin(i * 2.1) * 25;
      const mw = 90 + Math.sin(i * 1.4) * 35;
      tc.fillStyle = midMtnColor;
      tc.beginPath();
      tc.moveTo(mx - mw, mtnBaseY + 25);
      tc.quadraticCurveTo(mx - mw * 0.5, mtnBaseY - mh * 0.6, mx - mw * 0.1, mtnBaseY - mh);
      tc.quadraticCurveTo(mx + mw * 0.4, mtnBaseY - mh * 0.4, mx + mw * 0.7, mtnBaseY - mh * 0.2);
      tc.quadraticCurveTo(mx + mw * 0.9, mtnBaseY - mh * 0.1, mx + mw, mtnBaseY + 25);
      tc.fill();
    }

    const nearHillColor = this.darkenColor(age.groundColor, 0.85);
    for (let i = 0; i < 8; i++) {
      const hx = ((i * 350 + 50) % (W + 300)) - 150;
      const hh = 20 + Math.sin(i * 2.5) * 10;
      const hw = 80 + Math.sin(i * 1.8) * 30;
      tc.fillStyle = nearHillColor;
      tc.beginPath();
      tc.moveTo(hx - hw, groundY + 5);
      tc.quadraticCurveTo(hx, groundY - hh, hx + hw, groundY + 5);
      tc.fill();
    }

    const groundGrad = tc.createLinearGradient(0, groundY - 5, 0, H);
    groundGrad.addColorStop(0, age.groundColor);
    groundGrad.addColorStop(0.3, this.darkenColor(age.groundColor, 0.85));
    groundGrad.addColorStop(1, this.darkenColor(age.groundColor, 0.5));
    tc.fillStyle = groundGrad;
    tc.fillRect(0, groundY, W, H - groundY);

    const highlight = this.lightenColor(age.groundColor, 1.2);
    const shadow = this.darkenColor(age.groundColor, 0.7);
    for (let i = 0; i < 30; i++) {
      const gx = (i * 87 + 10) % W;
      tc.fillStyle = i % 2 === 0 ? highlight : shadow;
      const gw = 1 + (i % 3);
      const gh = 1 + (i % 2);
      tc.fillRect(gx, groundY + 3 + (i % 7) * 3, gw, gh);
    }

    for (let i = 0; i < 15; i++) {
      const rx = (i * 167 + 30) % W;
      const ry = groundY + 8 + (i % 5) * 6;
      tc.fillStyle = this.darkenColor(age.groundColor, 0.6);
      tc.beginPath();
      tc.ellipse(rx, ry, 2 + (i % 3), 1.5, 0, 0, Math.PI * 2);
      tc.fill();
    }

    tc.strokeStyle = this.lightenColor(age.groundColor, 1.3);
    tc.lineWidth = 1;
    tc.setLineDash([4, 6]);
    tc.beginPath();
    tc.moveTo(0, groundY);
    tc.lineTo(W, groundY);
    tc.stroke();
    tc.setLineDash([]);

    tc.strokeStyle = age.color;
    tc.lineWidth = 2;
    tc.beginPath();
    tc.moveTo(0, groundY);
    tc.lineTo(W, groundY);
    tc.stroke();

    for (let wx = 0; wx < W; wx += 80) {
      tc.strokeStyle = 'rgba(255,255,255,0.03)';
      tc.beginPath();
      tc.moveTo(wx, groundY);
      tc.lineTo(wx, H);
      tc.stroke();
    }

    this.terrainCacheAge = ageIndex;
    this.terrainCacheWidth = W;
  }

  buildParallaxCache(ageIndex) {
    const W = CONFIG.WORLD.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const age = CONFIG.AGES[ageIndex];
    const groundY = CONFIG.GROUND_Y;
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = W;
    ctx.canvas.height = H;

    const hazeColor = age.skyGradient[1];

    // far mountains (parallax 0.06)
    const farMtnY = groundY - 30;
    for (let i = 0; i < 12; i++) {
      const mx = (i * 250) % (W + 500);
      const mh = 80 + Math.sin(i * 1.7) * 35;
      const mw = 120 + Math.sin(i * 0.9) * 50;
      ctx.fillStyle = this.blendColor(hazeColor, '#ffffff', 0.2);
      ctx.beginPath();
      ctx.moveTo(mx - mw, farMtnY + 40);
      ctx.quadraticCurveTo(mx - mw * 0.4, farMtnY - mh * 0.5, mx, farMtnY - mh);
      ctx.quadraticCurveTo(mx + mw * 0.3, farMtnY - mh * 0.6, mx + mw, farMtnY + 40);
      ctx.fill();
    }

    // mid mountains (parallax 0.12)
    for (let i = 0; i < 10; i++) {
      const mx = (i * 300 + 80) % (W + 400);
      const mh = 50 + Math.sin(i * 2.1) * 25;
      const mw = 90 + Math.sin(i * 1.4) * 35;
      ctx.fillStyle = this.blendColor(hazeColor, '#000000', 0.25);
      ctx.beginPath();
      ctx.moveTo(mx - mw, farMtnY + 25);
      ctx.quadraticCurveTo(mx - mw * 0.5, farMtnY - mh * 0.6, mx - mw * 0.1, farMtnY - mh);
      ctx.quadraticCurveTo(mx + mw * 0.4, farMtnY - mh * 0.4, mx + mw * 0.7, farMtnY - mh * 0.2);
      ctx.quadraticCurveTo(mx + mw * 0.9, farMtnY - mh * 0.1, mx + mw, farMtnY + 25);
      ctx.fill();
    }

    // near hills (parallax 0.20)
    const nearHillColor = this.darkenColor(age.groundColor, 0.85);
    for (let i = 0; i < 8; i++) {
      const hx = (i * 350 + 50) % (W + 300);
      const hh = 20 + Math.sin(i * 2.5) * 10;
      const hw = 80 + Math.sin(i * 1.8) * 30;
      ctx.fillStyle = nearHillColor;
      ctx.beginPath();
      ctx.moveTo(hx - hw, groundY + 5);
      ctx.quadraticCurveTo(hx, groundY - hh, hx + hw, groundY + 5);
      ctx.fill();
    }

    this.parallaxCache = ctx.canvas;
    this.parallaxCacheAge = ageIndex;
  }

  blendColor(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  startAgeTransition(fromAge, toAge) {
    if (fromAge === toAge) return;
    this.crossfadeAge = fromAge;
    this.crossfadeTimer = this.crossfadeDuration;
  }

  updateCrossfade(dt) {
    if (this.crossfadeTimer > 0) {
      this.crossfadeTimer = Math.max(0, this.crossfadeTimer - dt);
    }
  }

  drawTerrain(ageIndex) {
    const ctx = this.ctx;
    const age = CONFIG.AGES[ageIndex];
    const camX = this.camera.x;
    const W = CONFIG.VIEWPORT.WIDTH;
    const H = CONFIG.VIEWPORT.HEIGHT;
    const groundY = CONFIG.GROUND_Y;

    if (this.terrainCacheAge !== ageIndex) {
      if (this.crossfadeTimer > 0 && this.terrainCache) {
        this._crossfadeCanvas = document.createElement('canvas');
        this._crossfadeCanvas.width = this.terrainCache.width;
        this._crossfadeCanvas.height = this.terrainCache.height;
        this._crossfadeCanvas.getContext('2d').drawImage(this.terrainCache, 0, 0);
      }
      this.buildTerrainCache(ageIndex);
    }
    ctx.drawImage(this.terrainCache, 0, 0);

    if (this.crossfadeTimer > 0 && this._crossfadeCanvas) {
      ctx.globalAlpha = this.crossfadeTimer / this.crossfadeDuration;
      ctx.drawImage(this._crossfadeCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    const starCount = ageIndex >= 3 ? 40 : ageIndex >= 1 ? 15 : 5;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137 + 42) % W);
      const sy = ((i * 89 + 17) % (H * 0.4));
      const flicker = 0.3 + Math.sin(Date.now() / 1000 + i) * 0.3 + Math.sin(Date.now() / 3700 + i * 1.3) * 0.1;
      ctx.fillStyle = `rgba(255,255,255,${flicker})`;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    const cloudBaseAlpha = 0.04 + ageIndex * 0.006;
    const cloudY = 35 + ageIndex * 10;
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 500 + 50 - camX * 0.03) % (W + 400)) - 200;
      const cy = cloudY + Math.sin(i * 2.1) * 15;
      ctx.fillStyle = `rgba(255,255,255,${cloudBaseAlpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80 + i * 10, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - 25, cy + 3, 50 + i * 6, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 35, cy - 3, 55, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 600 + 300 - camX * 0.06) % (W + 350)) - 175;
      const cy = cloudY + 25 + Math.sin(i * 3.1) * 10;
      ctx.fillStyle = `rgba(255,255,255,${cloudBaseAlpha * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 65, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.parallaxCacheAge !== ageIndex) {
      this.buildParallaxCache(ageIndex);
    }

    const Wworld = CONFIG.WORLD.WIDTH;
    const pc = this.parallaxCache;
    if (pc) {
      const offsets = [0.06, 0.12, 0.2];
      for (let oi = 0; oi < offsets.length; oi++) {
        const ox = (camX * offsets[oi]) % Wworld;
        ctx.drawImage(pc, 0, 0, Wworld, H, -ox, 0, Wworld, H);
        ctx.drawImage(pc, 0, 0, Wworld, H, Wworld - ox, 0, Wworld, H);
      }
    }

    this.drawAgeBackground(ageIndex, camX, groundY);

    const treeCount = ageIndex <= 1 ? 8 : ageIndex <= 2 ? 5 : ageIndex === 3 ? 3 : 0;
    for (let i = 0; i < treeCount; i++) {
      const tx = ((i * 320 + 50 - camX * 0.35) % (W + 200)) - 100;
      this.drawTree(tx, groundY, ageIndex);
    }

    this.drawAtmosphericEffects(ageIndex, camX, groundY, W, H);
  }

  drawAtmosphericEffects(ageIndex, camX, groundY, W, H) {
    const ctx = this.ctx;
    const now = Date.now();

    switch (ageIndex) {
      case 0: {
        const intensity = 0.6 + ageIndex * 0.18;
        const ashCount = Math.round(12 * intensity);
        for (let i = 0; i < ashCount; i++) {
          const ax = ((i * 187 + now * 0.015 * (0.3 + (i % 3) * 0.2)) % (W + 100)) - 50;
          const ay = ((now * 0.02 * (0.4 + (i % 4) * 0.15) + i * 73) % (groundY - 50)) + 50;
          const alpha = 0.08 + Math.sin(now / 2000 + i) * 0.04;
          ctx.fillStyle = `rgba(120,80,40,${alpha})`;
          ctx.fillRect(ax, ay, 2, 1);
        }
        break;
      }
      case 1: {
        const intensity = 0.6 + ageIndex * 0.18;
        const fogParts = Math.round(6 * intensity);
        for (let i = 0; i < fogParts; i++) {
          const fx = ((i * 350 + now * 0.01 * (0.3 + i * 0.1)) % (W + 400)) - 200;
          const fy = groundY - 30 + Math.sin(now / 3000 + i * 1.5) * 15;
          const alpha = 0.04 + Math.sin(now / 4000 + i) * 0.02;
          ctx.fillStyle = `rgba(180,180,200,${alpha})`;
          ctx.beginPath();
          ctx.ellipse(fx, fy, 100 + i * 15, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 2: {
        const intensity = 0.6 + ageIndex * 0.18;
        const smokeCount = Math.round(5 * intensity);
        for (let i = 0; i < smokeCount; i++) {
          const sx = ((i * 400 + 200 - camX * 0.1) % (W + 300)) - 150;
          const progress = (now / 4000 + i * 0.3) % 1;
          const sy = groundY - 20 - progress * 80;
          const alpha = 0.06 * (1 - progress);
          ctx.fillStyle = `rgba(100,80,60,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + progress * 20, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 3: {
        const intensity = 0.6 + ageIndex * 0.18;
        const rainCount = Math.round(30 * intensity);
        ctx.strokeStyle = 'rgba(150,180,200,0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < rainCount; i++) {
          const rx = ((i * 67 + now * 0.1) % W);
          const ry = ((now * 0.15 + i * 47) % (groundY + 10));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 12);
          ctx.stroke();
        }
        break;
      }
      case 4: {
        const intensity = 0.6 + ageIndex * 0.18;
        const dataCount = Math.round(15 * intensity);
        for (let i = 0; i < dataCount; i++) {
          const dx = ((i * 137 + 20) % W);
          const dy = ((now * 0.03 * (0.2 + (i % 3) * 0.1) + i * 89) % (groundY - 30)) + 20;
          const alpha = 0.05 + Math.sin(now / 1500 + i * 1.7) * 0.03;
          const glow = i % 3 === 0 ? '0,229,255' : i % 3 === 1 ? '255,0,255' : '100,255,100';
          ctx.fillStyle = `rgba(${glow},${alpha})`;
          ctx.fillRect(dx, dy, 1, 4);
        }
        break;
      }
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
                              for (let w = 0; w < 2; w++) {
            for (let j = 0; j < 3; j++) {
              ctx.fillRect(bx - 6 + w * 10, groundY - bh + 8 + j * 12, 4, 6);
            }
          }
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
                              for (let j = 0; j < 4; j++) {
            ctx.fillRect(bx - 8, groundY - bh + 10 + j * 14, 16, 3);
          }
                    ctx.fillStyle = '#ff00ff';
                              ctx.fillRect(bx - 3, groundY - bh - 8, 6, 8);
                  }
        for (let i = 0; i < 3; i++) {
          const fx = ((i * 600 + 200 - camX * 0.15) % (W + 300)) - 150;
          const fy = 60 + i * 25;
          const hover = Math.sin(Date.now() / 800 + i * 2) * 3;
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(fx - 8, fy + hover, 16, 5);
          ctx.fillRect(fx - 15, fy + hover + 2, 30, 3);
          ctx.fillStyle = '#00e5ff';
                              ctx.fillRect(fx - 2, fy + hover + 5, 4, 2);
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
    const bobOffset = Math.sin(Date.now() / 2000 + x * 0.01) * 1;
    if (ageIndex <= 1) {
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(x - 3, groundY - 30, 6, 30);
      ctx.fillStyle = '#1a4a0a';
      ctx.beginPath();
      ctx.arc(x, groundY - 38 + bobOffset, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.arc(x + 3, groundY - 42 + bobOffset, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a7a2a';
      ctx.beginPath();
      ctx.arc(x - 2, groundY - 45 + bobOffset, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (ageIndex === 2) {
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(x - 2, groundY - 28, 5, 28);
      ctx.fillStyle = '#2a5a1a';
      ctx.beginPath();
      ctx.arc(x, groundY - 35 + bobOffset, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a7a2a';
      ctx.beginPath();
      ctx.arc(x + 2, groundY - 38 + bobOffset, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x - 2, groundY - 25, 4, 25);
      ctx.fillStyle = '#4a4a2a';
      ctx.beginPath();
      ctx.arc(x, groundY - 30 + bobOffset, 10, 0, Math.PI * 2);
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
  }

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
  }

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
  }

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
  }

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
  }

  drawTurretSlots(game) {
    const ctx = this.ctx;
    this.drawSlotRow(ctx, game.turretSlotPositions, game.playerSlotsBought, 'rgba(74,138,244,0.4)', 'rgba(255,255,255,0.08)');
    this.drawSlotRow(ctx, game.enemyTurretSlotPositions, game.enemySlotsBought, 'rgba(244,74,74,0.4)', 'rgba(255,255,255,0.05)');
  }

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
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  drawHUD(game) {
    const ctx = this.ctx;
    const W = CONFIG.VIEWPORT.WIDTH;
    const HH = CONFIG.HUD_HEIGHT;
    const y = CONFIG.VIEWPORT.HEIGHT - HH;

    this._currentAge = game.age;
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
    const spReady = game.specialCooldown <= 0;

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

    ctx.fillStyle = spReady ? '#fff' : '#555';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(age.specialName, spX + spW / 2, spY + 14);
    ctx.fillStyle = spReady ? '#ffd700' : '#444';
    ctx.font = '9px monospace';
    ctx.fillText(spReady ? 'READY' : `${Math.ceil(game.specialCooldown)}s`, spX + spW / 2, spY + 26);

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

    const occupiedCount = game.turrets.filter(t => t.side === 'player').length;
    for (let i = 0; i < age.turrets.length; i++) {
      const t = age.turrets[i];
      const bx = 100 + i * 96;
      const canPlace = game.gold >= t.cost && occupiedCount < game.playerSlotsBought;
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

    const playerTurrets = game.turrets.filter(t => t.side === 'player');
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

    this._drawHudSeparators(ctx, game, W, y, unitStartX, age, spX, spW, buildingStartX, buildingBtnW, playerTurrets);

    this.drawTooltip(ctx);

    ctx.restore();
    this.drawPauseButton(game);
  }

  _drawHudSeparators(ctx, game, W, y, unitStartX, age, spX, spW, buildingStartX, buildingBtnW, playerTurrets) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(10, y + 50); ctx.lineTo(W - 10, y + 50);
    ctx.moveTo(10, y + 88); ctx.lineTo(W - 10, y + 88);
    ctx.moveTo(160, y + 4); ctx.lineTo(160, y + 56);
    ctx.moveTo(694, y + 4); ctx.lineTo(694, y + 56);
    ctx.moveTo(962, y + 4); ctx.lineTo(962, y + 56);
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
    if (playerTurrets.length > 0) {
      ctx.fillText('SELL', 100 + (playerTurrets.length * 96) / 2 - 4, y + 90);
    }
    ctx.restore();
  }

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
  }

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
  }

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
  }

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
  }

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
  }
}
