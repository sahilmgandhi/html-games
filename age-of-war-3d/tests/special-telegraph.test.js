import * as THREE from 'three';
import { ParticleSystem3D } from '../src/particles/particles.js';

// Specials telegraph: a long-lived ground ring marks the strike zone before
// the staggered impacts land. shockwave() takes a ttl opt for this; the
// default 0.45s snap stays for ordinary heavy hits.
if (!globalThis.document.body) {
  globalThis.document.body = { appendChild() {} };
  const origCreate = globalThis.document.createElement;
  globalThis.document.createElement = (...a) => Object.assign(origCreate(...a),
    { style: {}, className: '', appendChild() {} });
}

export default [
  {
    name: 'shockwave ttl opt lingers for telegraphs',
    run(t) {
      const scene = new THREE.Scene();
      const fx = new ParticleSystem3D(scene);
      fx.shockwave(12, 0.1, 0, { color: 0xff8800, shockR: 7, ttl: 1.4 });
      const ring = fx._rings.find((r) => r.mesh.visible);
      t.assert('ring claimed', !!ring, '');
      t.assert('wide radius', ring.maxR === 7, `maxR=${ring.maxR}`);
      fx.update(0.5);
      t.assert('still alive past impact timing', ring.mesh.visible, `ttl=${ring.ttl.toFixed(2)}`);
      fx.update(1.0);
      t.assert('expires after ttl', !ring.mesh.visible, '');
    },
  },
  {
    name: 'default shockwave still snaps at 0.45s',
    run(t) {
      const scene = new THREE.Scene();
      const fx = new ParticleSystem3D(scene);
      fx.shockwave(12, 0.1, 0, {});
      const ring = fx._rings.find((r) => r.mesh.visible);
      t.assert('default ttl', ring.ttl === 0.45 && ring.max === 0.45, `${ring.ttl}/${ring.max}`);
      fx.update(0.5);
      t.assert('gone after snap', !ring.mesh.visible, '');
    },
  },
];
