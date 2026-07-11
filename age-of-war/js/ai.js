class AI {
  constructor(game) {
    this.game = game;
    this.thinkTimer = 0;
    this.thinkInterval = CONFIG.AI_THINK_INTERVAL / 1000 * CONFIG.DIFFICULTIES[game.difficulty].aiThinkMult;
    this.waveTimer = 0;
    this.waveCooldown = 8;
    this.lastWaveSize = 0;
    this.aggression = 0.5;
    this.strategy = 'balanced';
  }

  update(dt) {
    this.thinkTimer += dt;
    this.waveTimer += dt;
    this.updateAggression();

    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;
      this.decide();
    }
  }

  updateAggression() {
    const g = this.game;
    const hpRatio = g.enemyBase.hp / g.enemyBase.maxHp;
    const playerHpRatio = g.playerBase.hp / g.playerBase.maxHp;
    const ageDiff = g.enemyAge - g.currentAge;

    let agg = 0.5;
    if (hpRatio < 0.3) agg += 0.3;
    else if (hpRatio < 0.5) agg += 0.15;
    if (playerHpRatio > 0.8) agg += 0.1;
    if (ageDiff > 0) agg -= 0.15;
    else if (ageDiff < 0) agg += 0.2;
    if (g.enemyGold > 5000) agg += 0.1;

    this.aggression = clamp(agg, 0.2, 0.95);
  }

  decide() {
    const g = this.game;
    const age = CONFIG.AGES[g.enemyAge];
    const playerUnits = g.units.filter(u => u.side === 'player' && u.alive);
    const enemyUnits = g.units.filter(u => u.side === 'enemy' && u.alive);

    this.analyzeThreats(playerUnits);

    if (this.trySpecial(g, playerUnits)) return;
    if (this.tryEvolve(g)) return;
    if (this.tryHero(g, age)) return;
    if (this.tryWaveSpawn(g, age, enemyUnits, playerUnits)) return;
    if (this.tryTurret(g, age)) return;
    if (this.tryBuildings(g)) return;
    if (this.tryUnitSpawn(g, age, playerUnits)) return;
  }

  analyzeThreats(playerUnits) {
    const counts = { melee: 0, ranged: 0, fast: 0, siege: 0, armored: 0, elite: 0 };
    for (const u of playerUnits) {
      counts[u.type] = (counts[u.type] || 0) + 1;
    }
    const total = playerUnits.length || 1;

    if (counts.siege > 0 || counts.armored > 1) {
      this.strategy = 'heavy';
    } else if (counts.fast > total * 0.4) {
      this.strategy = 'rush';
    } else if (counts.ranged > total * 0.5) {
      this.strategy = 'ranged';
    } else {
      this.strategy = 'balanced';
    }
  }

  trySpecial(g, playerUnits) {
    if (g.enemySpecialCooldown > 0) return false;
    const playerCount = playerUnits.length;
    const nearBase = playerUnits.filter(u => u.x < CONFIG.WORLD.WIDTH * 0.35).length;

    if (playerCount >= 5 || nearBase >= 3 || g.enemyBase.hp < g.enemyBase.maxHp * 0.4) {
      g.useEnemySpecial();
      return true;
    }
    if (this.aggression > 0.8 && playerCount >= 3) {
      g.useEnemySpecial();
      return true;
    }
    return false;
  }

  tryEvolve(g) {
    if (g.enemyAge >= CONFIG.AGES.length - 1) return false;
    const evoCost = CONFIG.EVOLVE_XP[g.enemyAge + 1];
    if (g.enemyXp < evoCost) return false;

    const playerAges = g.units.filter(u => u.side === 'player' && u.alive);
    const playerMaxAge = playerAges.length > 0 ? Math.max(...playerAges.map(u => u.ageIndex)) : 0;

    if (g.enemyAge < playerMaxAge && Math.random() < 0.8) {
      g.evolveEnemy();
      return true;
    }
    if (Math.random() < 0.4 + this.aggression * 0.2) {
      g.evolveEnemy();
      return true;
    }
    return false;
  }

  tryWaveSpawn(g, age, enemyUnits, playerUnits) {
    if (this.waveTimer < this.waveCooldown) return false;
    const affordableUnits = age.units.filter((u, i) => g.enemyGold >= u.cost);
    if (affordableUnits.length === 0) return false;

    const shouldWave = enemyUnits.length < 3 && g.enemyGold > this.affordableCost(age, 3) && this.aggression > 0.5;
    if (!shouldWave) return false;

    const waveSize = Math.min(
      this.aggression > 0.7 ? 4 : 3,
      affordableUnits.length,
      Math.floor(g.enemyGold / this.cheapestUnit(age))
    );

    if (waveSize < 2) return false;

    this.waveTimer = 0;
    this.lastWaveSize = waveSize;
    for (let i = 0; i < waveSize; i++) {
      const idx = this.pickUnitIndex(g, age, playerUnits);
      if (idx !== null) g.spawnEnemyUnit(idx);
    }
    return true;
  }

  tryTurret(g, age) {
    if (g.enemySlotsBought < CONFIG.TURRET_SLOTS && g.enemyGold >= CONFIG.TURRET_SLOT_COST) {
      if (Math.random() < 0.2 * this.aggression) {
        g.buyEnemySlot();
        return true;
      }
    }

    const occupiedCount = g.turrets.filter(t => t.side === 'enemy').length;
    if (occupiedCount >= g.enemySlotsBought) return false;
    if (Math.random() > 0.25) return false;

    const turretWeights = this.getTurretWeights(g, age);
    const totalW = turretWeights.reduce((s, w) => s + w, 0);
    if (totalW <= 0) return false;

    let r = Math.random() * totalW;
    for (let i = 0; i < age.turrets.length; i++) {
      r -= turretWeights[i];
      if (r <= 0) {
        g.spawnEnemyTurret(i);
        return true;
      }
    }
    return false;
  }

  getTurretWeights(g, age) {
    return age.turrets.map((t, i) => {
      if (g.enemyGold < t.cost) return 0;
      let w = 1;

      if (t.splashRadius > 0 && (this.strategy === 'ranged' || this.strategy === 'balanced')) w += 2;
      if (this.strategy === 'rush' && !t.splashRadius) w += 1;
      if (this.strategy === 'heavy' && t.damage > 50) w += 2;

      if (this.aggression > 0.7 && i === 0) w *= 0.5;
      if (this.aggression < 0.4 && i === age.turrets.length - 1) w *= 1.5;

      return w;
    });
  }

  tryBuildings(g) {
    const count = g.getBuildingCount('enemy');
    if (count >= 4) return false;
    for (let i = 0; i < CONFIG.BUILDINGS.length; i++) {
      const bData = CONFIG.BUILDINGS[i];
      if (g.enemyGold < bData.cost) continue;
      if (Math.random() < 0.3 / (count + 1)) {
        g.buyEnemyBuilding(i);
        return true;
      }
    }
    return false;
  }

  tryHero(g, age) {
    if (!age.hero) return false;
    if (g.enemyHeroCooldown > 0) return false;
    if (g.enemyGold < age.hero.cost) return false;
    if (Math.random() > 0.15 + this.aggression * 0.3) return false;
    g.spawnHero('enemy');
    return true;
  }

  tryUnitSpawn(g, age, playerUnits) {
    const goldRatio = g.enemyGold / Math.max(1, this.cheapestUnit(age));
    if (goldRatio < 1) return false;

    const spawnChance = 0.3 + this.aggression * 0.4;
    if (Math.random() > spawnChance) return false;

    const idx = this.pickUnitIndex(g, age, playerUnits);
    if (idx !== null) {
      g.spawnEnemyUnit(idx);
      return true;
    }
    return false;
  }

  pickUnitIndex(g, age, playerUnits) {
    const weights = age.units.map((u, i) => {
      if (g.enemyGold < u.cost) return 0;
      let w = 1;

      w = this.getUnitWeight(u, i, g, playerUnits);
      return w;
    });

    const total = weights.reduce((s, w) => s + w, 0);
    if (total === 0) return null;

    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return null;
  }

  getUnitWeight(unit, index, g, playerUnits) {
    let w = 1;

    if (unit.type === 'melee') w = this.aggression > 0.6 ? 3.5 : 2.5;
    if (unit.type === 'ranged') w = 2;
    if (unit.type === 'fast') w = this.aggression > 0.7 ? 3 : 1.5;
    if (unit.type === 'siege') w = playerUnits.length > 3 ? 2.5 : 0.8;
    if (unit.type === 'armored') w = this.strategy === 'heavy' ? 3 : 1.2;
    if (unit.type === 'elite') w = g.enemyGold > unit.cost * 1.5 ? 2 : 0.3;

    switch (this.strategy) {
      case 'rush':
        if (unit.type === 'fast') w *= 2;
        if (unit.type === 'siege') w *= 0.3;
        break;
      case 'ranged':
        if (unit.type === 'melee') w *= 1.5;
        if (unit.type === 'fast') w *= 1.3;
        break;
      case 'heavy':
        if (unit.type === 'armored' || unit.type === 'siege') w *= 2;
        if (unit.type === 'fast') w *= 0.5;
        break;
    }

    if (unit.type === 'elite') {
      w *= (this.aggression > 0.7 ? 1.5 : 0.5);
    }

    const playerCount = playerUnits.length;
    if (playerCount > 8) {
      if (unit.splashRadius > 0 || unit.type === 'siege') w *= 1.8;
    }

    return w;
  }

  affordableCost(age, count) {
    const sorted = age.units.map(u => u.cost).sort((a, b) => a - b);
    let total = 0;
    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      total += sorted[i];
    }
    return total;
  }

  cheapestUnit(age) {
    let min = Infinity;
    for (const u of age.units) {
      if (u.cost < min) min = u.cost;
    }
    return min;
  }
}
