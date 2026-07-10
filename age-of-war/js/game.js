class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.renderer = new Renderer(canvas, ctx);
    this.input = new InputHandler(canvas, this.renderer);
    this.particles = new ParticleSystem();
    this.minimap = new Minimap();
    this.audio = new AudioManager();
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
    this.projectiles = [];

    this.playerSlotsBought = 0;
    this.enemySlotsBought = 0;
    this.turretSlotPositions = this.computeSlotPositions(CONFIG.BASE_X_OFFSET, 1);
    this.enemyTurretSlotPositions = this.computeSlotPositions(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, -1);

    this.lastTime = 0;
    this.running = false;
    this.gameOver = false;
    this.winner = null;
    this.paused = false;
    this.debugOpen = false;
    this.invincible = false;
    this.gameSpeed = 1;
    this.started = false;
    this.flashTimer = 0;
    this.gameTime = 0;
    this.musicWereOn = false;
    this.sfxWereOn = false;

    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.gameOver) {
        this.restart();
      } else if (!this.started) {
        return;
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
    this.updateSpecialAnim(dt);

    this.ai.update(dt);

    for (const u of this.units) {
      const prevProjCount = this.projectiles.length;
      const attackResult = u.update(dt, this.units, this.turrets, u.side === 'player' ? this.enemyBase : this.playerBase, this.projectiles);
      if (this.projectiles.length > prevProjCount) {
        this.audio.play('fire');
      } else if (attackResult === 'melee') {
        this.audio.play('hit');
      }
    }

    for (const t of this.turrets) {
      const prevProjCount = this.projectiles.length;
      t.update(dt, this.units, this.projectiles);
      if (this.projectiles.length > prevProjCount) {
        this.audio.play('fire');
      }
    }

    for (const p of this.projectiles) {
      p.update(dt);
      const hits = p.checkHit(this.units, this.turrets, [this.playerBase, this.enemyBase]);
      if (hits.length > 0) {
        this.audio.play('hit');
        for (const hit of hits) {
          const color = hit.entity instanceof Unit ? (hit.entity.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY) : hit.entity instanceof Turret ? (hit.entity.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY) : '#ff8800';
          this.particles.emitDamageNumber(hit.entity.x, hit.entity.y, hit.damage, color);
        }
      }
    }

    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (!u.alive) {
        this.particles.emit(u.x, u.y, u.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY, 8, 3, 0.5, 2);
        this.particles.emitGoldNumber(u.x, u.y, u.goldReward);

        if (u.side === 'player') {
          this.enemyGold += u.goldReward;
          this.enemyXp += u.xpReward;
        } else {
          this.gold += u.goldReward;
          this.xp += u.xpReward;
        }

        this.audio.play('death');
        this.audio.play('gold');
        this.units.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (!this.projectiles[i].alive) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.turrets.length - 1; i >= 0; i--) {
      const t = this.turrets[i];
      if (!t.alive) {
        this.particles.emit(t.x, t.y, t.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY, 8, 3, 0.5, 2);
        this.audio.play('death');
        this.turrets.splice(i, 1);
      }
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

    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);

    balanceTracker.update(this);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    this.renderer.drawTerrain(this.currentAge);

    this.renderer.drawTurretSlots(this);

    this.renderer.drawBase(this.playerBase, this.currentAge);
    this.renderer.drawBase(this.enemyBase, this.enemyAge);

    for (const t of this.turrets) {
      this.renderer.drawTurret(t, t.side === 'player' ? this.currentAge : this.enemyAge);
    }

    for (const u of this.units) {
      this.renderer.drawUnit(u, u.side === 'player' ? this.currentAge : this.enemyAge);
    }

    for (const p of this.projectiles) {
      this.renderer.drawProjectile(p);
    }

    this.particles.draw(ctx, this.renderer);

    if (this.specialAnim) {
      this.renderer.drawSpecialAnim(this.specialAnim, this.currentAge, this.enemyAge);
    }

    this.renderer.drawHUD(this);
    this.minimap.draw(ctx, this.units, this.turrets, [this.playerBase, this.enemyBase], this.renderer.camera.x);

    if (this.gameOver) {
      this.drawGameOver();
    }

    if (this.debugOpen) {
      this.renderer.drawDebugScreen(this);
    } else if (this.paused) {
      this.renderer.drawPauseScreen(this);
    }

    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashTimer * 0.4})`;
      ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
    }
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    ctx.fillStyle = this.winner === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.winner === 'player' ? 'VICTORY!' : 'DEFEAT!',
      CONFIG.VIEWPORT.WIDTH / 2,
      CONFIG.VIEWPORT.HEIGHT / 2 - 30
    );

    ctx.fillStyle = '#aaa';
    ctx.font = '20px sans-serif';
    ctx.fillText('Click to Restart', CONFIG.VIEWPORT.WIDTH / 2, CONFIG.VIEWPORT.HEIGHT / 2 + 30);
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
    this.gameTime = 0;
    balanceTracker.reset();
    this.units = [];
    this.turrets = [];
    this.projectiles = [];
    this.particles = new ParticleSystem();
    this.playerSlotsBought = 0;
    this.enemySlotsBought = 0;
    this.paused = false;
    this.debugOpen = false;
    this.invincible = false;
    this.gameSpeed = 1;
    this.gameOver = false;
    this.winner = null;
    this.renderer.camera.x = 0;
    this.ai = new AI(this);
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
      this.debugOpen = true;
      return;
    }

    const restartBtnY = panelY + 220;
    if (pointInRect(mx, my, cx - 110, restartBtnY, 220, 30)) {
      this.togglePause();
      this.restart();
      return;
    }

    const resumeBtnY = panelY + 280;
    if (pointInRect(mx, my, cx - 110, resumeBtnY, 220, 30)) {
      this.togglePause();
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
      const rowX = i < 2 ? col1X : col2X;
      const rowY = y + (i % 2) * 26;
      if (pointInRect(mx, my, rowX, rowY, bw, bh)) {
        this.spawnUnit(i);
        return;
      }
      if (pointInRect(mx, my, rowX + bw + 2, rowY, 28, bh)) {
        this.spawnEnemyUnit(i);
        return;
      }
    }

    y += age.units.length <= 2 ? 32 : 58;
    if (pointInRect(mx, my, col1X, y, bw, bh)) {
      this.gold = 100000;
      this.xp = 500000;
      for (let i = 0; i < 10; i++) this.spawnEnemyUnit(0);
      return;
    }
    if (pointInRect(mx, my, col2X, y, bw, bh)) {
      this.gold = 100000;
      this.xp = 500000;
      this.spawnEnemyUnit(3);
      this.spawnEnemyUnit(4);
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
      positions.push({ x: baseX + dir * 40, y: CONFIG.GROUND_Y - i * 50 });
    }
    return positions;
  }

  buySlot() {
    if (this.playerSlotsBought >= CONFIG.TURRET_SLOTS) return;
    if (this.gold < CONFIG.TURRET_SLOT_COST) return;
    this.gold -= CONFIG.TURRET_SLOT_COST;
    this.playerSlotsBought++;
    this.audio.play('spawn');
  }

  spawnTurret(turretIndex) {
    if (this.playerSlotsBought === 0) return;
    const occupiedCount = this.turrets.filter(t => t.side === 'player').length;
    if (occupiedCount >= this.playerSlotsBought) return;

    const age = CONFIG.AGES[this.currentAge];
    const data = age.turrets[turretIndex];
    if (this.gold < data.cost) return;

    this.gold -= data.cost;
    const slotIdx = occupiedCount;
    const pos = this.turretSlotPositions[slotIdx];
    const t = new Turret(pos.x, pos.y, 'player', this.currentAge, turretIndex);
    this.turrets.push(t);
    this.audio.play('spawn');
  }

  sellTurret(turretIndex) {
    const playerTurrets = this.turrets.filter(t => t.side === 'player');
    if (turretIndex >= playerTurrets.length) return;

    const t = playerTurrets[turretIndex];
    const refund = Math.floor(t.cost * 0.5);
    this.gold += refund;
    t.alive = false;
    this.particles.emitGoldNumber(t.x, t.y, refund);
    this.audio.play('gold');
  }

  buyEnemySlot() {
    if (this.enemySlotsBought >= CONFIG.TURRET_SLOTS) return;
    this.enemySlotsBought++;
  }

  spawnEnemyTurret(turretIndex) {
    if (this.enemySlotsBought === 0) return;
    const occupiedCount = this.turrets.filter(t => t.side === 'enemy').length;
    if (occupiedCount >= this.enemySlotsBought) return;

    const age = CONFIG.AGES[this.enemyAge];
    const data = age.turrets[turretIndex];
    if (this.enemyGold < data.cost) return;

    this.enemyGold -= data.cost;
    const slotIdx = occupiedCount;
    const pos = this.enemyTurretSlotPositions[slotIdx];
    const t = new Turret(pos.x, pos.y, 'enemy', this.enemyAge, turretIndex);
    this.turrets.push(t);
  }

  spawnUnit(unitIndex) {
    const age = CONFIG.AGES[this.currentAge];
    const data = age.units[unitIndex];
    if (this.gold < data.cost) return;

    this.gold -= data.cost;
    const spawnX = CONFIG.BASE_X_OFFSET + 30;
    const u = new Unit(spawnX, CONFIG.GROUND_Y, 'player', this.currentAge, unitIndex);
    this.units.push(u);
    this.audio.play('spawn');
  }

  spawnEnemyUnit(unitIndex) {
    const age = CONFIG.AGES[this.enemyAge];
    const data = age.units[unitIndex];
    if (this.enemyGold < data.cost) return;

    this.enemyGold -= data.cost;
    const spawnX = CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30;
    const u = new Unit(spawnX, CONFIG.GROUND_Y, 'enemy', this.enemyAge, unitIndex);
    this.units.push(u);
  }

  evolve() {
    if (this.currentAge >= CONFIG.AGES.length - 1) return;
    const cost = CONFIG.EVOLVE_XP[this.currentAge + 1];
    if (this.xp < cost) return;

    this.xp -= cost;
    this.currentAge++;
    this.playerBase.healFraction(CONFIG.EVOLVE_HEAL);
    this.audio.play('evolve');
    this.audio.updateMusicAge(this.currentAge);
    this.flashTimer = 0.8;
  }

  evolveEnemy() {
    if (this.enemyAge >= CONFIG.AGES.length - 1) return;
    const cost = CONFIG.EVOLVE_XP[this.enemyAge + 1];
    if (this.enemyXp < cost) return;

    this.enemyXp -= cost;
    this.enemyAge++;
    this.enemyBase.healFraction(CONFIG.EVOLVE_HEAL);
  }

  useSpecial() {
    if (this.specialCooldown > 0 || this.specialAnim) return;

    this.specialCooldown = CONFIG.SPECIAL_COOLDOWN;
    this.audio.play('special');

    const duration = [2.0, 1.5, 2.0, 2.5, 1.5][this.currentAge];
    this.specialAnim = {
      ageIndex: this.currentAge,
      side: 'player',
      timer: 0,
      duration,
      damageDealt: false,
      particles: this.generateSpecialParticles(this.currentAge),
    };
  }

  useEnemySpecial() {
    if (this.enemySpecialCooldown > 0 || this.specialAnim) return;

    this.enemySpecialCooldown = CONFIG.SPECIAL_COOLDOWN;
    this.audio.play('special');

    const duration = [2.0, 1.5, 2.0, 2.5, 1.5][this.enemyAge];
    this.specialAnim = {
      ageIndex: this.enemyAge,
      side: 'enemy',
      timer: 0,
      duration,
      damageDealt: false,
      particles: this.generateSpecialParticles(this.enemyAge),
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
              this.particles.emit(
                p.x + this.renderer.camera.x, CONFIG.GROUND_Y,
                '#ff6600', 15, 8, 0.6, 4
              );
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
                this.particles.emit(
                  bomb.x + this.renderer.camera.x, CONFIG.GROUND_Y,
                  '#ff8800', 12, 6, 0.5, 3
                );
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
          laser.sweepX += dt * 800;
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

  dealSpecialDamage() {
    const anim = this.specialAnim;
    if (!anim) return;
    const age = CONFIG.AGES[anim.ageIndex];
    const targetSide = anim.side === 'player' ? 'enemy' : 'player';

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
