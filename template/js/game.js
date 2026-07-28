// Chase the targets before the clock runs out. Replace this with the real game — the
// point of the skeleton is the shape: state on `this`, update(dt) pure of drawing,
// render() pure of state changes, so the headless harness can drive frames.
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.restart();
  }

  restart() {
    this.player = { x: CONFIG.VIEWPORT.WIDTH / 2, y: CONFIG.VIEWPORT.HEIGHT / 2 };
    this.aim = { x: this.player.x, y: this.player.y };
    this.targets = [];
    this.score = 0;
    this.timeLeft = CONFIG.TIME_LIMIT;
    this.gameOver = false;
    this.won = false;
    this.spawnTarget();
  }

  spawnTarget() {
    const pad = CONFIG.TARGET_RADIUS * 2;
    this.targets.push({
      x: pad + Math.random() * (CONFIG.VIEWPORT.WIDTH - pad * 2),
      y: pad + Math.random() * (CONFIG.VIEWPORT.HEIGHT - pad * 2),
    });
  }

  aimAt(x, y) {
    this.aim.x = x;
    this.aim.y = y;
  }

  update(dt) {
    if (this.gameOver) return;

    this.timeLeft -= dt;

    const toAim = dist(this.player.x, this.player.y, this.aim.x, this.aim.y);
    if (toAim > 1) {
      const step = Math.min(CONFIG.PLAYER_SPEED * dt, toAim);
      this.player.x += ((this.aim.x - this.player.x) / toAim) * step;
      this.player.y += ((this.aim.y - this.player.y) / toAim) * step;
    }

    const reach = CONFIG.PLAYER_RADIUS + CONFIG.TARGET_RADIUS;
    this.targets = this.targets.filter((target) => {
      if (dist(this.player.x, this.player.y, target.x, target.y) > reach) return true;
      this.score++;
      return false;
    });
    while (this.targets.length === 0) this.spawnTarget();

    if (this.score >= CONFIG.TARGETS_TO_WIN) {
      this.gameOver = true;
      this.won = true;
    } else if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver = true;
      this.won = false;
    }
  }

  render() {
    const { ctx } = this;
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);

    for (const target of this.targets) {
      this.circle(target.x, target.y, CONFIG.TARGET_RADIUS, CONFIG.COLORS.TARGET);
    }
    this.circle(this.player.x, this.player.y, CONFIG.PLAYER_RADIUS, CONFIG.COLORS.PLAYER);

    ctx.fillStyle = CONFIG.COLORS.TEXT;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score ${this.score} / ${CONFIG.TARGETS_TO_WIN}`, 16, 28);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(this.timeLeft)}s`, CONFIG.VIEWPORT.WIDTH - 16, 28);

    if (this.gameOver) this.drawBanner(this.won ? 'You win!' : 'Out of time', 'Click to play again');
  }

  drawBanner(title, subtitle) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CONFIG.VIEWPORT.WIDTH, CONFIG.VIEWPORT.HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.TEXT;
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(title, CONFIG.VIEWPORT.WIDTH / 2, CONFIG.VIEWPORT.HEIGHT / 2);
    ctx.fillStyle = CONFIG.COLORS.DIM;
    ctx.font = '18px sans-serif';
    ctx.fillText(subtitle, CONFIG.VIEWPORT.WIDTH / 2, CONFIG.VIEWPORT.HEIGHT / 2 + 40);
  }

  circle(x, y, r, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
