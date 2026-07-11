class Minimap {
  draw(ctx, units, turrets, bases, cameraX, buildings) {
    const mmW = CONFIG.VIEWPORT.WIDTH;
    const mmH = 20;
    const mmY = 3;
    const r = 4;

    ctx.fillStyle = 'rgba(10,10,20,0.75)';
    ctx.beginPath();
    ctx.moveTo(r, mmY);
    ctx.lineTo(mmW - r, mmY);
    ctx.arcTo(mmW, mmY, mmW, mmY + r, r);
    ctx.lineTo(mmW, mmY + mmH - r);
    ctx.arcTo(mmW, mmY + mmH, mmW - r, mmY + mmH, r);
    ctx.lineTo(r, mmY + mmH);
    ctx.arcTo(0, mmY + mmH, 0, mmY + mmH - r, r);
    ctx.lineTo(0, mmY + r);
    ctx.arcTo(0, mmY, r, mmY, r);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(r, mmY);
    ctx.lineTo(mmW - r, mmY);
    ctx.arcTo(mmW, mmY, mmW, mmY + r, r);
    ctx.lineTo(mmW, mmY + mmH - r);
    ctx.arcTo(mmW, mmY + mmH, mmW - r, mmY + mmH, r);
    ctx.lineTo(r, mmY + mmH);
    ctx.arcTo(0, mmY + mmH, 0, mmY + mmH - r, r);
    ctx.lineTo(0, mmY + r);
    ctx.arcTo(0, mmY, r, mmY, r);
    ctx.stroke();

    const viewLeft = cameraX / CONFIG.WORLD.WIDTH * mmW;
    const viewW = CONFIG.VIEWPORT.WIDTH / CONFIG.WORLD.WIDTH * mmW;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(viewLeft, mmY, viewW, mmH);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewLeft, mmY, viewW, mmH);

    for (const b of bases) {
      const bx = b.x / CONFIG.WORLD.WIDTH * mmW;
      const sideColor = b.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
      ctx.fillStyle = sideColor;
      ctx.fillRect(bx - 3, mmY + 3, 6, mmH - 6);
    }

    for (const t of turrets) {
      if (!t.alive) continue;
      const tx = t.x / CONFIG.WORLD.WIDTH * mmW;
      ctx.fillStyle = t.side === 'player' ? CONFIG.COLORS.PLAYER_LIGHT : CONFIG.COLORS.ENEMY_LIGHT;
      ctx.fillRect(tx - 1, mmY + 5, 3, mmH - 10);
    }

    if (buildings) {
      for (const b of buildings) {
        if (!b.alive) continue;
        const bx = b.x / CONFIG.WORLD.WIDTH * mmW;
        ctx.fillStyle = b.side === 'player' ? '#8af' : '#f88';
        ctx.fillRect(bx - 1, mmY + 2, 3, mmH - 4);
      }
    }

    for (const u of units) {
      if (!u.alive) continue;
      const ux = u.x / CONFIG.WORLD.WIDTH * mmW;
      ctx.fillStyle = u.side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
      ctx.fillRect(ux - 1, mmY + 6, 2, mmH - 12);
    }
  }
}
