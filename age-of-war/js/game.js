const DEBUG_PASSWORD_HASH = '09a02186ab393005456913adb512de365a1f56681a045078e0a94d0ea03946b7';

class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.renderer = new Renderer(canvas, ctx);
    this.input = new InputHandler(canvas, this.renderer);
    this.input.setGame(this);
    this.particles = new ParticleSystem();
    this.minimap = new Minimap();
    this.audio = new AudioManager();
    this.achievements = new Achievements();
    this.ai = null;

    this.gold = CONFIG.STARTING_GOLD;
    this.xp = CONFIG.STARTING_XP;
    this.currentAge = 0;

    this.enemyGold = CONFIG.STARTING_GOLD;
    this.enemyXp = CONFIG.STARTING_XP;
    this.enemyAge = 0;

    this.specialCooldown = 0;
    this.enemySpecialCooldown = 0;
    this.specialAnim = null;

    this.playerBase = new Base(CONFIG.BASE_X_OFFSET, CONFIG.GROUND_Y, 'player');
    this.enemyBase = new Base(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, CONFIG.GROUND_Y, 'enemy');

    this.units = [];
    this.turrets = [];
    this.buildings = [];
    this.projectilePool = new ProjectilePool(64);
    this.spatialHash = new SpatialHash(128);
    this.staticHash = new SpatialHash(128);
    this.staticDirty = true;

    this.playerSlotsBought = 0;
    this.enemySlotsBought = 0;
    this.unitUpgrades = {};
    this.heroCooldown = 0;
    this.enemyHeroCooldown = 0;
    this.turretSlotPositions = this.computeSlotPositions(CONFIG.BASE_X_OFFSET, 1);
    this.enemyTurretSlotPositions = this.computeSlotPositions(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, -1);

    this.lastTime = 0;
    this.running = false;
    this.gameOver = false;
    this.winner = null;
    this.paused = false;
    this.debugOpen = false;
    this.debugPasswordOpen = false;
    this.debugPasswordBuffer = '';
    this.debugPasswordError = false;
    this.invincible = false;
    this.gameSpeed = 1;
    this.difficulty = 0;
    this.started = false;
    this.flashTimer = 0;
    this.gameTime = 0;
    this.baseDamageFlash = 0;
    this.lowQuality = false;
    this.fpsAvg = 60;
    this.lastFrameTime = performance.now();
    this._playerBaseHpPrev = CONFIG.BASE_HP;
    this.formationMode = 0;
    this._lastAchievementId = null;
    this.totalSpawned = 0;
    this.totalGoldSpent = 0;
    this.playerLowestHp = CONFIG.BASE_HP;
    this.musicWereOn = false;
    this.sfxWereOn = false;

    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.gameOver) {
        this.restart();
      } else if (!this.started) {
        return;
      } else if (this.debugPasswordOpen) {
        this.handleDebugPasswordClick();
      } else if (this.debugOpen) {
        this.handleDebugClick();
      } else if (this.paused) {
        this.handlePauseClick();
      } else {
        const mx = this.input.mouseX;
        const my = this.input.mouseY;

        if (pointInRect(mx, my, CONFIG.VIEWPORT.WIDTH - 30, 22, 24, 24)) {
          this.togglePause();
          return;
        }

        if (my >= 2 && my <= 20) {
          const worldX = (mx / CONFIG.VIEWPORT.WIDTH) * CONFIG.WORLD.WIDTH;
          this.renderer.scrollTo(worldX - CONFIG.VIEWPORT.WIDTH / 2);
          return;
        }

        this.input.handleClick(this);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.debugPasswordOpen) {
        if (e.key === 'Escape') {
          this.debugPasswordOpen = false;
          this.debugPasswordBuffer = '';
          this.debugPasswordError = false;
        } else if (e.key === 'Enter') {
          this.handleDebugPasswordClick();
        } else if (e.key === 'Backspace') {
          this.debugPasswordBuffer = this.debugPasswordBuffer.slice(0, -1);
          this.debugPasswordError = false;
        } else if (e.key.length === 1) {
          this.debugPasswordBuffer += e.key;
          this.debugPasswordError = false;
        }
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.gameOver) return;
        if (this.debugOpen) {
          this.debugOpen = false;
          return;
        }
        this.togglePause();
      }
    });
  }

  start() {
    this.ai = new AI(this);
    this.running = true;
    this.lastTime = performance.now();
    this.audio.init();
    this.audio.startMusic(this.currentAge);
    this.started = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;

    const now = performance.now();
    const frameDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (frameDelta > 0) this.fpsAvg += ((1000 / frameDelta) - this.fpsAvg) * 0.1;
    this.lowQuality = this.fpsAvg < 45;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.paused) {
      this.update(dt * this.gameSpeed);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.gameOver) return;

    this.input.update();
    this.gameTime += dt;

    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.enemySpecialCooldown > 0) this.enemySpecialCooldown -= dt;
    if (this.heroCooldown > 0) this.heroCooldown -= dt;
    if (this.enemyHeroCooldown > 0) this.enemyHeroCooldown -= dt;
    this.updateSpecialAnim(dt);

    this.ai.update(dt);

    this.spatialHash.clear();
    for (const u of this.units) {
      if (u.alive) this.spatialHash.insert(u);
    }

    if (this.staticDirty) {
      this.staticHash.clear();
      for (const t of this.turrets) {
        if (t.alive) this.staticHash.insert(t);
      }
      for (const b of this.buildings) {
        if (b.alive) this.staticHash.insert(b);
      }
      this.staticDirty = false;
    }

    for (const u of this.units) {
      const prevProjCount = this.projectilePool.active.length;
      const attackResult = u.update(dt, this.units, this.turrets, u.side === 'player' ? this.enemyBase : this.playerBase, this.projectilePool, this.spatialHash);
      if (this.projectilePool.active.length > prevProjCount) {
        this.audio.play('fire');
      } else if (attackResult === 'melee') {
        this.audio.play('hit');
      }
    }

    for (const t of this.turrets) {
      const prevProjCount = this.projectilePool.active.length;
      t.update(dt, this.units, this.projectilePool, this.spatialHash);
      if (this.projectilePool.active.length > prevProjCount) {
        this.audio.play('fire');
      }
    }

    for (const p of this.projectilePool.active) {
      p.update(dt);
      const hits = p.checkHit(this.units, this.turrets, [this.playerBase, this.enemyBase], this.spatialHash);
      if (hits.length > 0) {
        this.audio.play('hit');
        for (const hit of hits) {
          const color = hit.entity instanceof Unit ? (hit.entity.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY) : hit.entity instanceof Turret ? (hit.entity.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY) : '#ff8800';
          this.particles.emitDamageNumber(hit.entity.x, hit.entity.y, hit.damage, color);
        }
      }
    }
    this.projectilePool.releaseDead();

    for (const b of this.buildings) {
      if (!b.alive) continue;
      const produced = b.update(dt, this.units);
      if (produced > 0 && b.side === 'player') {
        this.gold += produced;
      } else if (produced > 0) {
        this.enemyGold += produced;
      }
    }

    {
      let write = 0;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (!u.alive) {
          this.particles.emitBurst(u.x, u.y, u.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY, this.lowQuality ? 5 : 12, 4, 0.6, 3);
          this.particles.emitGoldNumber(u.x, u.y, u.goldReward);

          if (u.side === 'player') {
            this.enemyGold += u.goldReward * CONFIG.DIFFICULTIES[this.difficulty].enemyGoldMult;
            this.enemyXp += u.xpReward;
          } else {
            this.gold += u.goldReward;
            this.xp += u.xpReward;
          }

          this.audio.play('death');
          this.audio.play('gold');
        } else {
          this.units[write++] = u;
        }
      }
      this.units.length = write;
    }

    {
      let write = 0;
      for (let i = 0; i < this.turrets.length; i++) {
        const t = this.turrets[i];
        if (!t.alive) {
          this.particles.emit(t.x, t.y, t.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY, 8, 3, 0.5, 2);
          this.audio.play('death');
        } else {
          this.turrets[write++] = t;
        }
      }
      this.turrets.length = write;
    }

    {
      let write = 0;
      for (let i = 0; i < this.buildings.length; i++) {
        if (this.buildings[i].alive) this.buildings[write++] = this.buildings[i];
      }
      this.buildings.length = write;
    }

    if (this.invincible) {
      this.playerBase.hp = this.playerBase.maxHp;
    }

    if (this.playerBase.hp <= 0) {
      this.gameOver = true;
      this.winner = 'enemy';
    } else if (this.enemyBase.hp <= 0) {
      this.gameOver = true;
      this.winner = 'player';
    }

    this.particles.update(dt);
    this.renderer.updateShake(dt);
    this.renderer.updateCrossfade(dt);

    this.playerBase.displayHp += (this.playerBase.hp - this.playerBase.displayHp) * Math.min(1, dt * 8);
    this.enemyBase.displayHp += (this.enemyBase.hp - this.enemyBase.displayHp) * Math.min(1, dt * 8);
    if (this.playerBase.hp < this._playerBaseHpPrev) {
      this.baseDamageFlash = 0.35;
    }
    this._playerBaseHpPrev = this.playerBase.hp;
    if (this.baseDamageFlash > 0) this.baseDamageFlash = Math.max(0, this.baseDamageFlash - dt);

    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);

    if (this.playerBase.hp < this.playerLowestHp) this.playerLowestHp = this.playerBase.hp;

    this.achievements.update(dt, this);
    this.achievements.check(this);
    balanceTracker.update(this);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    this.renderer.drawTerrain(this.currentAge);

    this.renderer.drawTurretSlots(this);

    const playerTurretCount = this.turrets.filter(t => t.side === 'player' && t.alive).length;
    const enemyTurretCount = this.turrets.filter(t => t.side === 'enemy' && t.alive).length;
    this.renderer.drawBase(this.playerBase, this.currentAge, playerTurretCount);
    this.renderer.drawBase(this.enemyBase, this.enemyAge, enemyTurretCount);

    for (const t of this.turrets) {
      this.renderer.drawTurret(t, t.side === 'player' ? this.currentAge : this.enemyAge);
    }

    for (const b of this.buildings) {
      if (!b.alive) continue;
      this.renderer.drawBuilding(b, b.side === 'player' ? this.currentAge : this.enemyAge);
    }

    for (const u of this.units) {
      this.renderer.drawUnit(u, u.side === 'player' ? this.currentAge : this.enemyAge);
    }

    for (const p of this.projectilePool.active) {
      this.renderer.drawProjectile(p, p.side === 'player' ? this.currentAge : this.enemyAge);
    }

    this.particles.draw(ctx, this.renderer);

    if (this.specialAnim) {
      this.renderer.drawSpecialAnim(this.specialAnim, this.currentAge, this.enemyAge);
    }

    this.renderer.drawHUD(this);
    this.drawAchievementPopup();
    this.minimap.draw(ctx, this.units, this.turrets, [this.playerBase, this.enemyBase], this.renderer.camera.x, this.buildings);

    if (this.gameOver) {
      this.drawGameOver();
    }

    if (this.debugOpen) {
      this.renderer.drawDebugScreen(this);
    } else if (this.debugPasswordOpen) {
      this.renderer.drawPasswordPrompt(this);
    } else if (this.paused) {
      this.renderer.drawPauseScreen(this);
    }

    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashTimer * 0.4})`;
      ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
    }

    if (this.baseDamageFlash > 0) {
      ctx.fillStyle = `rgba(255,40,40,${this.baseDamageFlash * 0.35})`;
      ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
    }
  }

  drawAchievementPopup() {
    const popup = this.achievements.getCurrentPopup();
    if (popup && popup.id !== this._lastAchievementId) {
      this._lastAchievementId = popup.id;
      this.particles.emitBurst(CONFIG.VIEWPORT.WIDTH - 116, 48, '#ffd700', 8, 4, 0.5, 2);
      this.audio.play('gold');
    }
    if (!popup) return;
    const ctx = this.ctx;
    const W = CONFIG.VIEWPORT.WIDTH;
    const pw = 200;
    const ph = 40;
    const px = W - pw - 16;
    const py = 28;

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(20,20,40,0.95)';
    this.renderer.roundRect(ctx, px, py, pw, ph, 8);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    this.renderer.roundRect(ctx, px, py, pw, ph, 8);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Achievement!', px + 10, py + 14);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(popup.name, px + 10, py + 30);

    ctx.restore();
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    const isWin = this.winner === 'player';
    const color = isWin ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
    const cx = CONFIG.VIEWPORT.WIDTH / 2;

    ctx.fillStyle = color;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isWin ? 'VICTORY!' : 'DEFEAT!', cx, CONFIG.VIEWPORT.HEIGHT / 2 - 80);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px monospace';
    const stats = [
      `Time: ${Math.floor(this.gameTime)}s`,
      `Units Spawned: ${this.totalSpawned}`,
      `Age Reached: ${CONFIG.AGES[this.currentAge].name}`,
      `Gold Spent: ${Math.floor(this.totalGoldSpent)}`,
    ];
    for (let i = 0; i < stats.length; i++) {
      ctx.fillText(stats[i], cx, CONFIG.VIEWPORT.HEIGHT / 2 - 30 + i * 18);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px sans-serif';
    ctx.fillText('Click to Restart', cx, CONFIG.VIEWPORT.HEIGHT / 2 + 60);
  }

  restart() {
    this.gold = CONFIG.STARTING_GOLD;
    this.xp = CONFIG.STARTING_XP;
    this.currentAge = 0;
    this.enemyGold = CONFIG.STARTING_GOLD;
    this.enemyXp = CONFIG.STARTING_XP;
    this.enemyAge = 0;
    this.specialCooldown = 0;
    this.enemySpecialCooldown = 0;
    this.specialAnim = null;
    this.gameTime = 0;
    this.totalGoldSpent = 0;
    balanceTracker.reset();
    this.units = [];
    this.turrets = [];
    this.buildings = [];
    this.projectilePool = new ProjectilePool(64);
    this.spatialHash = new SpatialHash(128);
    this.staticHash = new SpatialHash(128);
    this.staticDirty = true;
    this.particles = new ParticleSystem();
    this.playerSlotsBought = 0;
    this.enemySlotsBought = 0;
    this.unitUpgrades = {};
    this.heroCooldown = 0;
    this.enemyHeroCooldown = 0;
    this.paused = false;
    this.debugOpen = false;
    this.debugPasswordOpen = false;
    this.debugPasswordBuffer = '';
    this.debugPasswordError = false;
    this.invincible = false;
    this.gameSpeed = 1;
    this.formationMode = 0;
    this.totalSpawned = 0;
    this.playerLowestHp = CONFIG.BASE_HP;
    this.baseDamageFlash = 0;
    this.lowQuality = false;
    this.fpsAvg = 60;
    this._playerBaseHpPrev = CONFIG.BASE_HP;
    this.gameOver = false;
    this.winner = null;
    this.renderer.camera.x = 0;
    this.difficulty = 0;
    this.ai = new AI(this);
    this.audio.stopMusic();
    this.audio.startMusic(0);
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.musicWereOn = this.audio.musicEnabled;
      this.sfxWereOn = this.audio.sfxEnabled;
      this.audio.stopMusic();
      this.audio.musicEnabled = false;
      this.audio.sfxEnabled = false;
    } else {
      this.audio.musicEnabled = this.musicWereOn;
      this.audio.sfxEnabled = this.sfxWereOn;
      if (this.audio.musicEnabled) {
        this.audio.startMusic(this.currentAge);
      }
    }
  }

  handlePauseClick() {
    const mx = this.input.mouseX;
    const my = this.input.mouseY;
    const cx = CONFIG.VIEWPORT.WIDTH / 2;
    const cy = CONFIG.VIEWPORT.HEIGHT / 2;
    const panelW = 340;
    const panelH = 360;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;

    const musicBtnY = panelY + 70;
    if (pointInRect(mx, my, cx - 110, musicBtnY, 220, 30)) {
      this.audio.musicEnabled = !this.audio.musicEnabled;
      return;
    }

    const sfxBtnY = panelY + 110;
    if (pointInRect(mx, my, cx - 110, sfxBtnY, 220, 30)) {
      this.audio.sfxEnabled = !this.audio.sfxEnabled;
      return;
    }

    const debugBtnY = panelY + 170;
    if (pointInRect(mx, my, cx - 110, debugBtnY, 220, 30)) {
      this.debugPasswordOpen = true;
      this.debugPasswordBuffer = '';
      this.debugPasswordError = false;
      return;
    }

    const restartBtnY = panelY + 220;
    if (pointInRect(mx, my, cx - 110, restartBtnY, 220, 30)) {
      this.paused = false;
      this.audio.musicEnabled = this.musicWereOn;
      this.audio.sfxEnabled = this.sfxWereOn;
      this.restart();
      return;
    }

    const resumeBtnY = panelY + 280;
    if (pointInRect(mx, my, cx - 110, resumeBtnY, 220, 30)) {
      this.togglePause();
      return;
    }
  }

  async _hashPassword(input) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async handleDebugPasswordClick() {
    const mx = this.input.mouseX;
    const my = this.input.mouseY;
    const cx = CONFIG.VIEWPORT.WIDTH / 2;
    const cy = CONFIG.VIEWPORT.HEIGHT / 2;
    const panelW = 300;
    const panelH = 160;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;
    const inputX = panelX + 20;
    const inputY = panelY + 60;
    const inputW = panelW - 40;
    const submitBtnY = panelY + 100;

    if (pointInRect(mx, my, inputX, inputY, inputW, 28)) return;

    if (pointInRect(mx, my, cx - 60, submitBtnY, 120, 28)) {
      const hash = await this._hashPassword(this.debugPasswordBuffer);
      if (hash === DEBUG_PASSWORD_HASH) {
        this.debugPasswordOpen = false;
        this.debugPasswordBuffer = '';
        this.debugPasswordError = false;
        this.debugOpen = true;
      } else {
        this.debugPasswordError = true;
        this.debugPasswordBuffer = '';
      }
      return;
    }

    const cancelBtnY = submitBtnY + 34;
    if (pointInRect(mx, my, cx - 60, cancelBtnY, 120, 28)) {
      this.debugPasswordOpen = false;
      this.debugPasswordBuffer = '';
      this.debugPasswordError = false;
      return;
    }
  }

  handleDebugClick() {
    const mx = this.input.mouseX;
    const my = this.input.mouseY;
    const cx = CONFIG.VIEWPORT.WIDTH / 2;
    const panelW = 560;
    const panelH = 540;
    const panelX = cx - panelW / 2;
    const panelY = (CONFIG.VIEWPORT.HEIGHT - panelH) / 2;
    const bw = 170;
    const bh = 26;
    const col1X = panelX + 10;
    const col2X = panelX + 10 + bw + 10;

    let y = panelY + 52;
    if (pointInRect(mx, my, col1X, y, bw, bh)) { this.gold += 5000; return; }
    if (pointInRect(mx, my, col2X, y, bw, bh)) { this.xp += 10000; return; }
    y += 30;
    if (pointInRect(mx, my, col1X, y, bw, bh)) { this.gold += 50000; return; }
    if (pointInRect(mx, my, col2X, y, bw, bh)) { this.xp += 100000; return; }

    y = panelY + 134;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      for (const u of this.units) {
        if (u.side === 'enemy' && u.alive) {
          u.alive = false;
          this.particles.emit(u.x, u.y, '#f44', 8, 4, 0.5, 3);
        }
      }
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      for (const u of this.units) {
        if (u.side === 'player' && u.alive) {
          u.alive = false;
          this.particles.emit(u.x, u.y, '#48f', 8, 4, 0.5, 3);
        }
      }
      return;
    }
    y += 30;
    if (pointInRect(mx, my, col1X, y, bw, bh)) { this.playerBase.hp = this.playerBase.maxHp; return; }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      for (const u of this.units) { if (u.side === 'enemy' && u.alive) u.alive = false; }
      for (const t of this.turrets) { if (t.side === 'enemy' && t.alive) t.alive = false; }
      this.enemyBase.hp = 0;
      this.gameOver = true;
      this.winner = 'player';
      return;
    }

    y = panelY + 216;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      if (this.currentAge < CONFIG.AGES.length - 1) {
        this.currentAge++;
        this.playerBase.healFraction(CONFIG.EVOLVE_HEAL);
        this.flashTimer = 0.5;
        this.audio.updateMusicAge(this.currentAge);
      }
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      if (this.enemyAge < CONFIG.AGES.length - 1) {
        this.enemyAge++;
        this.enemyBase.healFraction(CONFIG.EVOLVE_HEAL);
      }
      return;
    }
    y += 30;
    if (pointInRect(mx, my, col1X, y, bw, bh)) { this.invincible = !this.invincible; return; }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      const speeds = [1, 2, 3, 5, 10];
      const idx = speeds.indexOf(this.gameSpeed);
      this.gameSpeed = speeds[(idx + 1) % speeds.length];
      return;
    }

    y = panelY + 298;
    const age = CONFIG.AGES[this.currentAge];
    for (let i = 0; i < age.units.length; i++) {
      const useTwoCols = age.units.length <= 3;
      const rowX = useTwoCols ? (i < 2 ? col1X : col2X) : col1X;
      const rowY = useTwoCols ? y + (i % 2) * 26 : y + i * 26;
      if (pointInRect(mx, my, rowX, rowY, bw, bh)) {
        this.spawnUnit(i);
        return;
      }
      if (pointInRect(mx, my, rowX + bw + 2, rowY, 28, bh)) {
        this.spawnEnemyUnit(i);
        return;
      }
    }

    y += age.units.length <= 2 ? 32 : age.units.length <= 3 ? 58 : 4 * 26 + 6;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      this.gold = 100000;
      this.xp = 500000;
      for (let i = 0; i < 10; i++) this.spawnEnemyUnit(0);
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      this.gold = 100000;
      this.xp = 500000;
      this.enemyAge = CONFIG.AGES.length - 1;
      const lastIdx = CONFIG.AGES[this.enemyAge].units.length - 1;
      this.spawnEnemyUnit(lastIdx);
      if (lastIdx > 0) this.spawnEnemyUnit(lastIdx - 1);
      return;
    }
    y += 30;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      this.gold = 999999;
      this.xp = 999999;
      this.currentAge = CONFIG.AGES.length - 1;
      this.enemyAge = CONFIG.AGES.length - 1;
      this.playerBase.hp = this.playerBase.maxHp;
      this.enemyBase.hp = this.enemyBase.maxHp;
      this.flashTimer = 0.5;
      this.audio.updateMusicAge(this.currentAge);
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      this.restart();
      return;
    }
    y += 36;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      balanceTracker.download(`balance_${Math.floor(this.gameTime)}s.json`, 'json');
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      balanceTracker.download(`balance_${Math.floor(this.gameTime)}s.csv`, 'csv');
      return;
    }

    const backBtnY = panelY + panelH - 36;
    if (pointInRect(mx, my, cx - 90, backBtnY, 180, 28)) {
      this.debugOpen = false;
      return;
    }
  }

  computeSlotPositions(baseX, dir) {
    const positions = [];
    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      positions.push({ x: baseX + dir * CONFIG.TURRET_SLOT_OFFSET_X, y: CONFIG.GROUND_Y - i * CONFIG.TURRET_SLOT_SPACING });
    }
    return positions;
  }

  buySlot() {
    if (this.playerSlotsBought >= CONFIG.TURRET_SLOTS) return;
    if (this.gold < CONFIG.TURRET_SLOT_COST) return;
    this.gold -= CONFIG.TURRET_SLOT_COST;
    this.totalGoldSpent += CONFIG.TURRET_SLOT_COST;
    this.playerSlotsBought++;
    this.audio.play('spawn');
  }

  spawnTurret(turretIndex) {
    this.spawnTurretForSide('player', turretIndex);
  }

  spawnEnemyTurret(turretIndex) {
    this.spawnTurretForSide('enemy', turretIndex);
  }

  spawnTurretForSide(side, turretIndex) {
    const isPlayer = side === 'player';
    const slotsBought = isPlayer ? this.playerSlotsBought : this.enemySlotsBought;
    if (slotsBought === 0) return;

    const occupiedCount = this.turrets.filter(t => t.side === side).length;
    if (occupiedCount >= slotsBought) return;

    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    const data = age.turrets[turretIndex];
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < data.cost) return;

    if (isPlayer) {
      this.gold -= data.cost;
      this.totalGoldSpent += data.cost;
    } else {
      this.enemyGold -= data.cost;
    }

    const slotPositions = isPlayer ? this.turretSlotPositions : this.enemyTurretSlotPositions;
    const pos = slotPositions[occupiedCount];
    const t = new Turret(pos.x, pos.y, side, isPlayer ? this.currentAge : this.enemyAge, turretIndex);

    if (!isPlayer) {
      const diff = CONFIG.DIFFICULTIES[this.difficulty];
      t.hp = Math.round(data.hp * diff.enemyHpMult);
      t.maxHp = t.hp;
    }

    this.turrets.push(t);
    this.staticDirty = true;
    if (isPlayer) this.audio.play('spawn');
  }

  sellTurret(turretIndex) {
    const playerTurrets = this.turrets.filter(t => t.side === 'player');
    if (turretIndex >= playerTurrets.length) return;

    const t = playerTurrets[turretIndex];
    const refund = Math.floor(t.cost * CONFIG.TURRET_REFUND_RATE);
    this.gold += refund;
    t.alive = false;
    this.staticDirty = true;
    this.particles.emitGoldNumber(t.x, t.y, refund);
    this.audio.play('gold');
  }

  getUnitUpgradeCost(unitIndex) {
    const tier = this.unitUpgrades[unitIndex] || 0;
    if (tier >= CONFIG.MAX_UPGRADE_TIER) return null;
    const age = CONFIG.AGES[this.currentAge];
    const baseCost = age.units[unitIndex].cost;
    return Math.round(baseCost * CONFIG.UNIT_UPGRADE_COSTS[tier + 1]);
  }

  upgradeUnit(unitIndex) {
    const tier = this.unitUpgrades[unitIndex] || 0;
    if (tier >= CONFIG.MAX_UPGRADE_TIER) return;
    const cost = this.getUnitUpgradeCost(unitIndex);
    if (cost === null || this.gold < cost) return;
    this.gold -= cost;
    this.totalGoldSpent += cost;
    this.unitUpgrades[unitIndex] = tier + 1;
    this.audio.play('evolve');
    this.audio.play('ui_click');
  }

  getBuildingCount(side) {
    return this.buildings.filter(b => b.side === side && b.alive).length;
  }

  buyBuilding(buildingIndex) {
    const data = CONFIG.BUILDINGS[buildingIndex];
    if (this.gold < data.cost) return;
    this.gold -= data.cost;
    this.totalGoldSpent += data.cost;
    const px = CONFIG.BASE_X_OFFSET + 30 + (this.getBuildingCount('player') + 1) * 10;
    const b = new Building(px, CONFIG.GROUND_Y - 20, 'player', buildingIndex);
    this.buildings.push(b);
    this.staticDirty = true;
    this.audio.play('spawn');
  }

  buyEnemyBuilding(buildingIndex) {
    const data = CONFIG.BUILDINGS[buildingIndex];
    if (this.enemyGold < data.cost) return;
    this.enemyGold -= data.cost;
    const px = CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30 - (this.getBuildingCount('enemy') + 1) * 10;
    const b = new Building(px, CONFIG.GROUND_Y - 20, 'enemy', buildingIndex);
    this.buildings.push(b);
    this.staticDirty = true;
  }

  buyEnemySlot() {
    if (this.enemySlotsBought >= CONFIG.TURRET_SLOTS) return;
    this.enemySlotsBought++;
  }

  spawnUnit(unitIndex) {
    this.spawnUnitForSide('player', unitIndex);
  }

  spawnEnemyUnit(unitIndex) {
    this.spawnUnitForSide('enemy', unitIndex);
  }

  spawnUnitForSide(side, unitIndex) {
    const isPlayer = side === 'player';
    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    const data = age.units[unitIndex];
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < data.cost) return;

    if (isPlayer) {
      this.gold -= data.cost;
      this.totalGoldSpent += data.cost;
    } else {
      this.enemyGold -= data.cost;
    }

    let spawnX = isPlayer
      ? CONFIG.BASE_X_OFFSET + 30
      : CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30;

    if (isPlayer && this.formationMode > 0) {
      const sameTypeUnits = this.units.filter(u => u.side === 'player' && u.unitIndex === unitIndex && u.alive);
      const count = sameTypeUnits.length;
      const spacing = 20;
      if (this.formationMode === 1) {
        spawnX += (count % 5) * spacing - Math.min(count, 5) * spacing / 2;
      } else if (this.formationMode === 2) {
        const row = Math.floor(count / 5);
        const col = count % 5;
        spawnX += (col - 2) * spacing * (1 - row * 0.15);
      }
    }

    const u = new Unit(spawnX, CONFIG.GROUND_Y, side, isPlayer ? this.currentAge : this.enemyAge, unitIndex, isPlayer ? (this.unitUpgrades[unitIndex] || 0) : 0);

    if (!isPlayer) {
      const diff = CONFIG.DIFFICULTIES[this.difficulty];
      u.hp = Math.round(data.hp * diff.enemyHpMult);
      u.maxHp = u.hp;
      u.damage = Math.round(data.damage * diff.enemyDmgMult);
    }

    this.units.push(u);
    if (isPlayer) {
      this.totalSpawned++;
      this.audio.play('spawn');
      this.audio.play('ui_click');
    }
  }

  spawnHero(side) {
    const isPlayer = side === 'player';
    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    if (!age.hero) return;

    const cooldown = isPlayer ? this.heroCooldown : this.enemyHeroCooldown;
    if (cooldown > 0) return;

    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < age.hero.cost) return;

    if (isPlayer) {
      this.gold -= age.hero.cost;
      this.totalGoldSpent += age.hero.cost;
    } else {
      this.enemyGold -= age.hero.cost;
    }

    if (isPlayer) this.heroCooldown = CONFIG.HERO_COOLDOWN;
    else this.enemyHeroCooldown = CONFIG.HERO_COOLDOWN;

    const spawnX = isPlayer
      ? CONFIG.BASE_X_OFFSET + 30
      : CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30;
    const u = new Unit(spawnX, CONFIG.GROUND_Y, side, isPlayer ? this.currentAge : this.enemyAge, 0, 0, true);

    if (!isPlayer) {
      const diff = CONFIG.DIFFICULTIES[this.difficulty];
      u.hp = Math.round(u.hp * diff.enemyHpMult);
      u.maxHp = u.hp;
      u.damage = Math.round(u.damage * diff.enemyDmgMult);
    }

    this.units.push(u);
    this.audio.play('special');
  }

  evolve() {
    this.evolveSide('player');
  }

  evolveEnemy() {
    this.evolveSide('enemy');
  }

  evolveSide(side) {
    const isPlayer = side === 'player';
    const age = isPlayer ? this.currentAge : this.enemyAge;
    if (age >= CONFIG.AGES.length - 1) return;
    const cost = CONFIG.EVOLVE_XP[age + 1];
    const xp = isPlayer ? this.xp : this.enemyXp;
    if (xp < cost) return;

    if (isPlayer) {
      this.xp -= cost;
      const prevAge = this.currentAge;
      this.currentAge++;
      this.playerBase.healFraction(CONFIG.EVOLVE_HEAL);
      this.audio.play('evolve');
      this.audio.updateMusicAge(this.currentAge);
      this.flashTimer = 0.8;
      this.renderer.startAgeTransition(prevAge, this.currentAge);
    } else {
      this.enemyXp -= cost;
      this.enemyAge++;
      this.enemyBase.healFraction(CONFIG.EVOLVE_HEAL);
    }
  }

  useSpecial() {
    this.useSpecialForSide('player');
  }

  useEnemySpecial() {
    this.useSpecialForSide('enemy');
  }

  useSpecialForSide(side) {
    const isPlayer = side === 'player';
    const cooldown = isPlayer ? this.specialCooldown : this.enemySpecialCooldown;
    if (cooldown > 0 || this.specialAnim) return;

    const ageIndex = isPlayer ? this.currentAge : this.enemyAge;
    if (isPlayer) this.specialCooldown = CONFIG.SPECIAL_COOLDOWN;
    else this.enemySpecialCooldown = CONFIG.SPECIAL_COOLDOWN;
    this.audio.play('special');

    const duration = [2.0, 1.5, 2.0, 2.5, 1.5][ageIndex];
    this.specialAnim = {
      ageIndex,
      side,
      timer: 0,
      duration,
      damageDealt: false,
      particles: this.generateSpecialParticles(ageIndex),
    };
  }

  generateSpecialParticles(ageIndex) {
    const particles = [];
    const W = CONFIG.WORLD.WIDTH;
    switch (ageIndex) {
      case 0: // Meteor Shower
        for (let i = 0; i < 6; i++) {
          particles.push({
            x: 200 + Math.random() * (W - 400),
            y: -50 - Math.random() * 100,
            vy: 3 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 0.5,
            size: 6 + Math.random() * 6,
            trail: [],
          });
        }
        break;
      case 1: // Arrow Volley
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: 300 + Math.random() * (W - 600),
            y: -30 - Math.random() * 60,
            vy: 4 + Math.random() * 1.5,
            vx: -0.5 + Math.random() * -1,
            size: 8,
            angle: 0,
          });
        }
        break;
      case 2: // Artillery Strike
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: 300 + Math.random() * (W - 600),
            y: -40,
            vy: 3.5 + Math.random(),
            vx: (Math.random() - 0.5) * 0.3,
            size: 5,
            exploded: false,
            explosionRadius: 0,
          });
        }
        break;
      case 3: // Airstrike
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: -100 - i * 200,
            y: 60 + i * 30,
            vx: 5 + Math.random(),
            vy: 0,
            size: 1,
            dropped: false,
            bombs: [],
          });
        }
        break;
      case 4: // Orbital Laser
        particles.push({
          x: W / 2,
          sweepX: 0,
          width: 3,
          charging: true,
          chargeTimer: 0,
          chargeDuration: 0.6,
        });
        break;
    }
    return particles;
  }

  updateSpecialAnim(dt) {
    if (!this.specialAnim) return;
    const anim = this.specialAnim;
    anim.timer += dt;
    const progress = anim.timer / anim.duration;

    switch (anim.ageIndex) {
      case 0: // Meteor Shower
        for (const p of anim.particles) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          p.vy += 4 * dt; // gravity
        }
        if (progress > 0.7 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 1: // Arrow Volley
        for (const p of anim.particles) {
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          p.angle = Math.atan2(p.vy, p.vx);
        }
        if (progress > 0.5 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 2: // Artillery Strike
        for (const p of anim.particles) {
          if (!p.exploded) {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.vy += 2 * dt;
              if (p.y >= CONFIG.GROUND_Y) {
                p.exploded = true;
                this.particles.emitBurst(
                  p.x, CONFIG.GROUND_Y,
                  '#ff6600', 18, 6, 0.6, 5
                );
                this.renderer.screenShake(3, 0.15);
              }
          } else {
            p.explosionRadius = Math.min(p.explosionRadius + dt * 200, 50);
          }
        }
        if (progress > 0.6 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 3: // Airstrike
        for (const plane of anim.particles) {
          plane.x += plane.vx * dt * 60;
          if (!plane.dropped && plane.x > CONFIG.WORLD.WIDTH * 0.3 + Math.random() * CONFIG.WORLD.WIDTH * 0.4) {
            plane.dropped = true;
            plane.bombs.push({
              x: plane.x, y: plane.y,
              vy: 0, exploded: false, explosionRadius: 0,
            });
          }
          for (const bomb of plane.bombs) {
            if (!bomb.exploded) {
              bomb.y += bomb.vy * dt * 60;
              bomb.vy += 5 * dt;
              if (bomb.y >= CONFIG.GROUND_Y) {
                bomb.exploded = true;
                this.particles.emitBurst(
                  bomb.x, CONFIG.GROUND_Y,
                  '#ff8800', 15, 5, 0.5, 4
                );
                this.renderer.screenShake(2, 0.1);
              }
            } else {
              bomb.explosionRadius = Math.min(bomb.explosionRadius + dt * 180, 40);
            }
          }
        }
        if (progress > 0.7 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 4: // Orbital Laser
        const laser = anim.particles[0];
        if (laser.charging) {
          laser.chargeTimer += dt;
          if (laser.chargeTimer >= laser.chargeDuration) {
            laser.charging = false;
            laser.sweepX = 0;
          }
        } else {
          laser.sweepX += dt * 3000;
          laser.width = 3 + Math.sin(anim.timer * 20) * 2;
          if (laser.sweepX > CONFIG.WORLD.WIDTH && !anim.damageDealt) {
            anim.damageDealt = true;
            this.dealSpecialDamage();
          }
        }
        break;
    }

    if (progress >= 1.0) {
      if (!anim.damageDealt) {
        this.dealSpecialDamage();
      }
      this.specialAnim = null;
    }
  }

  saveGame(slot) {
    const data = {
      gold: this.gold,
      xp: this.xp,
      currentAge: this.currentAge,
      enemyGold: this.enemyGold,
      enemyXp: this.enemyXp,
      enemyAge: this.enemyAge,
      specialCooldown: this.specialCooldown,
      enemySpecialCooldown: this.enemySpecialCooldown,
      heroCooldown: this.heroCooldown,
      enemyHeroCooldown: this.enemyHeroCooldown,
      playerBaseHp: this.playerBase.hp,
      enemyBaseHp: this.enemyBase.hp,
      unitUpgrades: { ...this.unitUpgrades },
      playerSlotsBought: this.playerSlotsBought,
      enemySlotsBought: this.enemySlotsBought,
      gameSpeed: this.gameSpeed,
      difficulty: this.difficulty,
      gameTime: this.gameTime,
      totalGoldSpent: this.totalGoldSpent,
      buildings: this.buildings.filter(b => b.side === 'player' && b.alive).map(b => b.buildingIndex),
    };
    try {
      localStorage.setItem(`age_of_war_save_${slot}`, JSON.stringify(data));
      this.audio.play('evolve');
    } catch (e) { /* storage full or unavailable */ }
  }

  loadGame(slot) {
    try {
      const raw = localStorage.getItem(`age_of_war_save_${slot}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.restart();
      this.gold = data.gold;
      this.xp = data.xp;
      this.currentAge = data.currentAge;
      this.enemyGold = data.enemyGold;
      this.enemyXp = data.enemyXp;
      this.enemyAge = data.enemyAge;
      this.specialCooldown = data.specialCooldown;
      this.enemySpecialCooldown = data.enemySpecialCooldown;
      this.heroCooldown = data.heroCooldown || 0;
      this.enemyHeroCooldown = data.enemyHeroCooldown || 0;
      this.playerBase.hp = data.playerBaseHp;
      this.playerBase.maxHp = data.playerBaseHp;
      this.enemyBase.hp = data.enemyBaseHp;
      this.enemyBase.maxHp = data.enemyBaseHp;
      this.unitUpgrades = data.unitUpgrades || {};
      this.playerSlotsBought = data.playerSlotsBought;
      this.enemySlotsBought = data.enemySlotsBought;
      this.gameSpeed = data.gameSpeed;
      this.difficulty = data.difficulty;
      this.gameTime = data.gameTime;
      this.totalGoldSpent = data.totalGoldSpent || 0;
      this.playerBase.healFraction(0);
      this.enemyBase.healFraction(0);
      if (data.buildings) {
        for (const idx of data.buildings) {
          this.buyBuilding(idx);
        }
      }
      this.audio.play('evolve');
      this.audio.updateMusicAge(this.currentAge);
    } catch (e) { /* corrupted save */ }
  }

  dealSpecialDamage() {
    const anim = this.specialAnim;
    if (!anim) return;
    const age = CONFIG.AGES[anim.ageIndex];
    const targetSide = anim.side === 'player' ? 'enemy' : 'player';

    this.renderer.screenShake(8, 0.4);

    for (const u of this.units) {
      if (u.side === targetSide && u.alive) {
        u.takeDamage(age.specialDamage);
        this.particles.emit(u.x, u.y, '#ff8800', 6, 4, 0.4, 3);
      }
    }

    this.particles.emit(
      CONFIG.VIEWPORT.WIDTH / 2 + this.renderer.camera.x, 100,
      '#ff4400', 30, 8, 1.0, 4
    );
  }
}
