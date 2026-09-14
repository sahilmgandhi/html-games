// AI port of ../age-of-war/js/ai.js. Only change: randomness comes from an
// injected seeded PRNG (see rng.js) instead of Math.random(), so matches are
// deterministic. The `game` interface is unchanged from the original.
//
// The brain is side-agnostic: one policy drives the red enemy (side 'enemy',
// the default) and the blue spectate bot (side 'player'). The bot keeps a
// constant think rate so the Easy->Impossible curve comes only from enemy
// buffs, and it uses the unrestrained special policy on every difficulty.

import { CONFIG } from './config.js';
import { clamp } from './utils.js';
import { mulberry32 } from './rng.js';

export class AI {
  constructor(game, rng = mulberry32(1), side = 'enemy') {
    this.game = game;
    this.rng = rng;
    this.side = side;
    this.thinkTimer = 0;
    const thinkMult = side === 'player'
      ? 1.0
      : CONFIG.DIFFICULTIES[game.difficulty].aiThinkMult;
    this.thinkInterval = CONFIG.AI_THINK_INTERVAL / 1000 * thinkMult;
    this.waveTimer = 0;
    this.waveCooldown = 8;
    this.aggression = 0.5;
    this.strategy = 'balanced';
  }

  isPlayer() {
    return this.side === 'player';
  }

  foeSide() {
    return this.isPlayer() ? 'enemy' : 'player';
  }

  myGold(g) {
    return this.isPlayer() ? g.gold : g.enemyGold;
  }

  myXp(g) {
    return this.isPlayer() ? g.xp : g.enemyXp;
  }

  myAge(g) {
    return this.isPlayer() ? g.currentAge : g.enemyAge;
  }

  foeAge(g) {
    return this.isPlayer() ? g.enemyAge : g.currentAge;
  }

  myBase(g) {
    return this.isPlayer() ? g.playerBase : g.enemyBase;
  }

  foeBase(g) {
    return this.isPlayer() ? g.enemyBase : g.playerBase;
  }

  mySpecialCd(g) {
    return this.isPlayer() ? g.specialCooldown : g.enemySpecialCooldown;
  }

  myHeroCd(g) {
    return this.isPlayer() ? g.heroCooldown : g.enemyHeroCooldown;
  }

  spawnUnitForMe(g, idx) {
    return this.isPlayer() ? g.spawnUnit(idx) : g.spawnEnemyUnit(idx);
  }

  spawnTurretForMe(g, idx) {
    return this.isPlayer() ? g.spawnTurret(idx) : g.spawnEnemyTurret(idx);
  }

  buySlotForMe(g) {
    if (this.isPlayer()) return g.buySlot();
    g.buyEnemySlot();
    return true;
  }

  slotsBought(g) {
    return this.isPlayer() ? g.playerSlotsBought : g.enemySlotsBought;
  }

  buyBuildingForMe(g, idx) {
    return this.isPlayer() ? g.buyBuilding(idx) : g.buyEnemyBuilding(idx);
  }

  evolveMe(g) {
    return this.isPlayer() ? g.evolve() : g.evolveEnemy();
  }

  specialMe(g) {
    return this.isPlayer() ? g.useSpecial() : g.useEnemySpecial();
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
    const hpRatio = this.myBase(g).hp / this.myBase(g).maxHp;
    const foeHpRatio = this.foeBase(g).hp / this.foeBase(g).maxHp;
    const ageDiff = this.myAge(g) - this.foeAge(g);

    let agg = 0.5;
    if (hpRatio < 0.3) agg += 0.3;
    else if (hpRatio < 0.5) agg += 0.15;
    if (foeHpRatio > 0.8) agg += 0.1;
    if (ageDiff > 0) agg -= 0.15;
    else if (ageDiff < 0) agg += 0.2;
    if (this.myGold(g) > 5000) agg += 0.1;

    this.aggression = clamp(agg, 0.2, 0.95);
  }

