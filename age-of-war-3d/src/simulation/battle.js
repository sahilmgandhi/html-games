// BattleSim: headless match orchestrator for age-of-war-3d (Stone Age MVP).
// Mirrors ../age-of-war/js/game.js update/spawn/evolve/special logic, minus all
// rendering, input, DOM particles, achievements and save/load. Pure logic plus
// an optional event sink, so it runs in Node (smoke tests) and in the browser.
//
// Slot math (turret/building x/y) is identical to the original so combat
// distances match. Lane depth `z` is visual-only, dealt from the seeded RNG.

import { CONFIG, toMeters } from './config.js';
import {
  SpatialHash, Base, Unit, Turret, Building, ProjectilePool,
} from './entities.js';
import { AI } from './ai.js';
import { mulberry32 } from './rng.js';
import { BalanceTracker } from './balance.js';

// Per-age special durations, identical to the original.
const SPECIAL_DURATIONS = [2.0, 1.5, 2.0, 2.5, 1.5];
// Distinct stream for lane jitter/AI so seeded gameplay randomness and AI
// decisions do not share one sequence.
const AI_SEED_XOR = 0x9e3779b9;

export class BattleSim {
  constructor(opts = {}) {
    this.difficulty = opts.difficulty ?? 0;
    this.seed = opts.seed ?? 1;
    this.rng = opts.rng || mulberry32(this.seed);
    this.aiRng = opts.aiRng || mulberry32((this.seed ^ AI_SEED_XOR) >>> 0);
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
    this.ai = new AI(this, this.aiRng);
    this.balance = new BalanceTracker();

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
    this.gameTime = 0;
    this.totalSpawned = 0;
    this.totalGoldSpent = 0;
    this.playerLowestHp = CONFIG.BASE_HP;
    this._demoTimer = 0;
    this.balance?.reset();
  }

  // Difficulty index into CONFIG.DIFFICULTIES; changing it restarts the
  // match (same contract as the original's pre-match select). restart()
  // rebuilds the AI so the new think interval and special-use odds apply.
  setDifficulty(i) {
    const n = CONFIG.DIFFICULTIES.length;
    this.difficulty = ((i % n) + n) % n;
    this.restart();
  }

  restart() {
    const difficulty = this.difficulty;    this.resetState();
    this.difficulty = difficulty;
    // Reseed both streams so a seeded match replays identically.
    this.rng = mulberry32(this.seed);
    this.aiRng = mulberry32((this.seed ^ AI_SEED_XOR) >>> 0);
    this.ai = new AI(this, this.aiRng);
    // Same music restart as the original; no evolve jingle.
    try { this.audio?.setSuspended?.(false); } catch { /* audio is cosmetic */ }
    try { this.audio?.stopMusic?.(); } catch { /* audio is cosmetic */ }
    try { this.audio?.startMusic?.(this.currentAge); } catch { /* audio is cosmetic */ }
    // Lets the render layer drop pending FX and rebuild age meshes.
    this.emit('game:restart', { seed: this.seed });
  }

  emit(name, payload) {
    try { this.events?.emit(name, payload); } catch { /* render sink must never break sim */ }
  }

  _sound(name, e = null) {
    // Positional battle mix: entities carry sim px in x, metres in z.
    const at = e && Number.isFinite(e.x)
      ? { x: toMeters(e.x), z: e.z || 0 }
      : null;
    try { this.audio?.play(name, at); } catch { /* audio is cosmetic */ }
  }

