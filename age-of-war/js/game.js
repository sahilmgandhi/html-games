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

    this.lastTime = 0;
    this.running = false;
    this.gameOver = false;
    this.winner = null;

    this.canvas.addEventListener('click', () => {
      this.audio.init();
      if (this.gameOver) {
        this.restart();
      } else {
        this.input.handleClick(this);
      }
    });
  }

  start() {
    this.ai = new AI(this);
    this.running = true;
    this.lastTime = performance.now();
    this.audio.init();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.gameOver) return;

    this.input.update();

    this.gold += CONFIG.GOLD_PER_SECOND * dt;
    this.xp += CONFIG.XP_PER_SECOND * dt;
    this.enemyGold += CONFIG.GOLD_PER_SECOND * dt;
    this.enemyXp += CONFIG.XP_PER_SECOND * dt;

    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.enemySpecialCooldown > 0) this.enemySpecialCooldown -= dt;

    this.ai.update(dt);

    for (const u of this.units) {
      u.update(dt, this.units, this.turrets, u.side === 'player' ? this.enemyBase : this.playerBase, this.projectiles);
    }

    for (const t of this.turrets) {
      t.update(dt, this.units, this.projectiles);
    }

    for (const p of this.projectiles) {
      p.update(dt);
      p.checkHit(this.units, this.turrets, [this.playerBase, this.enemyBase]);
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
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    this.renderer.drawTerrain(this.currentAge);

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
    this.gameOver = false;
    this.winner = null;
    this.renderer.camera.x = 0;
    this.ai = new AI(this);
  }

  spawnUnit(unitIndex) {
    const age = CONFIG.AGES[this.currentAge];
    const data = age.units[unitIndex];
    if (this.gold < data.cost) return;

    this.gold -= data.cost;
    const spawnX = CONFIG.BASE_X_OFFSET + 80;
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
  }
}
