// Sky, ground, parallax, weather, and the crossfade between two ages.

Object.assign(Renderer.prototype, {
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
  },

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
  },

  startAgeTransition(fromAge, toAge) {
    if (fromAge === toAge) return;
    this.crossfadeAge = fromAge;
    this.crossfadeTimer = this.crossfadeDuration;
  },

  updateCrossfade(dt) {
    if (this.crossfadeTimer > 0) {
      this.crossfadeTimer = Math.max(0, this.crossfadeTimer - dt);
    }
  },

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
  },

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
  },

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
  },

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
  },
});
