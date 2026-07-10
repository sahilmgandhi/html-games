class Minimap {
  constructor() {
    this.enabled = true;
  }

  draw(ctx, units, turrets, bases, cameraX) {
    const mmW = CONFIG.VIEWPORT.WIDTH;
    const mmH = 18;
    const mmY = 2;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, mmY, mmW, mmH);

    const viewLeft = cameraX / CONFIG.WORLD.WIDTH * mmW;
    const viewW = CONFIG.VIEWPORT.WIDTH / CONFIG.WORLD.WIDTH * mmW;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewLeft, mmY, viewW, mmH);

    for (const b of bases) {
      if (!b) continue;
      const bx = b.x / CONFIG.WORLD.WIDTH * mmW;
      ctx.fillStyle = b.side === 'player' ? '#4a8af4' : '#f44a4a';
      ctx.fillRect(bx - 3, mmY + 3, 6, mmH - 6);
    }

    for (const t of turrets) {
      if (!t.alive) continue;
      const tx = t.x / CONFIG.WORLD.WIDTH * mmW;
      ctx.fillStyle = t.side === 'player' ? '#8af' : '#f88';
      ctx.fillRect(tx - 1, mmY + 5, 3, mmH - 10);
    }

    for (const u of units) {
      if (!u.alive) continue;
      const ux = u.x / CONFIG.WORLD.WIDTH * mmW;
      ctx.fillStyle = u.side === 'player' ? '#4a8af4' : '#f44a4a';
      ctx.fillRect(ux - 1, mmY + 6, 2, mmH - 12);
    }
  }
}
