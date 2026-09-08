import * as THREE from 'three';

const SHADOW_MAP_SIZE = 2048;
const SHADOW_FRUSTUM = 50;

export class Renderer3D {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 8, 20);
    this.camera.lookAt(0, 2, 0);

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this._onResize());

    this._stats = { drawCalls: 0, fps: 0, triangles: 0 };
    this._frameCount = 0;
    this._fpsTime = 0;
  }

  get stats() {
    return this._stats;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  updateStats() {
    this._stats.drawCalls = this.renderer.info.render.calls;
    this._stats.triangles = this.renderer.info.render.triangles;
    this._frameCount++;
    const now = performance.now();
    if (now - this._fpsTime >= 1000) {
      this._stats.fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTime = now;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.updateStats();
  }

  dispose() {
    this.renderer.dispose();
  }
}
