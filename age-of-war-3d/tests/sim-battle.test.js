import { BattleSim } from '../src/simulation/battle.js';
import { CONFIG } from '../src/simulation/config.js';

const DURATIONS = [2.0, 1.5, 2.0, 2.5, 1.5];

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

function audioSpy() {
  return {
    plays: [],
    music: [],
    play(n) { this.plays.push(n); },
    setSuspended() {},
    stopMusic() { this.music.push('stop'); },
    startMusic(a) { this.music.push(`start:${a}`); },
    updateMusicAge(a) { this.music.push(`age:${a}`); },
  };
}

export default [
  {
    name: 'special durations match the original per-age table',
    run(t) {
      const sim = rich(makeSim());
      for (let age = 0; age < 5; age++) {
        sim.currentAge = age;
        sim.specialCooldown = 0;
        t.assert(`age ${age} special fires`, sim.useSpecial() === true);
        t.assert(
          `age ${age} duration is ${DURATIONS[age]}s`,
          sim.specialAnim.duration === DURATIONS[age],
          `got ${sim.specialAnim?.duration}`,
        );
        sim.update(sim.specialAnim.duration + 0.5);
      }
    },
  },
  {
    name: 'special damage timing is per-age (volley early, laser after sweep)',
    run(t) {
      const sim = rich(makeSim());
      const freshFoe = () => {
        sim.spawnEnemyUnit(0);
        const u = sim.units.find((u) => u.side === 'enemy');
        return { u, full: u.hp };
      };

      sim.currentAge = 1; // Arrow Volley: damage past 50% of 1.5s
      let { u, full } = freshFoe();
      sim.useSpecial();
      sim.update(0.5);
      t.assert('volley has not hit at 0.5s', u.hp === full);
      sim.update(0.4);
      t.assert('volley has hit by 0.9s', u.hp < full);
      sim.update(2);

      sim.currentAge = 0; // Meteor Shower: damage past 70% of 2.0s
      ({ u, full } = freshFoe());
      sim.specialCooldown = 0;
      sim.useSpecial();
      sim.update(1.0);
      t.assert('meteors have not hit at 1.0s', u.hp === full);
      sim.update(0.6);
      t.assert('meteors have hit by 1.6s', u.hp < full);
      sim.update(2);

      sim.currentAge = 4; // Orbital Laser: damage only after charge + sweep
      ({ u, full } = freshFoe());
      sim.specialCooldown = 0;
      sim.useSpecial();
      sim.update(1.0);
      t.assert('laser has not hit at 1.0s (mid-sweep)', u.hp === full);
      sim.update(0.6);
      t.assert('laser has hit once the sweep crosses the field', u.hp < full);
    },
  },
  {
    name: 'specialAnim carries the particle field for renderers',
    run(t) {
      const sim = rich(makeSim());
      sim.currentAge = 0;
      sim.useSpecial();
      t.assert('meteor particles exist', Array.isArray(sim.specialAnim.particles));
      t.assert('six meteors like the original', (sim.specialAnim.particles || []).length === 6);
      sim.update(3);
      sim.currentAge = 4;
      sim.specialCooldown = 0;
      sim.useSpecial();
      const laser = (sim.specialAnim.particles || [])[0] || {};
      t.assert('laser starts charging', laser.charging === true);
      t.assert('laser sweep starts at zero', laser.sweepX === 0);
    },
  },
  {
    name: 'restart reseeds the match so seeded runs reproduce',
    run(t) {
      const sim = rich(makeSim());
      sim.spawnUnitForSide('player', 0);
      const first = sim.units[0].z;
      sim.restart();
      sim.gold = 1e6;
      sim.spawnUnitForSide('player', 0);
      t.assert('lane after restart matches the first run', sim.units[0].z === first);
      t.assert('ai runs on its own stream', sim.ai.rng !== sim.rng);
    },
  },
  {
    name: 'sounds match the original (kill gold, spawn/ui_click, no evolve on restart)',
    run(t) {
      const audio = audioSpy();
      const sim = rich(makeSim({ audio }));
      sim.spawnUnit(0);
      t.assert('spawn plays spawn', audio.plays.includes('spawn'));
      t.assert('spawn plays ui_click', audio.plays.includes('ui_click'));

      const foe = sim.spawnEnemyUnit(0);
      foe.takeDamage(1e9);
      sim.update(0.5);
      t.assert('kill plays death', audio.plays.includes('death'));
      t.assert('kill plays gold', audio.plays.includes('gold'));

      audio.plays.length = 0;
      sim.upgradeUnit(0);
      t.assert('upgrade plays evolve', audio.plays.includes('evolve'));
      t.assert('upgrade plays ui_click', audio.plays.includes('ui_click'));

      audio.plays.length = 0;
      sim.restart();
      t.assert('restart plays no evolve jingle', !audio.plays.includes('evolve'));
      t.assert('restart restarts the age-0 music', audio.music.includes('start:0'));
    },
  },
  {
    name: 'base tracking matches the original (lowest hp, smoothed display)',
    run(t) {
      const sim = makeSim();
      sim.playerBase.takeDamage(100);
      sim.update(0.05);
      t.assert('lowest hp records the dip', sim.playerLowestHp === CONFIG.BASE_HP - 100);
      t.assert(
        'display hp eases toward hp instead of snapping',
        sim.playerBase.displayHp < CONFIG.BASE_HP && sim.playerBase.displayHp > sim.playerBase.hp,
        `got ${sim.playerBase.displayHp}`,
      );
    },
  },
  {
    name: 'balance timeline records the match and resets on restart',
    run(t) {
      const sim = makeSim();
      sim.update(1.2);
      t.assert('snapshots accumulate', (sim.balance?.timeline || []).length >= 1);
      const snap = (sim.balance?.timeline || [])[0] || {};
      t.assert('snapshot carries both sides', snap.playerHp === 1000 && snap.enemyHp === 1000);
      sim.restart();
      t.assert('restart clears the timeline', (sim.balance?.timeline || []).length === 0);
    },
  },
  {
    name: 'restart notifies the render layer so stale FX and meshes reset',
    run(t) {
      const seen = [];
      const sim = makeSim({ events: { emit: (n, p) => seen.push([n, p]) } });
      sim.restart();
      const restart = seen.find(([n]) => n === 'game:restart');
      t.assert('restart emits game:restart', !!restart, JSON.stringify(seen.map(([n]) => n)));
    },
  },
  {
    name: 'projectiles fly in their shooter lane, not the center line',
    run(t) {
      const sim = rich(makeSim());
      const shooter = sim.spawnUnitForSide('player', 1); // Slingshot, ranged
      const foe = sim.spawnEnemyUnit(0);
      foe.x = shooter.x + 50;
      const before = sim.projectilePool.active.length;
      shooter.attackCooldown = 0;
      shooter.attack(foe, sim.projectilePool);
      t.assert('a shot leaves the pool', sim.projectilePool.active.length === before + 1);
      const p = sim.projectilePool.active[sim.projectilePool.active.length - 1];
      t.assert('shot carries the shooter lane', p.z === shooter.z, `got ${p.z}, shooter ${shooter.z}`);
    },
  },
];
