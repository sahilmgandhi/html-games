module.exports = [
  {
    name: 'CONFIG Invariants',
    run(t) {
      t.assert('5 ages defined', CONFIG.AGES.length === 5);
      t.assert('EVOLVE_XP has 5 entries', CONFIG.EVOLVE_XP.length === 5);
      t.assert('TURRET_SLOTS is 4', CONFIG.TURRET_SLOTS === 4);
      t.assert('TURRET_REFUND_RATE is 0.5', CONFIG.TURRET_REFUND_RATE === 0.5);
      t.assert('SPECIAL_COOLDOWN is 40', CONFIG.SPECIAL_COOLDOWN === 40);
      t.assert('HUD_HEIGHT is 145', CONFIG.HUD_HEIGHT === 145);
      t.assert('Each age has 3 turrets', CONFIG.AGES.every(a => a.turrets.length === 3));
      t.assert('Special damage scales 250->1000', CONFIG.AGES.map(a => a.specialDamage).join(',') === '250,400,550,700,1000');
    },
  },
];
