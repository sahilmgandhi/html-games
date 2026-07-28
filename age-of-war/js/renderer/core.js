// Renderer core: camera, view state, screen shake, and shared color/shape helpers.
// This file declares the class; every other js/renderer/*.js augments its prototype, so
// index.html must load it first.

class Renderer {
  constructor(canvas, ctx) {
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };

    this.terrainCache = null;
    this.terrainCacheAge = -1;
    this.terrainCacheWidth = 0;

    this.hudCache = null;
    this.hudCacheGold = -1;
    this.hudCacheXp = -1;
    this.hudCacheAge = -1;
    this.hudCacheSlots = -1;
    this.hudCacheSpecial = -1;

    this.hudTime = 0;

    this.crossfadeDuration = 0.5;
    this.parallaxCache = null;
    this.parallaxCacheAge = -1;

    this.resetView();
  }

  resetView() {
    this.camera.x = 0;
    this.camera.y = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.crossfadeAge = -1;
    this.crossfadeTimer = 0;
    this._crossfadeCanvas = null;
    this.xpBarProgress = 0;
    this.tooltip = null;
  }

  screenShake(intensity, duration) {
    if (intensity > this.shakeIntensity) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
    }
  }

  updateShake(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const frac = this.shakeDuration > 0 ? this.shakeDuration / 0.3 : 0;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2 * frac;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2 * frac;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  scrollTo(x) {
    this.camera.x = clamp(x, 0, CONFIG.WORLD.WIDTH - CONFIG.VIEWPORT.WIDTH);
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.camera.x + this.shakeX, y: wy + this.shakeY };
  }

  blendColor(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
  }

  lightenColor(hex, factor) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
  }

  hpColor(frac) {
    const r = Math.round(255 * (1 - frac));
    const g = Math.round(255 * frac);
    return `rgb(${r},${g},30)`;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