  // ---- slots (identical math to the original) ----
  // All turret slots share one ground position per side: the renderer seats
  // each turret on its shared tower mount, so sim Y/Z stay level (an old
  // revision sank each slot by TURRET_SLOT_SPACING and buried the turrets).
  computeSlotPositions(baseX, dir) {
    const positions = [];
    for (let i = 0; i < CONFIG.TURRET_SLOTS; i++) {
      positions.push({
        x: baseX + dir * CONFIG.TURRET_SLOT_OFFSET_X,
        y: CONFIG.GROUND_Y,
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

    const u = new Unit(
      spawnX, CONFIG.GROUND_Y, side,
      isPlayer ? this.currentAge : this.enemyAge, unitIndex,
      isPlayer ? (this.unitUpgrades[unitIndex] || 0) : 0, false, this.laneZ(),
    );
    if (!isPlayer) this.applyEnemyScaling(u, data.hp, data.damage);
    this.units.push(u);
    if (isPlayer) {
      this.totalSpawned++;
      this._sound('spawn', u);
      this._sound('ui_click');
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
    this._sound('special', u);
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
    if (isPlayer) this._sound('spawn', t);
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
    if (isPlayer) this._sound('spawn', b);
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
      try { this.audio?.updateMusicAge?.(this.currentAge); } catch { /* audio is cosmetic */ }
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
    this.specialAnim = {
      ageIndex, side, timer: 0,
      duration: SPECIAL_DURATIONS[ageIndex],
      damageDealt: false,
      particles: this.generateSpecialParticles(ageIndex),
    };
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

  // Particle payloads mirror the original's generateSpecialParticles so
  // renderers can draw each special's trajectory. All randomness comes from
  // the seeded gameplay stream. Impact bursts and screen shake stay in the
  // view layer (the headless sim has neither particles nor renderer).
  generateSpecialParticles(ageIndex) {
    const particles = [];
    const W = CONFIG.WORLD.WIDTH;
    const r = () => this.rng();
    switch (ageIndex) {
      case 0: // Meteor Shower
        for (let i = 0; i < 6; i++) {
          particles.push({
            x: 200 + r() * (W - 400),
            y: -50 - r() * 100,
            vy: 3 + r() * 2,
            vx: (r() - 0.5) * 0.5,
            size: 6 + r() * 6,
            trail: [],
          });
        }
        break;
      case 1: // Arrow Volley
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: 300 + r() * (W - 600),
            y: -30 - r() * 60,
            vy: 4 + r() * 1.5,
            vx: -0.5 + r() * -1,
            size: 8,
            angle: 0,
          });
        }
        break;
      case 2: // Artillery Strike
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: 300 + r() * (W - 600),
            y: -40,
            vy: 3.5 + r(),
            vx: (r() - 0.5) * 0.3,
            size: 5,
            exploded: false,
            explosionRadius: 0,
          });
        }
        break;
      case 3: // Airstrike
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: -100 - i * 200,
            y: 60 + i * 30,
            vx: 5 + r(),
            vy: 0,
            size: 1,
            dropped: false,
            bombs: [],
          });
        }
        break;
      case 4: // Orbital Laser
        particles.push({
          x: W / 2,
          sweepX: 0,
          width: 3,
          charging: true,
          chargeTimer: 0,
          chargeDuration: 0.6,
        });
        break;
    }
    return particles;
  }

  updateSpecialAnim(dt) {
    if (!this.specialAnim) return;
    const anim = this.specialAnim;
    anim.timer += dt;
    const progress = anim.timer / anim.duration;

    switch (anim.ageIndex) {
      case 0: // Meteor Shower
        for (const p of anim.particles) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          p.vy += 4 * dt; // gravity
        }
        if (progress > 0.7 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 1: // Arrow Volley
        for (const p of anim.particles) {
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          p.angle = Math.atan2(p.vy, p.vx);
        }
        if (progress > 0.5 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 2: // Artillery Strike
        for (const p of anim.particles) {
          if (!p.exploded) {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.vy += 2 * dt;
            if (p.y >= CONFIG.GROUND_Y) p.exploded = true;
          } else {
            p.explosionRadius = Math.min(p.explosionRadius + dt * 200, 50);
          }
        }
        if (progress > 0.6 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 3: // Airstrike
        for (const plane of anim.particles) {
          plane.x += plane.vx * dt * 60;
          if (!plane.dropped
            && plane.x > CONFIG.WORLD.WIDTH * 0.3 + this.rng() * CONFIG.WORLD.WIDTH * 0.4) {
            plane.dropped = true;
            plane.bombs.push({
              x: plane.x, y: plane.y,
              vy: 0, exploded: false, explosionRadius: 0,
            });
          }
          for (const bomb of plane.bombs) {
            if (!bomb.exploded) {
              bomb.y += bomb.vy * dt * 60;
              bomb.vy += 5 * dt;
              if (bomb.y >= CONFIG.GROUND_Y) bomb.exploded = true;
            } else {
              bomb.explosionRadius = Math.min(bomb.explosionRadius + dt * 180, 40);
            }
          }
        }
        if (progress > 0.7 && !anim.damageDealt) {
          anim.damageDealt = true;
          this.dealSpecialDamage();
        }
        break;

      case 4: { // Orbital Laser: charge, then sweep; damage lands after the sweep
        const laser = anim.particles[0];
        if (laser.charging) {
          laser.chargeTimer += dt;
          if (laser.chargeTimer >= laser.chargeDuration) {
            laser.charging = false;
            laser.sweepX = 0;
          }
        } else {
          laser.sweepX += dt * 3000;
          laser.width = 3 + Math.sin(anim.timer * 20) * 2;
          if (laser.sweepX > CONFIG.WORLD.WIDTH && !anim.damageDealt) {
            anim.damageDealt = true;
            this.dealSpecialDamage();
          }
        }
        break;
      }
    }

    if (progress >= 1.0) {
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
    this._sound('gold', t);
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
    this._sound('ui_click');
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
        this._sound('fire', u);
      } else if (result === 'melee') {
        this.emit('projectile:hit', { entity: null, melee: true, attacker: u });
        this._sound('hit', u);
      }
    }

    for (const t of this.turrets) {
      const prevProj = this.projectilePool.active.length;
      t.update(dt, this.projectilePool, this.spatialHash);
      if (this.projectilePool.active.length > prevProj) {
        this.emit('projectile:fire', t);
        this._sound('fire', t);
      }
    }

    for (const p of this.projectilePool.active) {
      p.update(dt);
      const hits = p.checkHit([this.playerBase, this.enemyBase], this.spatialHash);
      if (hits.length > 0) {
        // Plate and stone ring: anything armored or structural clangs.
        const clang = hits.some((h) => h.entity && (!(h.entity instanceof Unit) ||
          h.entity.isHero || h.entity.type === 'armored' ||
          h.entity.type === 'siege' || h.entity.type === 'elite'));
        this._sound(clang ? 'clang' : 'hit', hits.find((h) => h.entity)?.entity ?? p);
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
          this._sound(u.maxHp >= 1200 ? 'thud' : 'death', u);
          this._sound('gold', u);
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
          this._sound('thud', t); // structural collapse, not a body drop
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

    this.playerBase.displayHp += (this.playerBase.hp - this.playerBase.displayHp)
      * Math.min(1, dt * 8);
    this.enemyBase.displayHp += (this.enemyBase.hp - this.enemyBase.displayHp)
      * Math.min(1, dt * 8);
    if (this.playerBase.hp < this.playerLowestHp) this.playerLowestHp = this.playerBase.hp;

    this.balance.update(this);
  }

  // Scripted player for the spectate bot: the same competent policy as the
  // winnability bar (mine, barracks, melee upgrades, hero, special, evolve,
  // mass melee), once per second. Every call is internally gold-gated.
  _demoPlayer(dt) {
    this._demoTimer += dt;
    if (this._demoTimer < 1) return;
    this._demoTimer = 0;
    this.buyBuilding(0); // Gold Mine when affordable (no-op otherwise)
    this.buyBuilding(1); // Barracks when affordable
    this.upgradeUnit(0); // melee tiers when affordable
    this.spawnHero('player');
    this.useSpecial();
    this.evolve();
    this.spawnUnit(0);
  }

  // HUD state (matches hud.js contract).
  hudState() {
    const age = CONFIG.AGES[this.currentAge];
    const next = CONFIG.AGES[this.currentAge + 1];
    const spCost = (CONFIG.SPECIAL_XP_COST && CONFIG.SPECIAL_XP_COST[this.currentAge]) || 0;
    const hasSpXp = this.xp >= spCost;
    const spReady = this.specialCooldown <= 0 && hasSpXp && !this.specialAnim;
    const placed = this.playerTurrets();
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
      difficulty: {
        index: this.difficulty,
        name: CONFIG.DIFFICULTIES[this.difficulty].name,
        count: CONFIG.DIFFICULTIES.length,
      },
      bot: this.autoPlayer,
      paused: this.paused,
      base: { frac: this.playerBase.hp / this.playerBase.maxHp },
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
