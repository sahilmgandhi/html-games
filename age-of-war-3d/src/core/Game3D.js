import { Renderer3D } from './Renderer3D.js';
import { EventBus } from './EventBus.js';

export class Game3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.events = new EventBus();
    this.renderer = new Renderer3D(canvas);
    this.running = false;
    this._updateFns = [];
    this._renderFns = [];
  }

  onUpdate(fn) { this._updateFns.push(fn); }
  onRender(fn) { this._renderFns.push(fn); }

  setCameraPreset(name) {
    const presets = {
      side: [[12, 6, 22], [12, 2, 0]],
      wide: [[12, 10, 30], [12, 1, 0]],
      close: [[6, 3, 10], [6, 1.5, 0]],
    };
    const p = presets[name];
    if (!p) return false;
    this.renderer.camera.position.set(...p[0]);
    this.renderer.camera.lookAt(...p[1]);
    return true;
  }

  start() {
    this.running = true;
    this._loop();
    window.__ready = true;
    window.__game3d = this;
  }

  _loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this._loop());

    const dt = Math.min(this.renderer.clock.getDelta(), 0.05);

    for (let i = this._updateFns.length - 1; i >= 0; i--) {
      try {
        this._updateFns[i](dt);
      } catch (err) {
        this._updateFns.splice(i, 1);
        window.__errors?.push(`update: ${err.message}`);
      }
    }
    this.renderer.render();
    for (const fn of this._renderFns) fn(dt);

    this.events.emit('frame', dt);
  }

  stop() {
    this.running = false;
  }

  get scene() { return this.renderer.scene; }
  get camera() { return this.renderer.camera; }
  get stats() { return this.renderer.stats; }
}