  decide() {
    const g = this.game;
    const age = CONFIG.AGES[this.myAge(g)];
    const foeUnits = g.units.filter(u => u.side === this.foeSide() && u.alive);
    const myUnits = g.units.filter(u => u.side === this.side && u.alive);

    this.analyzeThreats(foeUnits);

    // Stance from base HP: the loser turtles (turrets grant no kill rewards,
    // so turtling starves the winner's snowball), the clear winner techs up
    // instead of piling on, everyone else fights in waves, not trickles.
    const myHpFrac = this.myBase(g).hp / this.myBase(g).maxHp;
    const foeHpFrac = this.foeBase(g).hp / this.foeBase(g).maxHp;
    const losing = myHpFrac < 0.5;
    const winning = !losing && foeHpFrac < myHpFrac - 0.2;

    if (this.trySpecial(g, foeUnits)) return;
    if (this.tryEvolve(g)) return;
    if (losing || winning) {
      if (this.tryTurret(g, age)) return;
      if (this.tryBuildings(g)) return;
      if (this.tryUpgrade(g)) return;
      if (this.tryHero(g, age)) return;
      if (this.tryWaveSpawn(g, age, myUnits, foeUnits)) return;
      return;
    }
    if (this.tryHero(g, age)) return;
    if (this.tryWaveSpawn(g, age, myUnits, foeUnits)) return;
    if (this.tryTurret(g, age)) return;
    if (this.tryBuildings(g)) return;
    if (this.tryUpgrade(g)) return;
    if (myUnits.length < 3 && this.tryUnitSpawn(g, age, foeUnits)) return;
  }

