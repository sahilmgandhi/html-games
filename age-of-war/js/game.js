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

    this.playerBase = new Base(CONFIG.BASE_X_OFFSET, CONFIG.VIEWPORT.HEIGHT - 100, 'player');
    this.enemyBase = new Base(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, CONFIG.VIEWPORT.HEIGHT - 100, 'enemy');

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
    this.settingsOpen = false;
    this.started = false;
    this.flashTimer = 0;

    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.gameOver) {
        this.restart();
      } else if (!this.started) {
        return;
      } else if (this.settingsOpen) {
        this.handleSettingsClick();
      } else if (this.paused) {
        const cx = CONFIG.VIEWPORT.WIDTH / 2;
        const settingsX = cx - 50;
        const settingsY = CONFIG.VIEWPORT.HEIGHT / 2 + 40;
        if (pointInRect(this.input.mouseX, this.input.mouseY, settingsX, settingsY, 100, 36)) {
          this.settingsOpen = true;
        } else {
          this.togglePause();
        }
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
        if (this.settingsOpen) {
          this.settingsOpen = false;
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
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.gameOver) return;

    this.input.update();



    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.enemySpecialCooldown > 0) this.enemySpecialCooldown -= dt;

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
          const color = hit.entity instanceof Unit ? (hit.entity.side === 'player' ? '#4a8af4' : '#f44a4a') : '#ff8800';
          this.particles.emitDamageNumber(hit.entity.x, hit.entity.y, hit.damage, color);
        }
      }
    }

    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (!u.alive) {
        this.particles.emit(u.x, u.y, u.side === 'player' ? '#4a8af4' : '#f44a4a', 8, 3, 0.5, 2);
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
      if (!this.turrets[i].alive) {
        this.particles.emit(this.turrets[i].x, this.turrets[i].y, '#888', 12, 4, 0.6, 3);
        this.audio.play('explosion');
        this.turrets.splice(i, 1);
      }
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

    this.renderer.drawHUD(this);
    this.minimap.draw(ctx, this.units, this.turrets, [this.playerBase, this.enemyBase], this.renderer.camera.x);

    if (this.gameOver) {
      this.drawGameOver();
    }

    if (this.settingsOpen) {
      this.renderer.drawSettingsScreen(this);
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

    ctx.fillStyle = this.winner === 'player' ? '#4a8af4' : '#f44a4a';
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
    this.playerBase = new Base(CONFIG.BASE_X_OFFSET, CONFIG.VIEWPORT.HEIGHT - 100, 'player');
    this.enemyBase = new Base(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, CONFIG.VIEWPORT.HEIGHT - 100, 'enemy');
    this.units = [];
    this.turrets = [];
    this.projectiles = [];
    this.particles = new ParticleSystem();
    this.playerSlotsBought = 0;
    this.enemySlotsBought = 0;
    this.paused = false;
    this.settingsOpen = false;
    this.gameOver = false;
    this.winner = null;
    this.renderer.camera.x = 0;
    this.ai = new AI(this);
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.audio.stopMusic();
    } else if (this.audio.musicEnabled) {
      this.audio.startMusic(this.currentAge);
    }
  }

  handleSettingsClick() {
    const cx = CONFIG.VIEWPORT.WIDTH / 2;
    const cy = CONFIG.VIEWPORT.HEIGHT / 2;
    const panelW = 300;
    const panelH = 260;
    const panelY = cy - panelH / 2;

    const musicBtnY = panelY + 90;
    if (pointInRect(this.input.mouseX, this.input.mouseY, cx - 100, musicBtnY, 200, 36)) {
      this.audio.toggleMusic();
      return;
    }

    const sfxBtnY = panelY + 140;
    if (pointInRect(this.input.mouseX, this.input.mouseY, cx - 100, sfxBtnY, 200, 36)) {
      this.audio.toggleSfx();
      return;
    }

    const muteBtnY = panelY + 190;
    if (pointInRect(this.input.mouseX, this.input.mouseY, cx - 100, muteBtnY, 200, 36)) {
      this.audio.toggleMute();
      return;
    }

    const resumeBtnY = panelY + 235;
    if (pointInRect(this.input.mouseX, this.input.mouseY, cx - 100, resumeBtnY, 200, 36)) {
      this.settingsOpen = false;
      this.togglePause();
      return;
    }
  }

  computeSlotPositions(baseX, dir) {
    const positions = [];
    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      positions.push({ x: baseX + dir * (120 + i * 50), y: CONFIG.VIEWPORT.HEIGHT - 100 });
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
    const groundY = CONFIG.VIEWPORT.HEIGHT - 100;
    const u = new Unit(spawnX, groundY, 'player', this.currentAge, unitIndex);
    this.units.push(u);
    this.audio.play('spawn');
  }

  spawnEnemyUnit(unitIndex) {
    const age = CONFIG.AGES[this.enemyAge];
    const data = age.units[unitIndex];
    if (this.enemyGold < data.cost) return;

    this.enemyGold -= data.cost;
    const spawnX = CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 80;
    const groundY = CONFIG.VIEWPORT.HEIGHT - 100;
    const u = new Unit(spawnX, groundY, 'enemy', this.enemyAge, unitIndex);
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

    let refund = 0;
    for (const t of this.turrets) {
      if (t.side === 'player') refund += Math.floor(t.cost * 0.5);
    }
    this.gold += refund;
    if (refund > 0) this.particles.emitGoldNumber(this.playerBase.x, this.playerBase.y, refund);
    this.turrets = this.turrets.filter(t => t.side !== 'player');
  }

  evolveEnemy() {
    if (this.enemyAge >= CONFIG.AGES.length - 1) return;
    const cost = CONFIG.EVOLVE_XP[this.enemyAge + 1];
    if (this.enemyXp < cost) return;

    this.enemyXp -= cost;
    this.enemyAge++;
    this.enemyBase.healFraction(CONFIG.EVOLVE_HEAL);
    this.turrets = this.turrets.filter(t => t.side !== 'enemy');
  }

  useSpecial() {
    if (this.specialCooldown > 0) return;
    const age = CONFIG.AGES[this.currentAge];

    this.specialCooldown = CONFIG.SPECIAL_COOLDOWN;
    this.audio.play('special');

    for (const u of this.units) {
      if (u.side === 'enemy' && u.alive) {
        u.takeDamage(age.specialDamage);
        this.particles.emit(u.x, u.y, '#ff8800', 6, 4, 0.4, 3);
      }
    }

    this.enemyBase.takeDamage(age.specialDamage);
    this.particles.emit(this.enemyBase.x, this.enemyBase.y, '#ff4400', 20, 6, 0.8, 3);

    this.particles.emit(CONFIG.VIEWPORT.WIDTH / 2 + this.renderer.camera.x, 100, '#ff4400', 30, 8, 1.0, 4);
  }

  useEnemySpecial() {
    if (this.enemySpecialCooldown > 0) return;
    const age = CONFIG.AGES[this.enemyAge];

    this.enemySpecialCooldown = CONFIG.SPECIAL_COOLDOWN;
    this.audio.play('special');

    for (const u of this.units) {
      if (u.side === 'player' && u.alive) {
        u.takeDamage(age.specialDamage);
        this.particles.emit(u.x, u.y, '#ff8800', 6, 4, 0.4, 3);
      }
    }

    this.playerBase.takeDamage(age.specialDamage);
    this.particles.emit(this.playerBase.x, this.playerBase.y, '#ff4400', 20, 6, 0.8, 3);

    this.particles.emit(CONFIG.VIEWPORT.WIDTH / 2 + this.renderer.camera.x, 100, '#ff4400', 30, 8, 1.0, 4);
  }
}
