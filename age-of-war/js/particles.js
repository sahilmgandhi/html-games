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
        gravity: 0,
        rotation: 0,
        rotationSpeed: 0,
        shrink: false,
      });
    }
  }

  emitBurst(x, y, color, count, spread, life, speed) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed + speed * 0.3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        life,
        maxLife: life,
        color,
        size: Math.random() * spread + 1,
        gravity: 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 6,
        shrink: true,
      });
    }
  }

  emitTrail(x, y, color, size) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.3 - Math.random() * 0.3,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.6,
      color,
      size: size || 2,
      gravity: -0.5,
      rotation: 0,
      rotationSpeed: 0,
      shrink: true,
    });
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
    let write = 0;
    for (let read = 0; read < this.particles.length; read++) {
      const p = this.particles[read];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.gravity) p.vy += p.gravity * dt;
      if (p.rotationSpeed) p.rotation += p.rotationSpeed * dt;
      p.life -= dt;
      if (p.life > 0) {
        this.particles[write++] = p;
      }
    }
    this.particles.length = write;
  }

  draw(ctx, renderer) {
    for (const p of this.particles) {
      const s = renderer.worldToScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;
      const size = p.shrink ? p.size * (p.life / p.maxLife) : p.size;

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
        if (p.rotation) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      }
    }
  }
}
