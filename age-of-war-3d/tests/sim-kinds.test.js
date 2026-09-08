import { unitProjectileKind, turretProjectileKind } from '../src/simulation/entities.js';

export default [
  {
    name: 'projectile kinds',
    run(t) {
      // Stone Age mapping is unchanged.
      t.assert('stone ranged slings rock', unitProjectileKind(0, 'ranged') === 'rock');
      t.assert('stone siege lofts boulder', unitProjectileKind(0, 'siege') === 'boulder');
      t.assert('stone turret row intact', turretProjectileKind(0, 1) === 'egg');
      // Castle Age routing.
      t.assert('castle archer fires arrow', unitProjectileKind(1, 'ranged') === 'arrow');
      t.assert('castle catapult lofts boulder', turretProjectileKind(1, 0) === 'boulder');
      t.assert('fire catapult fires fireball', turretProjectileKind(1, 1) === 'fireball');
      t.assert('oil pourer fires oil', turretProjectileKind(1, 2) === 'oil');
      // Renaissance routing.
      t.assert('musketeer fires musketball', unitProjectileKind(2, 'ranged') === 'musketball');
      t.assert('cannoneer fires cannonball', unitProjectileKind(2, 'siege') === 'cannonball');
      t.assert('small cannon fires cannonball', turretProjectileKind(2, 0) === 'cannonball');
      t.assert('explosive cannon fires shell', turretProjectileKind(2, 2) === 'shell');
      // Modern routing.
      t.assert('infantry fires bullet', unitProjectileKind(3, 'ranged') === 'bullet');
      t.assert('tank fires shell', unitProjectileKind(3, 'armored') === 'shell');
      t.assert('single turret fires bullet', turretProjectileKind(3, 0) === 'bullet');
      t.assert('rocket turret fires rocket', turretProjectileKind(3, 1) === 'rocket');
      t.assert('double turret fires bullet', turretProjectileKind(3, 2) === 'bullet');
      // Future routing.
      t.assert('blaster fires laser', unitProjectileKind(4, 'ranged') === 'laser');
      t.assert('war machine fires plasma', unitProjectileKind(4, 'armored') === 'plasma');
      t.assert('super soldier fires plasma', unitProjectileKind(4, 'elite') === 'plasma');
      t.assert('titanium shooter fires bullet', turretProjectileKind(4, 0) === 'bullet');
      t.assert('lazer cannon fires laser', turretProjectileKind(4, 1) === 'laser');
      t.assert('ion ray fires plasma', turretProjectileKind(4, 2) === 'plasma');
      // Unknown ages fall back to the Stone row, never undefined.
      t.assert('unknown age unit falls back to rock', unitProjectileKind(9, 'ranged') === 'rock');
      t.assert('unknown age turret falls back to stone row', turretProjectileKind(9, 2) === 'boulder');
      t.assert('bad turret index falls back to rock', turretProjectileKind(1, 9) === 'rock');
    },
  },
];
