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
      // Unknown ages fall back to the Stone row, never undefined.
      t.assert('future unit falls back to rock', unitProjectileKind(4, 'ranged') === 'rock');
      t.assert('future turret falls back to stone row', turretProjectileKind(4, 2) === 'boulder');
      t.assert('bad turret index falls back to rock', turretProjectileKind(1, 9) === 'rock');
    },
  },
];
