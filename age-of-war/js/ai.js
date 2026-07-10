class AI {
  constructor(game) {
    this.game = game;
    this.thinkTimer = 0;
    this.thinkInterval = CONFIG.AI_THINK_INTERVAL / 1000;
  }

  update(dt) {
    this.thinkTimer += dt;
    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;
      this.decide();
    }
  }

  decide() {
    const g = this.game;
    const age = CONFIG.AGES[g.enemyAge];

    if (g.enemyAge < CONFIG.AGES.length - 1) {
      const evoCost = CONFIG.EVOLVE_XP[g.enemyAge + 1];
      if (g.enemyXp >= evoCost && Math.random() < 0.6) {
        g.evolveEnemy();
        return;
      }
    }

    const costs = age.units.map(u => u.cost);
    const affordable = costs.filter(c => g.enemyGold >= c);
    if (affordable.length === 0) return;

    const weights = age.units.map((u, i) => {
      if (g.enemyGold < u.cost) return 0;
      let w = 1;
      if (u.type === 'melee') w = 3;
      if (u.type === 'ranged') w = 2;
      if (u.type === 'fast') w = 1.5;
      if (u.type === 'armored') w = 1;
      if (u.type === 'air') w = 1.5;
      if (u.type === 'siege') w = 0.8;

      const playerUnits = g.units.filter(u => u.side === 'player' && u.alive).length;
      if (playerUnits > 5) w *= 1.5;

      return w;
    });

    const totalWeight = weights.reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return;

    let r = Math.random() * totalWeight;
    for (let i = 0; i < age.units.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        g.spawnEnemyUnit(i);
        return;
      }
    }
  }
}
