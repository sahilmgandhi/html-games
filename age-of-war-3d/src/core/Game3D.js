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

    for (const fn of this._updateFns) fn(dt);
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
