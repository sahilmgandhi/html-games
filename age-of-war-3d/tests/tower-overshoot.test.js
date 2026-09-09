import { BattleSim } from '../src/simulation/battle.js';

function makeSim(opts = {}) {
  return new BattleSim({ seed: 7, autoAI: false, ...opts });
}

function rich(sim) {
  sim.gold = 1e6;
  sim.xp = 1e6;
  sim.enemyGold = 1e6;
  sim.enemyXp = 1e6;
  return sim;
}

export default [
  {
    name: 'melee stops at range edge, never overshoots past target',
    run(t) {
      const sim = rich(makeSim());
      const u = sim.spawnUnitForSide('player', 0); // Clubman range 28
      const foe = sim.spawnEnemyUnit(0);
      foe.x = u.x + u.range + 5;
      foe.y = u.y;
      u.speed = 1.8;
      sim.update(0.5);
      const dist = Math.abs(foe.x - u.x);
      t.assert('unit holds at range edge', dist >= u.range - 1e-6, `dist ${dist} < range ${u.range}`);
      t.assert('unit never passes target', u.x <= foe.x, `x ${u.x} > foe ${foe.x}`);
    },
  },
  {
    name: 'spawn X is constant (no formation offsets)',
    run(t) {
      const sim = rich(makeSim());
      t.assert('formationMode removed', sim.formationMode === undefined, `got ${sim.formationMode}`);
      const xs = [];
      for (let i = 0; i < 5; i++) xs.push(sim.spawnUnitForSide('player', 0).x);
      t.assert('all spawns share one X', xs.every((x) => x === xs[0]), xs.join(','));
      t.assert('hud has no formation', sim.hudState().formation === undefined, String(sim.hudState().formation));
    },
  },
  {
    name: 'shared tower mounts exist, turrets downsized onto tower',
    async run(t) {
      let TowerMesh = null;
      try {
        ({ TowerMesh } = await import('../src/turrets/tower.js'));
      } catch (e) {
        t.assert('tower module loads', false, String(e?.message || e));
        return;
      }
      t.assert('TowerMesh exists', typeof TowerMesh === 'function', typeof TowerMesh);
      const tower = TowerMesh('player', 0);
      t.assert('tower has 4 mounts', tower.mounts?.length === 4, String(tower.mounts?.length));
      const { TurretMesh } = await import('../src/turrets/turrets.js');
      const fake = { x: 140, z: 0, side: 'player', turretIndex: 0, slotIndex: 0, hp: 150, maxHp: 150, alive: true, hitFlash: 0 };
      const tm = TurretMesh(fake, 0);
      const box = new (await import('three')).Box3().setFromObject(tm.mesh);
      const size = new (await import('three')).Vector3();
      box.getSize(size);
      t.assert('turret downsized (<3.2m wide)', Math.max(size.x, size.z) < 3.2, size.toArray().join(','));
      tm.dispose();
      tower.dispose();
    },
  },
];
