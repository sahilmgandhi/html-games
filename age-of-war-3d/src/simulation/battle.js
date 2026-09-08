// BattleSim: headless match orchestrator for age-of-war-3d (Stone Age MVP).
// Mirrors ../age-of-war/js/game.js update/spawn/evolve/special logic, minus all
// rendering, input, DOM particles, achievements and save/load. Pure logic plus
// an optional event sink, so it runs in Node (smoke tests) and in the browser.
//
// Slot math (turret/building x/y) is identical to the original so combat
// distances match. Lane depth `z` is visual-only, dealt from the seeded RNG.

import { CONFIG } from './config.js';
import {
  SpatialHash, Base, Unit, Turret, Building, ProjectilePool,
} from './entities.js';
import { AI } from './ai.js';
import { mulberry32 } from './rng.js';

export class BattleSim {
  constructor(opts = {}) {
    this.difficulty = opts.difficulty ?? 0;
    this.rng = opts.rng || mulberry32(opts.seed ?? 1);
    this.events = opts.events || null; // EventBus-like { emit(name, payload) }
    this.audio = opts.audio || null; // { play(name) }, optional
    this.autoAI = opts.autoAI ?? true; // enemy AI driver
    this.autoPlayer = opts.autoPlayer ?? false; // scripted player for demo mode

    this.playerBase = new Base(CONFIG.BASE_X_OFFSET, CONFIG.GROUND_Y, 'player');
    this.enemyBase = new Base(CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, CONFIG.GROUND_Y, 'enemy');
    this.turretSlotPositions = this.computeSlotPositions(CONFIG.BASE_X_OFFSET, 1);
    this.enemyTurretSlotPositions = this.computeSlotPositions(
      CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET, -1,
    );
    this.ai = new AI(this, this.rng);

    this.resetState();
  }

  resetState() {
    this.gold = CONFIG.STARTING_GOLD;
    this.xp = CONFIG.STARTING_XP;
    this.currentAge = 0;
    this.enemyGold = CONFIG.STARTING_GOLD;
    this.enemyXp = CONFIG.STARTING_XP;
    this.enemyAge = 0;

    this.specialCooldown = 0;
    this.enemySpecialCooldown = 0;
    this.specialAnim = null;
    this.heroCooldown = 0;
    this.enemyHeroCooldown = 0;

    this.playerBase.reset();
    this.enemyBase.reset();

    this.units = [];
    this.turrets = [];
    this.buildings = [];
    this.projectilePool = new ProjectilePool(64);
    this.spatialHash = new SpatialHash(128);

    this.playerSlotsBought = 1;
    this.enemySlotsBought = 1;
    this.unitUpgrades = {};

    this.gameOver = false;
    this.winner = null;
    this.paused = false;
    this.gameSpeed = 1;
    this.formationMode = 0;
    this.gameTime = 0;
    this.totalSpawned = 0;
    this.totalGoldSpent = 0;
    this.playerLowestHp = CONFIG.BASE_HP;
    this._demoTimer = 0;
  }

  restart() {
    const difficulty = this.difficulty;
    const rng = this.rng;
    this.resetState();
    this.difficulty = difficulty;
    this.rng = rng;
    this.ai = new AI(this, this.rng);
    this._sound('evolve');
  }

  emit(name, payload) {
    try { this.events?.emit(name, payload); } catch { /* render sink must never break sim */ }
  }

  _sound(name) {
    try { this.audio?.play(name); } catch { /* audio is cosmetic */ }
  }