  analyzeThreats(foeUnits) {
    const counts = { melee: 0, ranged: 0, fast: 0, siege: 0, armored: 0, elite: 0 };
    for (const u of foeUnits) {
      counts[u.type] = (counts[u.type] || 0) + 1;
    }
    const total = foeUnits.length || 1;

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

  foeNearBase(foeUnits) {
    if (this.isPlayer()) {
      return foeUnits.filter(u => u.x < CONFIG.WORLD.WIDTH * 0.35).length;
    }
    return foeUnits.filter(u => u.x > CONFIG.WORLD.WIDTH * 0.65).length;
  }

  trySpecial(g, foeUnits) {
    if (this.mySpecialCd(g) > 0) return false;
    const cost = (CONFIG.SPECIAL_XP_COST && CONFIG.SPECIAL_XP_COST[this.myAge(g)]) || 0;
    if (this.myXp(g) < cost) return false;

    const nearBase = this.foeNearBase(foeUnits);
    const hpRatio = this.myBase(g).hp / this.myBase(g).maxHp;

    if (this.isPlayer()) {
      if (hpRatio < 0.5 || nearBase >= 3) {
        this.specialMe(g);
        return true;
      }
      return false;
    }

    if (g.difficulty === 0) {
      if ((hpRatio < 0.2 || nearBase >= 5) && this.rng() < 0.2) {
        this.specialMe(g);
        return true;
      }
    } else if (g.difficulty === 1) {
      if ((hpRatio < 0.3 || nearBase >= 4) && this.rng() < 0.3) {
        this.specialMe(g);
        return true;
      }
    } else if (g.difficulty === 2) {
      if ((hpRatio < 0.4 || nearBase >= 3) && this.rng() < 0.5) {
        this.specialMe(g);
        return true;
      }
    } else {
      if (hpRatio < 0.5 || nearBase >= 3) {
        this.specialMe(g);
        return true;
      }
    }
    return false;
  }

  tryEvolve(g) {
    if (this.myAge(g) >= CONFIG.AGES.length - 1) return false;
    const evoCost = CONFIG.EVOLVE_XP[this.myAge(g) + 1];
    if (this.myXp(g) < evoCost) return false;

    const foeAges = g.units.filter(u => u.side === this.foeSide() && u.alive);
    const foeMaxAge = foeAges.length > 0 ? Math.max(...foeAges.map(u => u.ageIndex)) : 0;

    if (this.myAge(g) < foeMaxAge && this.rng() < 0.8) {
      this.evolveMe(g);
      return true;
    }
    if (this.rng() < 0.4 + this.aggression * 0.2) {
      this.evolveMe(g);
      return true;
    }
    return false;
  }

  tryWaveSpawn(g, age, myUnits, foeUnits) {
    if (this.waveTimer < this.waveCooldown) return false;
    const affordableUnits = age.units.filter((u, i) => this.myGold(g) >= u.cost);
    if (affordableUnits.length === 0) return false;

    const shouldWave = myUnits.length < 3 && this.myGold(g) > this.affordableCost(age, 3) && this.aggression > 0.5;
    if (!shouldWave) return false;

    const waveSize = Math.min(
      this.aggression > 0.7 ? 4 : 3,
      affordableUnits.length,
      Math.floor(this.myGold(g) / this.cheapestUnit(age))
    );

    if (waveSize < 2) return false;

    this.waveTimer = 0;
    for (let i = 0; i < waveSize; i++) {
      const idx = this.pickUnitIndex(g, age, foeUnits);
      if (idx !== null) this.spawnUnitForMe(g, idx);
    }
    return true;
  }

  tryTurret(g, age) {
    if (this.slotsBought(g) < CONFIG.TURRET_SLOTS && this.myGold(g) >= CONFIG.TURRET_SLOT_COST) {
      if (this.rng() < 0.2 * this.aggression) {
        this.buySlotForMe(g);
        return true;
      }
    }

    const occupiedCount = g.turrets.filter(t => t.side === this.side).length;
    if (occupiedCount >= this.slotsBought(g)) return false;
    if (this.rng() > 0.25) return false;

    const turretWeights = this.getTurretWeights(g, age);
    const totalW = turretWeights.reduce((s, w) => s + w, 0);
    if (totalW <= 0) return false;

    let r = this.rng() * totalW;
    for (let i = 0; i < age.turrets.length; i++) {
      r -= turretWeights[i];
      if (r <= 0) {
        this.spawnTurretForMe(g, i);
        return true;
      }
    }
    return false;
  }

  getTurretWeights(g, age) {
    return age.turrets.map((t, i) => {
      if (this.myGold(g) < t.cost) return 0;
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
    const count = g.getBuildingCount(this.side);
    if (count >= CONFIG.MAX_BUILDINGS) return false;
    for (let i = 0; i < CONFIG.BUILDINGS.length; i++) {
      const bData = CONFIG.BUILDINGS[i];
      if (this.myGold(g) < bData.cost) continue;
      if (this.rng() < 0.3 / (count + 1)) {
        this.buyBuildingForMe(g, i);
        return true;
      }
    }
    return false;
  }

  tryHero(g, age) {
    if (!age.hero) return false;
    if (this.myHeroCd(g) > 0) return false;
    if (this.myGold(g) < age.hero.cost) return false;
    if (this.rng() > 0.15 + this.aggression * 0.3) return false;
    g.spawnHero(this.side);
    return true;
  }

  // Unit upgrades exist only on the player side, so this is a no-op for the
  // enemy. The bot upgrades whatever it fields most, spreading tiers across
  // unit types instead of maxing slot 0.
  tryUpgrade(g) {
    if (!this.isPlayer()) return false;
    const age = CONFIG.AGES[g.currentAge];
    const counts = {};
    for (const u of g.units) {
      if (u.side === 'player' && u.alive && !u.isHero && u.ageIndex === g.currentAge) {
        counts[u.unitIndex] = (counts[u.unitIndex] || 0) + 1;
      }
    }
    const options = age.units
      .map((u, i) => i)
      .filter((i) => (g.unitUpgrades[i] || 0) < CONFIG.MAX_UPGRADE_TIER
        && g.getUnitUpgradeCost(i) !== null
        && g.gold >= g.getUnitUpgradeCost(i))
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    if (options.length === 0) return false;
    if (this.rng() > 0.35 + this.aggression * 0.3) return false;
    g.upgradeUnit(options[0]);
    return true;
  }

  tryUnitSpawn(g, age, foeUnits) {
    const goldRatio = this.myGold(g) / Math.max(1, this.cheapestUnit(age));
    if (goldRatio < 1) return false;

    const spawnChance = 0.3 + this.aggression * 0.4;
    if (this.rng() > spawnChance) return false;

    const idx = this.pickUnitIndex(g, age, foeUnits);
    if (idx !== null) {
      this.spawnUnitForMe(g, idx);
      return true;
    }
    return false;
  }

  pickUnitIndex(g, age, foeUnits) {
    const weights = age.units.map((u, i) => {
      if (this.myGold(g) < u.cost) return 0;
      return this.getUnitWeight(u, i, g, foeUnits);
    });

    const total = weights.reduce((s, w) => s + w, 0);
    if (total === 0) return null;

    let r = this.rng() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return null;
  }

  getUnitWeight(unit, index, g, foeUnits) {
    let w = 1;

    if (unit.type === 'melee') w = this.aggression > 0.6 ? 3.5 : 2.5;
    if (unit.type === 'ranged') w = 2;
    if (unit.type === 'fast') w = this.aggression > 0.7 ? 3 : 1.5;
    if (unit.type === 'siege') w = foeUnits.length > 3 ? 2.5 : 0.8;
    if (unit.type === 'armored') w = this.strategy === 'heavy' ? 3 : 1.2;
    if (unit.type === 'elite') w = this.myGold(g) > unit.cost * 1.5 ? 2 : 0.3;

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

    const foeCount = foeUnits.length;
    if (foeCount > 8) {
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
