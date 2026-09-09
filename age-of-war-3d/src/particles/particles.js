// Pooled 3D burst particles (single THREE.Points draw call) plus pooled HTML
// floating combat numbers. Rendering-only cosmetics; may use Math.random().
// Contract: ParticleSystem3D(scene) -> { damageNumber(), goldNumber(), burst(), update(dt) }
import * as THREE from 'three';

const MAX_POINTS = 1024;
const MAX_NUMBERS = 24;

export class ParticleSystem3D {
  constructor(scene) {
    this.scene = scene;
    this.camera = null;

    this._pos = new Float32Array(MAX_POINTS * 3);
    this._col = new Float32Array(MAX_POINTS * 3);
    this._vel = new Float32Array(MAX_POINTS * 3);
    this._life = new Float32Array(MAX_POINTS);
    this._maxLife = new Float32Array(MAX_POINTS);
    this._baseCol = new Float32Array(MAX_POINTS * 3);
    this._grav = new Float32Array(MAX_POINTS);
    for (let i = 0; i < MAX_POINTS; i++) this._pos[i * 3 + 1] = -1000;
    this._cursor = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this._col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this._layer = document.createElement('div');
    this._layer.className = 'p3d-numbers';
    document.body.appendChild(this._layer);
    this._numbers = [];
    for (let i = 0; i < MAX_NUMBERS; i++) {
      const el = document.createElement('div');
      el.className = 'p3d-number';
      el.style.display = 'none';
      this._layer.appendChild(el);
      this._numbers.push({ el, x: 0, y: 0, z: 0, ttl: 0, max: 1 });
    }
    this._numCursor = 0;
    this._v = new THREE.Vector3();

    // Shockwave ring pool: flat additive rings that expand and fade on
    // heavy impacts (boulder/shell/special). Zero per-frame allocation.
    this._rings = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.0, 40),
        new THREE.MeshBasicMaterial({
          color: 0xffcc88, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      scene.add(m);
      this._rings.push({ mesh: m, ttl: 0, max: 1, maxR: 3 });
    }
    this._ringCursor = 0;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  burst(x, y, z, opts = {}) {
    const count = opts.count ?? 24;
    const color = new THREE.Color(opts.color ?? 0xffcc66);
    const speed = opts.speed ?? 4;
    const life = opts.life ?? 0.7;
    const gravity = opts.gravity ?? -9;
    const up = opts.up ?? 2;
    for (let n = 0; n < count; n++) {
      const i = this._cursor;
      this._cursor = (this._cursor + 1) % MAX_POINTS;
      this._pos[i * 3] = x;
      this._pos[i * 3 + 1] = y;
      this._pos[i * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this._vel[i * 3] = Math.cos(a) * s;
      this._vel[i * 3 + 1] = up * (0.4 + Math.random() * 0.8);
      this._vel[i * 3 + 2] = Math.sin(a) * s;
      const shade = 0.7 + Math.random() * 0.3;
      this._baseCol[i * 3] = color.r * shade;
      this._baseCol[i * 3 + 1] = color.g * shade;
      this._baseCol[i * 3 + 2] = color.b * shade;
      this._maxLife[i] = life * (0.6 + Math.random() * 0.4);
      this._life[i] = this._maxLife[i];
      this._grav[i] = gravity;
    }
    // Smoke body: slow grey-brown puffs that rise and linger twice as long
    // as the sparks, so every burst reads as spark + smoke, not confetti.
    if (opts.smoke !== false) {
      const smoke = new THREE.Color(opts.smokeColor ?? 0x5a5048);
      const nSmoke = Math.max(4, Math.round(count * 0.45));
      for (let n = 0; n < nSmoke; n++) {
        const i = this._cursor;
        this._cursor = (this._cursor + 1) % MAX_POINTS;
        this._pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
        this._pos[i * 3 + 1] = y + Math.random() * 0.3;
        this._pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
        const a = Math.random() * Math.PI * 2;
        const s = speed * 0.12 * (0.4 + Math.random() * 0.6);
        this._vel[i * 3] = Math.cos(a) * s;
        this._vel[i * 3 + 1] = (up * 0.5 + 1.2) * (0.5 + Math.random() * 0.5);
        this._vel[i * 3 + 2] = Math.sin(a) * s;
        const shade = 0.55 + Math.random() * 0.3;
        this._baseCol[i * 3] = smoke.r * shade;
        this._baseCol[i * 3 + 1] = smoke.g * shade;
        this._baseCol[i * 3 + 2] = smoke.b * shade;
        this._maxLife[i] = life * 2.1 * (0.7 + Math.random() * 0.4);
        this._life[i] = this._maxLife[i];
        this._grav[i] = 1.6; // buoyant: smoke rises instead of falling
      }
    }
    // Heavy hits (12+ sparks) also kick a ground shockwave ring.
    if (count >= 12) this.shockwave(x, Math.max(0.1, y * 0.3), z, opts);
  }

  shockwave(x, y, z, opts = {}) {
    const r = this._rings[this._ringCursor];
    this._ringCursor = (this._ringCursor + 1) % this._rings.length;
    r.mesh.position.set(x, Math.max(0.08, y), z);
    r.mesh.material.color.set(opts.color ?? 0xffcc88);
    r.max = 0.45;
    r.ttl = 0.45;
    r.maxR = opts.shockR ?? 3.2;
    r.mesh.visible = true;
  }

  damageNumber(x, y, z, text, color = '#ffd34d') {
    this._spawnNumber(x, y, z, text, color);
  }

  goldNumber(x, y, z, text) {
    this._spawnNumber(x, y, z, text, '#ffe98a');
  }

  _spawnNumber(x, y, z, text, color) {
    const n = this._numbers[this._numCursor];
    this._numCursor = (this._numCursor + 1) % MAX_NUMBERS;
    n.x = x;
    n.y = y;
    n.z = z;
    n.ttl = 1.0;
    n.max = 1.0;
    n.el.textContent = text;
    n.el.style.color = color;
    n.el.style.display = 'block';
  }

  update(dt) {
    // Integrate live points; fade color to black (additive => fades out).
    for (let i = 0; i < MAX_POINTS; i++) {
      if (this._life[i] <= 0) continue;
      this._life[i] -= dt;
      if (this._life[i] <= 0) {
        this._pos[i * 3 + 1] = -1000;
        this._col[i * 3] = this._col[i * 3 + 1] = this._col[i * 3 + 2] = 0;
        continue;
      }
      this._vel[i * 3 + 1] += this._grav[i] * dt;
      this._pos[i * 3] += this._vel[i * 3] * dt;
      this._pos[i * 3 + 1] += this._vel[i * 3 + 1] * dt;
      this._pos[i * 3 + 2] += this._vel[i * 3 + 2] * dt;
      if (this._pos[i * 3 + 1] < 0.02) {
        this._pos[i * 3 + 1] = 0.02;
        this._vel[i * 3 + 1] *= -0.3;
      }
      const f = this._life[i] / this._maxLife[i];
      this._col[i * 3] = this._baseCol[i * 3] * f;
      this._col[i * 3 + 1] = this._baseCol[i * 3 + 1] * f;
      this._col[i * 3 + 2] = this._baseCol[i * 3 + 2] * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    // Shockwave rings: expand to maxR and fade over their short life.
    for (const r of this._rings) {
      if (r.ttl <= 0) continue;
      r.ttl -= dt;
      if (r.ttl <= 0) {
        r.mesh.visible = false;
        r.mesh.material.opacity = 0;
        continue;
      }
      const k = 1 - r.ttl / r.max;
      const rad = Math.max(0.05, r.maxR * (1 - (1 - k) * (1 - k)));
      r.mesh.scale.set(rad, rad, 1);
      r.mesh.material.opacity = 0.75 * (r.ttl / r.max);
    }

    // Float numbers upward in world space, project to screen.
    if (this.camera) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const n of this._numbers) {
        if (n.ttl <= 0) {
          n.el.style.display = 'none';
          continue;
        }
        n.ttl -= dt;
        n.y += dt * 1.2;
        this._v.set(n.x, n.y, n.z).project(this.camera);
        n.el.style.transform = `translate(${((this._v.x * 0.5 + 0.5) * w) | 0}px, ${((-this._v.y * 0.5 + 0.5) * h) | 0}px)`;
        n.el.style.opacity = String(Math.max(0, Math.min(1, n.ttl / n.max)));
      }
    }
  }

  dispose() {
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    this.points.material.dispose();
    for (const r of this._rings) {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
    }
    this._layer.remove();
  }
}
