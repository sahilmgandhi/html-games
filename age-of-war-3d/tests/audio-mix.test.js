import { AudioManager, spatialMix } from '../src/audio/audio.js';
import { BattleSim } from '../src/simulation/battle.js';
import { toMeters } from '../src/simulation/config.js';

// 3D-first battle mix: positional SFX get camera-relative gain + stereo pan;
// UI/music calls without a position play straight through untouched.
function fakeCtx() {
  const nodes = [];
  const mk = (kind) => ({
    kind,
    connected: [],
    connect(dst) { this.connected.push(dst); },
    start() {},
    stop() {},
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    pan: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
    Q: { setValueAtTime() {} },
  });
  return {
    nodes,
    destination: { kind: 'destination' },
    currentTime: 100,
    sampleRate: 44100,
    createOscillator() { const n = mk('osc'); nodes.push(n); return n; },
    createGain() { const n = mk('gain'); nodes.push(n); return n; },
    createBiquadFilter() { const n = mk('filter'); nodes.push(n); return n; },
    createStereoPanner() { const n = mk('pan'); nodes.push(n); return n; },
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; },
    createBufferSource() { const n = mk('src'); nodes.push(n); return n; },
  };
}

export default [
  {
    name: 'spatialMix centers at the listener and floors far sounds',
    run(t) {
      const c = spatialMix(12, 0, 12, 0);
      t.assert('full gain at center', c.gain === 1, JSON.stringify(c));
      t.assert('center pan', c.pan === 0, JSON.stringify(c));
      const far = spatialMix(12, 0, 100, 0);
      t.assert('never fully silent', far.gain === 0.15, JSON.stringify(far));
      const left = spatialMix(12, 0, 0, 0);
      const right = spatialMix(12, 0, 24, 0);
      t.assert('pan spreads by side', left.pan < 0 && right.pan > 0, `${left.pan},${right.pan}`);
      t.assert('pan clamps', Math.abs(left.pan) <= 1 && Math.abs(right.pan) <= 1, '');
    },
  },
  {
    name: 'positional SFX routes through pan + gain, UI stays direct',
    run(t) {
      const mgr = new AudioManager();
      mgr.ctx = fakeCtx();
      mgr.initialized = true;
      mgr.setListener(12, 0);
      mgr.play('hit', { x: 0, z: 0 });
      const pans = mgr.ctx.nodes.filter((n) => n.kind === 'pan');
      t.assert('panner created', pans.length === 1, `pans=${pans.length}`);
      t.assert('panned left', pans[0].pan.value < 0, `pan=${pans[0].pan.value}`);
      t.assert('panner hits destination', pans[0].connected[0]?.kind === 'destination', '');
      const gains = mgr.ctx.nodes.filter((n) => n.kind === 'gain' && n.gain.value !== undefined);
      t.assert('distance gain applied', gains.some((g) => g.gain.value < 1), JSON.stringify(gains.map((g) => g.gain.value)));
      const n0 = mgr.ctx.nodes.length;
      mgr.play('ui_click');
      const pans2 = mgr.ctx.nodes.filter((n) => n.kind === 'pan');
      t.assert('no panner without position', pans2.length === pans.length, '');
      t.assert('new nodes created', mgr.ctx.nodes.length > n0, '');
    },
  },
  {
    name: 'sim passes kill-site positions, UI stays global',
    run(t) {
      const calls = [];
      const audio = {
        play(n, at) { calls.push([n, at]); },
        setSuspended() {},
        stopMusic() {},
        startMusic() {},
        updateMusicAge() {},
      };
      const sim = new BattleSim({ seed: 7, autoAI: false, audio });
      sim.gold = 1e6;
      sim.spawnUnit(0);
      const spawnCall = calls.find(([n]) => n === 'spawn');
      t.assert('spawn carries a position', !!spawnCall && Number.isFinite(spawnCall[1]?.x),
        JSON.stringify(spawnCall));
      t.assert('spawn position is the base in metres',
        Math.abs(spawnCall[1].x - toMeters(sim.units[0].x)) < 1e-9, JSON.stringify(spawnCall[1]));
      sim.spawnEnemyUnit(0);
      for (let i = 0; i < 3600 && !calls.some(([n]) => n === 'death' || n === 'thud'); i++) {
        sim.update(1 / 60);
      }
      const deaths = calls.filter(([n]) => n === 'death' || n === 'thud');
      t.assert('combat produced deaths', deaths.length > 0, `deaths=${deaths.length}`);
      t.assert('deaths carry positions', deaths.every(([, at]) => Number.isFinite(at?.x)),
        JSON.stringify(deaths.slice(0, 2)));
      const ui = calls.filter(([n]) => n === 'ui_click');
      t.assert('ui clicks stay global', ui.every(([, at]) => at == null), JSON.stringify(ui.slice(0, 2)));
    },
  },
  {
    name: 'horn announces specials without throttling',
    run(t) {
      const mgr = new AudioManager();
      mgr.ctx = fakeCtx();
      mgr.initialized = true;
      t.assert('horn plays', mgr.play('horn') === true, '');
      const oscs = mgr.ctx.nodes.filter((n) => n.kind === 'osc');
      t.assert('brass stack built', oscs.length >= 2, `oscs=${oscs.length}`);
      t.assert('no throttle on horn', mgr.play('horn') === true, '');
    },
  },
];