  // ---- slots (identical math to the original) ----
  computeSlotPositions(baseX, dir) {
    const positions = [];
    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      positions.push({
        x: baseX + dir * CONFIG.TURRET_SLOT_OFFSET_X,
        y: CONFIG.GROUND_Y - i * CONFIG.TURRET_SLOT_SPACING,
        z: (i - (CONFIG.TURRET_SLOTS - 1) / 2) * 1.1,
      });
    }
    return positions;
  }

  firstFreeSlot(entities, side, maxSlots) {
    const taken = new Set(entities.filter((e) => e.side === side && e.alive).map((e) => e.slotIndex));
    for (let i = 0; i < maxSlots; i++) {
      if (!taken.has(i)) return i;
    }
    return null;
  }

  laneZ() {
    return (this.rng() * 2 - 1) * 1.6;
  }

  // ---- spawning ----
  spawnUnitForSide(side, unitIndex) {
    const isPlayer = side === 'player';
    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    const data = age.units[unitIndex];
    if (!data) return null;
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < data.cost) return null;

    if (isPlayer) {
      this.gold -= data.cost;
      this.totalGoldSpent += data.cost;
    } else {
      this.enemyGold -= data.cost;
    }

    let spawnX = isPlayer
      ? CONFIG.BASE_X_OFFSET + 30
      : CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30;

    if (isPlayer && this.formationMode > 0) {
      const sameType = this.units.filter(
        (u) => u.side === 'player' && u.unitIndex === unitIndex && u.alive);
      const count = sameType.length;
      const spacing = 20;
      if (this.formationMode === 1) {
        spawnX += (count % 5) * spacing - Math.min(count, 5) * spacing / 2;
      } else if (this.formationMode === 2) {
        const row = Math.floor(count / 5);
        const col = count % 5;
        spawnX += (col - 2) * spacing * (1 - row * 0.15);
      }
    }
    const u = new Unit(
      spawnX, CONFIG.GROUND_Y, side,
      isPlayer ? this.currentAge : this.enemyAge, unitIndex,
      isPlayer ? (this.unitUpgrades[unitIndex] || 0) : 0, false, this.laneZ(),
    );
    if (!isPlayer) this.applyEnemyScaling(u, data.hp, data.damage);
    this.units.push(u);
    if (isPlayer) {
      this.totalSpawned++;
      this._sound('spawn');
    }
    this.emit('entity:spawn', u);
    return u;
  }

  spawnUnit(i) { return this.spawnUnitForSide('player', i); }
  spawnEnemyUnit(i) { return this.spawnUnitForSide('enemy', i); }

  spawnHero(side) {
    const isPlayer = side === 'player';
    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    if (!age.hero) return null;
    if ((isPlayer ? this.heroCooldown : this.enemyHeroCooldown) > 0) return null;
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < age.hero.cost) return null;

    if (isPlayer) {
      this.gold -= age.hero.cost;
      this.totalGoldSpent += age.hero.cost;
      this.heroCooldown = CONFIG.HERO_COOLDOWN;
    } else {
      this.enemyGold -= age.hero.cost;
      this.enemyHeroCooldown = CONFIG.HERO_COOLDOWN;
    }
    const spawnX = isPlayer
      ? CONFIG.BASE_X_OFFSET + 30
      : CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET - 30;
    const u = new Unit(
      spawnX, CONFIG.GROUND_Y, side,
      isPlayer ? this.currentAge : this.enemyAge, 0, 0, true, this.laneZ(),
    );
    if (!isPlayer) this.applyEnemyScaling(u, u.hp, u.damage);
    this.units.push(u);
    this._sound('special');
    this.emit('entity:spawn', u);
    return u;
  }

  applyEnemyScaling(entity, hp, damage) {
    const diff = CONFIG.DIFFICULTIES[this.difficulty];
    entity.hp = Math.round(hp * diff.enemyHpMult + 1e-9);
    entity.maxHp = entity.hp;
    if (damage !== undefined) {
      entity.damage = Math.round(damage * diff.enemyDmgMult + 1e-9);
    }
  }

  spawnTurretForSide(side, turretIndex) {
    const isPlayer = side === 'player';
    const slotsBought = isPlayer ? this.playerSlotsBought : this.enemySlotsBought;
    const slot = this.firstFreeSlot(this.turrets, side, slotsBought);
    if (slot === null) return null;
    const age = CONFIG.AGES[isPlayer ? this.currentAge : this.enemyAge];
    const data = age.turrets[turretIndex];
    if (!data) return null;
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < data.cost) return null;

    if (isPlayer) {
      this.gold -= data.cost;
      this.totalGoldSpent += data.cost;
    } else {
      this.enemyGold -= data.cost;
    }
    const pos = (isPlayer ? this.turretSlotPositions : this.enemyTurretSlotPositions)[slot];
    const t = new Turret(pos.x, pos.y, side,
      isPlayer ? this.currentAge : this.enemyAge, turretIndex, slot);
    t.z = pos.z;
    if (!isPlayer) this.applyEnemyScaling(t, data.hp, data.damage);
    this.turrets.push(t);
    if (isPlayer) this._sound('spawn');
    this.emit('entity:spawn', t);
    return t;
  }

  spawnTurret(i) { return this.spawnTurretForSide('player', i); }
  spawnEnemyTurret(i) { return this.spawnTurretForSide('enemy', i); }

  buyBuildingForSide(side, buildingIndex) {
    const isPlayer = side === 'player';
    const data = CONFIG.BUILDINGS[buildingIndex];
    if (!data) return null;
    const gold = isPlayer ? this.gold : this.enemyGold;
    if (gold < data.cost) return null;
    const slot = this.firstFreeSlot(this.buildings, side, CONFIG.MAX_BUILDINGS);
    if (slot === null) return null;

    if (isPlayer) {
      this.gold -= data.cost;
      this.totalGoldSpent += data.cost;
    } else {
      this.enemyGold -= data.cost;
    }
    const dir = isPlayer ? 1 : -1;
    const baseX = isPlayer ? CONFIG.BASE_X_OFFSET : CONFIG.WORLD.WIDTH - CONFIG.BASE_X_OFFSET;
    const px = baseX + dir * (CONFIG.BUILDING_OFFSET_X + slot * CONFIG.BUILDING_SPACING);
    const b = new Building(px, CONFIG.GROUND_Y - CONFIG.BUILDING_Y_OFFSET, side, buildingIndex, slot);
    b.z = (slot - (CONFIG.MAX_BUILDINGS - 1) / 2) * 1.1 + (isPlayer ? -0.6 : 0.6);
    this.buildings.push(b);
    if (isPlayer) this._sound('spawn');
    this.emit('entity:spawn', b);
    return b;
  }

  buyBuilding(i) { return this.buyBuildingForSide('player', i); }
  buyEnemyBuilding(i) { return this.buyBuildingForSide('enemy', i); }
  buyEnemySlot() {
    if (this.enemySlotsBought >= CONFIG.TURRET_SLOTS) return;
    this.enemySlotsBought++;
  }

  getBuildingCount(side) {
    return this.buildings.filter((b) => b.side === side && b.alive).length;
  }

  // ---- evolve + special ----
  evolveSide(side) {
    const isPlayer = side === 'player';
    const age = isPlayer ? this.currentAge : this.enemyAge;
    if (age >= CONFIG.AGES.length - 1) return false;
    const cost = CONFIG.EVOLVE_XP[age + 1];
    const xp = isPlayer ? this.xp : this.enemyXp;
    if (xp < cost) return false;

    if (isPlayer) {
      this.xp -= cost;
      this.currentAge++;
      this.playerBase.healFraction(CONFIG.EVOLVE_HEAL);
      this._sound('evolve');
    } else {
      this.enemyXp -= cost;
      this.enemyAge++;
      this.enemyBase.healFraction(CONFIG.EVOLVE_HEAL);
    }
    this.emit('age:evolve', { side, ageIndex: isPlayer ? this.currentAge : this.enemyAge });
    return true;
  }

  evolve() { return this.evolveSide('player'); }
  evolveEnemy() { return this.evolveSide('enemy'); }

  useSpecialForSide(side) {
    const isPlayer = side === 'player';
    const cooldown = isPlayer ? this.specialCooldown : this.enemySpecialCooldown;
    if (cooldown > 0 || this.specialAnim) return false;
    const ageIndex = isPlayer ? this.currentAge : this.enemyAge;
    const cost = (CONFIG.SPECIAL_XP_COST && CONFIG.SPECIAL_XP_COST[ageIndex]) || 0;
    const currentXp = isPlayer ? this.xp : this.enemyXp;
    if (currentXp < cost) return false;

    if (isPlayer) {
      this.xp -= cost;
      this.specialCooldown = CONFIG.SPECIAL_COOLDOWN;
    } else {
      this.enemyXp -= cost;
      this.enemySpecialCooldown = CONFIG.SPECIAL_COOLDOWN;
    }
    this._sound('special');
    this.specialAnim = { ageIndex, side, timer: 0, duration: 2.0, damageDealt: false };
    this.emit('special:activate', { side, ageIndex });
    return true;
  }

  useSpecial() { return this.useSpecialForSide('player'); }
  useEnemySpecial() { return this.useSpecialForSide('enemy'); }

  // Specials hit enemy units only; turrets and buildings are immune by design.
  dealSpecialDamage() {
    const anim = this.specialAnim;
    if (!anim) return;
    const dmg = CONFIG.AGES[anim.ageIndex].specialDamage;
    const targetSide = anim.side === 'player' ? 'enemy' : 'player';
    for (const u of this.units) {
      if (u.side === targetSide && u.alive) {
        u.takeDamage(dmg);
        this.emit('projectile:hit', { entity: u, damage: dmg, special: true });
      }
    }
  }

  updateSpecialAnim(dt) {
    if (!this.specialAnim) return;
    const anim = this.specialAnim;
    anim.timer += dt;
    if (anim.timer / anim.duration > 0.7 && !anim.damageDealt) {
      anim.damageDealt = true;
      this.dealSpecialDamage();
    }
    if (anim.timer >= anim.duration) {
      if (!anim.damageDealt) this.dealSpecialDamage();
      this.specialAnim = null;
    }
  }

  buySlot() {
    if (this.playerSlotsBought >= CONFIG.TURRET_SLOTS) return false;
    if (this.gold < CONFIG.TURRET_SLOT_COST) return false;
    this.gold -= CONFIG.TURRET_SLOT_COST;
    this.totalGoldSpent += CONFIG.TURRET_SLOT_COST;
    this.playerSlotsBought++;
    this._sound('spawn');
    return true;
  }

  playerTurrets() {
    return this.turrets.filter((t) => t.side === 'player' && t.alive);
  }

  sellTurret(turretIndex) {
    const playerTurrets = this.playerTurrets();
    if (turretIndex >= playerTurrets.length) return false;
    const t = playerTurrets[turretIndex];
    const refund = Math.floor(t.cost * CONFIG.TURRET_REFUND_RATE);
    this.gold += refund;
    t.alive = false;
    this.emit('gold:change', { side: 'player', amount: refund });
    this._sound('gold');
    return true;
  }

  getUnitUpgradeCost(unitIndex) {
    const tier = this.unitUpgrades[unitIndex] || 0;
    if (tier >= CONFIG.MAX_UPGRADE_TIER) return null;
    const age = CONFIG.AGES[this.currentAge];
    const baseCost = age.units[unitIndex].cost;
    return Math.round(baseCost * CONFIG.UNIT_UPGRADE_COSTS[tier + 1]);
  }

  upgradeUnit(unitIndex) {
    const tier = this.unitUpgrades[unitIndex] || 0;
    if (tier >= CONFIG.MAX_UPGRADE_TIER) return false;
    const cost = this.getUnitUpgradeCost(unitIndex);
    if (cost === null || this.gold < cost) return false;
    this.gold -= cost;
    this.totalGoldSpent += cost;
    this.unitUpgrades[unitIndex] = tier + 1;
    this._sound('evolve');
    return true;
  }

  // ---- per-frame update (same order as the original) ----
  update(dt) {
    if (this.gameOver || this.paused) return;

    this.gameTime += dt;
    if (CONFIG.PASSIVE_GOLD_RATE) {
      const pRate = CONFIG.PASSIVE_GOLD_RATE[this.currentAge] || 0;
      const eRate = (CONFIG.PASSIVE_GOLD_RATE[this.enemyAge] || 0)
        * (CONFIG.DIFFICULTIES[this.difficulty]?.enemyGoldMult || 1.0);
      this.gold += pRate * dt;
      this.enemyGold += eRate * dt;
    }
    if (this.specialCooldown > 0) this.specialCooldown -= dt;
    if (this.enemySpecialCooldown > 0) this.enemySpecialCooldown -= dt;
    if (this.heroCooldown > 0) this.heroCooldown -= dt;
    if (this.enemyHeroCooldown > 0) this.enemyHeroCooldown -= dt;
    this.updateSpecialAnim(dt);

    if (this.autoAI) this.ai.update(dt);
    if (this.autoPlayer) this._demoPlayer(dt);

    this.spatialHash.clear();
    for (const list of [this.units, this.turrets, this.buildings]) {
      for (const e of list) {
        if (e.alive) this.spatialHash.insert(e);
      }
    }

    for (const u of this.units) {
      const prevProj = this.projectilePool.active.length;
      const result = u.update(dt, this.units,
        u.side === 'player' ? this.enemyBase : this.playerBase,
        this.projectilePool, this.spatialHash);
      if (this.projectilePool.active.length > prevProj) {
        this.emit('projectile:fire', u);
        this._sound('fire');
      } else if (result === 'melee') {
        this.emit('projectile:hit', { entity: null, melee: true, attacker: u });
        this._sound('hit');
      }
    }

    for (const t of this.turrets) {
      const prevProj = this.projectilePool.active.length;
      t.update(dt, this.projectilePool, this.spatialHash);
      if (this.projectilePool.active.length > prevProj) {
        this.emit('projectile:fire', t);
        this._sound('fire');
      }
    }

    for (const p of this.projectilePool.active) {
      p.update(dt);
      const hits = p.checkHit([this.playerBase, this.enemyBase], this.spatialHash);
      if (hits.length > 0) {
        this._sound('hit');
        for (const hit of hits) this.emit('projectile:hit', hit);
      }
    }
    this.projectilePool.releaseDead();

    for (const b of this.buildings) {
      if (!b.alive) continue;
      const produced = b.update(dt, this.units);
      if (produced > 0) {
        if (b.side === 'player') this.gold += produced;
        else this.enemyGold += produced;
        this.emit('gold:change', { side: b.side, amount: produced });
      }
    }

    { // dead-unit cleanup with kill rewards
      let write = 0;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (!u.alive) {
          if (u.side === 'player') {
            this.enemyGold += u.goldReward * CONFIG.DIFFICULTIES[this.difficulty].enemyGoldMult;
            this.enemyXp += u.xpReward;
          } else {
            this.gold += u.goldReward;
            this.xp += u.xpReward;
            this.emit('xp:change', this.xp);
          }
          this._sound('death');
          this.emit('entity:death', u);
        } else {
          this.units[write++] = u;
        }
      }
      this.units.length = write;
    }

    {
      let write = 0;
      for (let i = 0; i < this.turrets.length; i++) {
        const t = this.turrets[i];
        if (!t.alive) {
          this._sound('death');
          this.emit('entity:death', t);
        } else {
          this.turrets[write++] = t;
        }
      }
      this.turrets.length = write;
    }

    {
      let write = 0;
      for (let i = 0; i < this.buildings.length; i++) {
        if (this.buildings[i].alive) this.buildings[write++] = this.buildings[i];
        else this.emit('entity:death', this.buildings[i]);
      }
      this.buildings.length = write;
    }

    if (this.playerBase.hp <= 0) {
      this.gameOver = true;
      this.winner = 'enemy';
      this.emit('game:over', { winner: 'enemy' });
    } else if (this.enemyBase.hp <= 0) {
      this.gameOver = true;
      this.winner = 'player';
      this.emit('game:over', { winner: 'player' });
    }
  }

  // Scripted player for demo mode: opens with turret + mine, then keeps a
  // mixed warband in the field and fires the special when affordable.
  _demoPlayer(dt) {
    this._demoTimer += dt;
    if (this._demoTimer < 1) return;
    this._demoTimer = 0;
    const age = CONFIG.AGES[this.currentAge];
    if (this.turrets.filter((t) => t.side === 'player').length === 0 && this.gold >= age.turrets[0].cost + 60) {
      this.spawnTurretForSide('player', 0);
    }
    if (this.getBuildingCount('player') === 0 && this.gold >= CONFIG.BUILDINGS[0].cost + 40) {
      this.buyBuildingForSide('player', 0);
    }
    const fielded = this.units.filter((u) => u.side === 'player' && u.alive).length;
    if (fielded < 4) {
      let idx = 0;
      for (let i = age.units.length - 1; i >= 0; i--) {
        if (this.gold >= age.units[i].cost) { idx = i; break; }
      }
      this.spawnUnitForSide('player', idx);
    }
    // Hold the special for a dramatic mid-battle moment: 30s in with an
    // enemy fielded force of 3+.
    const enemyField = this.units.filter((u) => u.side === 'enemy' && u.alive).length;
    if (this.gameTime > 30 && enemyField >= 3) this.useSpecialForSide('player');
  }

  // HUD state (matches hud.js contract).
  hudState() {
    const age = CONFIG.AGES[this.currentAge];
    const next = CONFIG.AGES[this.currentAge + 1];
    const spCost = (CONFIG.SPECIAL_XP_COST && CONFIG.SPECIAL_XP_COST[this.currentAge]) || 0;
    const hasSpXp = this.xp >= spCost;
    const spReady = this.specialCooldown <= 0 && hasSpXp && !this.specialAnim;
    const placed = this.playerTurrets();
    const FORMATIONS = ['Scatter', 'Line', 'Wedge'];
    return {
      gold: this.gold,
      xp: this.xp,
      ageIndex: this.currentAge,
      ageName: age.name,
      units: age.units.map((u, i) => {
        const tier = this.unitUpgrades[i] || 0;
        const upgCost = this.getUnitUpgradeCost(i);
        return {
          name: u.name, cost: u.cost, hotkey: String(i + 1), affordable: this.gold >= u.cost,
          tier, maxTier: CONFIG.MAX_UPGRADE_TIER,
          upgCost, upgAffordable: upgCost !== null && this.gold >= upgCost,
          tooltip: `HP ${Math.round(u.hp * CONFIG.UNIT_UPGRADE_HP_MULT[tier])} · DMG ${Math.round(u.damage * CONFIG.UNIT_UPGRADE_DMG_MULT[tier])} · RNG ${u.range} · T${tier}`,
        };
      }),
      hero: age.hero
        ? {
          name: age.hero.name, cost: age.hero.cost, hotkey: 'H',
          affordable: this.gold >= age.hero.cost && this.heroCooldown <= 0,
          cooldownSecs: this.heroCooldown > 0 ? Math.ceil(this.heroCooldown) : 0,
        }
        : null,
      evolve: next
        ? { label: `Evolve: ${next.name}`, cost: CONFIG.EVOLVE_XP[this.currentAge + 1], affordable: this.xp >= CONFIG.EVOLVE_XP[this.currentAge + 1] }
        : null,
      special: {
        name: age.specialName,
        ready: spReady,
        status: this.specialCooldown > 0 ? `${Math.ceil(this.specialCooldown)}s`
          : (!hasSpXp ? `${spCost} XP` : (this.specialAnim ? '...' : 'READY')),
        frac: this.specialAnim ? this.specialAnim.timer / this.specialAnim.duration
          : Math.max(0, Math.min(1, this.specialCooldown / CONFIG.SPECIAL_COOLDOWN)),
      },
      slots: {
        bought: this.playerSlotsBought, max: CONFIG.TURRET_SLOTS,
        cost: CONFIG.TURRET_SLOT_COST,
        affordable: this.gold >= CONFIG.TURRET_SLOT_COST && this.playerSlotsBought < CONFIG.TURRET_SLOTS,
        full: this.playerSlotsBought >= CONFIG.TURRET_SLOTS,
      },
      turrets: age.turrets.map((t) => ({
        name: t.name, cost: t.cost,
        placeable: this.gold >= t.cost && placed.length < this.playerSlotsBought,
      })),
      sell: placed.map((t) => ({
        name: t.name, refund: Math.floor(t.cost * CONFIG.TURRET_REFUND_RATE),
      })),
      buildings: CONFIG.BUILDINGS.map((b) => ({
        name: b.name, cost: b.cost, affordable: this.gold >= b.cost,
      })),
      speeds: [1, 2, 3].map((s) => ({ speed: s, active: this.gameSpeed === s })),
      formation: FORMATIONS[this.formationMode],
      paused: this.paused,
      over: this.gameOver ? {
        winner: this.winner,
        title: this.winner === 'player' ? 'VICTORY!' : 'DEFEAT!',
        stats: [
          `Time: ${Math.floor(this.gameTime)}s`,
          `Units Spawned: ${this.totalSpawned}`,
          `Age Reached: ${CONFIG.AGES[this.currentAge].name}`,
          `Gold Spent: ${Math.floor(this.totalGoldSpent)}`,
        ],
      } : null,
      hint: this.gameOver
        ? (this.winner === 'player' ? 'VICTORY — restart to replay' : 'DEFEAT — restart to retry')
        : CONFIG.HINT,
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }
}
