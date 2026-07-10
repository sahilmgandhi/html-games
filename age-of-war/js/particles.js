class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, color, count, spread, life, speed) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1,
        life,
        maxLife: life,
        color,
        size: Math.random() * spread + 1,
      });
    }
  }

  emitDamageNumber(x, y, amount, color) {
    this.particles.push({
      x, y: y - 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1.5,
      life: 1.0,
      maxLife: 1.0,
      color: color || '#ff4444',
      text: `-${amount}`,
      size: 12,
      isText: true,
    });
  }

  emitGoldNumber(x, y, amount) {
    this.particles.push({
      x, y: y - 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1.5,
      life: 1.0,
      maxLife: 1.0,
      color: '#ffd700',
      text: `+${amount}g`,
      size: 12,
      isText: true,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, renderer) {
    for (const p of this.particles) {
      const s = renderer.worldToScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;

      if (p.isText) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, s.x, s.y);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }
  }
}
