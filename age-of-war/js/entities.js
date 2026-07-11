class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return cx * 73856093 + cy * 19349663;
  }

  _cellCoords(x, y) {
    return {
      cx: Math.floor(x / this.cellSize),
      cy: Math.floor(y / this.cellSize)
    };
  }

  insert(entity) {
    const { cx, cy } = this._cellCoords(entity.x, entity.y);
    const key = this._key(cx, cy);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  query(x, y, radius, side) {
    const results = [];
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this._key(cx, cy));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) {
          const e = cell[i];
          if (!e.alive) continue;
          if (side !== undefined && e.side === side) continue;
          const dx = e.x - x;
          const dy = e.y - y;
          if (dx * dx + dy * dy <= radius * radius) {
            results.push(e);
          }
        }
      }
    }
    return results;
  }

  queryRadius(x, y, radius) {
    const results = [];
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this._key(cx, cy));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) {
          const e = cell[i];
          if (!e.alive) continue;
          const dx = e.x - x;
          const dy = e.y - y;
          if (dx * dx + dy * dy <= radius * radius) {
            results.push(e);
          }
        }
      }
    }
    return results;
  }
}

class Base {
  constructor(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.hp = CONFIG.BASE_HP;
    this.maxHp = CONFIG.BASE_HP;
    this.displayHp = this.maxHp;
    this.width = CONFIG.BASE_WIDTH;
    this.height = CONFIG.BASE_HEIGHT;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  healFraction(frac) {
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * frac);
  }
}

class Unit {
  constructor(x, y, side, ageIndex, unitIndex, upgradeTier, isHero) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.ageIndex = ageIndex;
    this.unitIndex = unitIndex;
    this.upgradeTier = upgradeTier || 0;
    this.isHero = isHero || false;

    let data;
    if (isHero && CONFIG.AGES[ageIndex].hero) {
      data = CONFIG.AGES[ageIndex].hero;
    } else {
      data = CONFIG.AGES[ageIndex].units[unitIndex];
    }
    this.name = data.name;
    this.type = data.type;
    const hpMult = CONFIG.UNIT_UPGRADE_HP_MULT[this.upgradeTier] || 1;
    const dmgMult = CONFIG.UNIT_UPGRADE_DMG_MULT[this.upgradeTier] || 1;
    const spdMult = CONFIG.UNIT_UPGRADE_SPD_MULT[this.upgradeTier] || 1;
    this.hp = Math.round(data.hp * hpMult);
    this.maxHp = this.hp;
    this.damage = Math.round(data.damage * dmgMult);
    this.speed = data.speed * spdMult;
    this.range = data.range;
    this.attackSpeed = data.attackSpeed;
    this.projectileSpeed = data.projectileSpeed || 0;
    this.splashRadius = data.splashRadius || 0;
    this.goldReward = data.goldReward + (this.upgradeTier > 0 ? Math.round(data.goldReward * 0.3 * this.upgradeTier) : 0);
    this.xpReward = data.xpReward;
    this.heroData = isHero ? data : null;

    this.target = null;
    this.attackCooldown = 0;
    this.alive = true;
    this.hitFlash = 0;
    this.dying = false;
    this.deathTimer = 0;
    this.walkPhase = 0;
    this.displayHp = this.maxHp;
  }

  getTarget(enemyUnits, enemyTurrets, enemyBase, spatialHash) {
    let closest = null;
    let closestDist = Infinity;

    if (spatialHash) {
      const maxRange = Math.max(this.range, 300);
      const nearby = spatialHash.query(this.x, this.y, maxRange, this.side);
      for (let i = 0; i < nearby.length; i++) {
        const e = nearby[i];
        const d = dist(this.x, this.y, e.x, e.y);
        if (d < closestDist) {
          closestDist = d;
          closest = e;
        }
      }
    } else {
      for (let i = 0; i < enemyTurrets.length; i++) {
        const t = enemyTurrets[i];
        if (t.side !== this.side && t.alive) {
          const d = dist(this.x, this.y, t.x, t.y);
          if (d < closestDist) {
            closestDist = d;
            closest = t;
          }
        }
      }
      for (let i = 0; i < enemyUnits.length; i++) {
        const u = enemyUnits[i];
        if (u.side !== this.side && u.alive) {
          const d = dist(this.x, this.y, u.x, u.y);
          if (d < closestDist) {
            closestDist = d;
            closest = u;
          }
        }
      }
    }

    const baseDist = dist(this.x, this.y, enemyBase.x, enemyBase.y);
    if (baseDist < closestDist) {
      return { target: enemyBase, dist: baseDist, type: 'base' };
    }

    if (closest) {
      return { target: closest, dist: closestDist, type: closest instanceof Unit ? 'unit' : 'turret' };
    }

    return { target: enemyBase, dist: baseDist, type: 'base' };
  }

  update(dt, allUnits, allTurrets, enemyBase, projectilePool, spatialHash) {
    if (!this.alive) return null;

    if (this.dying) {
      this.deathTimer += dt;
      if (this.deathTimer > 0.35) {
        this.alive = false;
      }
      return null;
    }

    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.isHero && this.heroData && this.heroData.auraHeal) {
      this.auraTimer = (this.auraTimer || 0) + dt;
      if (this.auraTimer >= 1) {
        this.auraTimer = 0;
        const r = this.heroData.auraRadius || 120;
        for (const u of allUnits) {
          if (u.side === this.side && u.alive && u !== this) {
            const d = dist(this.x, this.y, u.x, u.y);
            if (d <= r) {
              u.hp = Math.min(u.maxHp, u.hp + this.heroData.auraHeal);
            }
          }
        }
      }
    }

    const info = this.getTarget(allUnits, allTurrets, enemyBase, spatialHash);
    const target = info.target;

    if (info.dist <= this.range) {
      if (this.attackCooldown <= 0) {
        const isRanged = this.attack(target, projectilePool);
        this.attackCooldown = this.attackSpeed;
        return isRanged ? 'ranged' : 'melee';
      }
    } else {
      const dir = Math.sign(target.x - this.x);
      this.x += this.speed * dir * dt * 60;
      this.walkPhase += dt * this.speed * 4;
    }
    this.displayHp += (this.hp - this.displayHp) * Math.min(1, dt * 8);
    return null;
  }

  attack(target, projectilePool) {
    if (this.type === 'ranged' || this.type === 'siege' || this.type === 'armored' || this.type === 'elite') {
      projectilePool.acquire(
        this.x, this.y - 10,
        target.x, target.y,
        this.projectileSpeed,
        this.damage,
        this.side,
        this.splashRadius
      );
    } else {
      target.takeDamage(this.damage);
    }
    return this.type !== 'melee' && this.type !== 'fast';
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.1;
    if (this.hp <= 0 && !this.dying) {
      this.dying = true;
    }
  }
}

class Turret {
  constructor(x, y, side, ageIndex, turretIndex) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.ageIndex = ageIndex;
    this.turretIndex = turretIndex;

    const data = CONFIG.AGES[ageIndex].turrets[turretIndex];
    this.name = data.name;
    this.cost = data.cost;
    this.damage = data.damage;
    this.range = data.range;
    this.attackSpeed = data.attackSpeed;
    this.projectileSpeed = data.projectileSpeed;
    this.splashRadius = data.splashRadius || 0;
    this.hp = data.hp;
    this.maxHp = data.hp;

    this.attackCooldown = 0;
    this.alive = true;
    this.hitFlash = 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.1;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  update(dt, allUnits, projectilePool, spatialHash) {
    if (!this.alive) return;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    let closest = null;
    let closestDist = Infinity;

    if (spatialHash) {
      const nearby = spatialHash.query(this.x, this.y, this.range, this.side);
      for (let i = 0; i < nearby.length; i++) {
        const u = nearby[i];
        if (u instanceof Unit) {
          const d = dist(this.x, this.y, u.x, u.y);
          if (d < closestDist && d <= this.range) {
            closestDist = d;
            closest = u;
          }
        }
      }
    } else {
      for (const u of allUnits) {
        if (u.side !== this.side && u.alive) {
          const d = dist(this.x, this.y, u.x, u.y);
          if (d < closestDist && d <= this.range) {
            closestDist = d;
            closest = u;
          }
        }
      }
    }

    if (closest && this.attackCooldown <= 0) {
      projectilePool.acquire(
        this.x, this.y - 15,
        closest.x, closest.y,
        this.projectileSpeed,
        this.damage,
        this.side,
        this.splashRadius
      );
      this.attackCooldown = this.attackSpeed;
    }
  }
}

class Building {
  constructor(x, y, side, buildingIndex) {
    const data = CONFIG.BUILDINGS[buildingIndex];
    this.x = x;
    this.y = y;
    this.side = side;
    this.buildingIndex = buildingIndex;
    this.name = data.name;
    this.produceAmount = data.produceAmount || 0;
    this.produceInterval = data.produceInterval || 0;
    this.healAmount = data.healAmount || 0;
    this.healRadius = data.healRadius || 0;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.alive = true;
    this.timer = 0;
    this.hitFlash = 0;
  }

  update(dt, allUnits) {
    if (!this.alive) return;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    let produced = 0;
    if (this.produceInterval > 0) {
      this.timer += dt;
      while (this.timer >= this.produceInterval) {
        this.timer -= this.produceInterval;
        produced += this.produceAmount;
      }
    }
    if (this.healAmount > 0) {
      for (const u of allUnits) {
        if (u.side === this.side && u.alive) {
          const d = dist(this.x, this.y, u.x, u.y);
          if (d <= this.healRadius) {
            u.hp = Math.min(u.maxHp, u.hp + this.healAmount * dt);
          }
        }
      }
    }
    return produced;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.1;
    if (this.hp <= 0) this.alive = false;
  }
}

class Projectile {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.damage = 0;
    this.side = '';
    this.splashRadius = 0;
    this.alive = false;
    this.ttl = 0;
    this.vx = 0;
    this.vy = 0;
  }

  init(x, y, tx, ty, speed, damage, side, splashRadius) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.side = side;
    this.splashRadius = splashRadius || 0;
    this.alive = true;
    this.ttl = 3;

    const dx = tx - x;
    const dy = ty - y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / d) * speed;
    this.vy = (dy / d) * speed;
    return this;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.ttl -= dt;
    if (this.ttl <= 0 || this.x < -200 || this.x > CONFIG.WORLD.WIDTH + 200) {
      this.alive = false;
    }
  }

  checkHit(units, turrets, bases, spatialHash) {
    const hits = [];
    const hitRadius = this.splashRadius > 0 ? this.splashRadius : 15;

    if (spatialHash) {
      const nearby = spatialHash.queryRadius(this.x, this.y, hitRadius);
      for (let i = 0; i < nearby.length; i++) {
        const e = nearby[i];
        if (e.side !== this.side && dist(this.x, this.y, e.x, e.y) < hitRadius) {
          e.takeDamage(this.damage);
          hits.push({ entity: e, damage: this.damage });
        }
      }
      if (hits.length > 0) {
        this.alive = false;
        return hits;
      }
    } else {
      for (const u of units) {
        if (u.side !== this.side && u.alive) {
          if (dist(this.x, this.y, u.x, u.y) < 15) {
            if (this.splashRadius > 0) {
              for (const u2 of units) {
                if (u2.side !== this.side && u2.alive) {
                  if (dist(this.x, this.y, u2.x, u2.y) <= this.splashRadius) {
                    u2.takeDamage(this.damage);
                    hits.push({ entity: u2, damage: this.damage });
                  }
                }
              }
              for (const t of turrets) {
                if (t.side !== this.side && t.alive) {
                  if (dist(this.x, this.y, t.x, t.y) <= this.splashRadius) {
                    t.takeDamage(this.damage);
                    hits.push({ entity: t, damage: this.damage });
                  }
                }
              }
            } else {
              u.takeDamage(this.damage);
              hits.push({ entity: u, damage: this.damage });
            }
            this.alive = false;
            return hits;
          }
        }
      }
      for (const t of turrets) {
        if (t.side !== this.side && t.alive) {
          if (dist(this.x, this.y, t.x, t.y) < 15) {
            t.takeDamage(this.damage);
            hits.push({ entity: t, damage: this.damage });
            this.alive = false;
            return hits;
          }
        }
      }
    }

    if (bases) {
      for (const b of bases) {
        if (b.side !== this.side) {
          if (dist(this.x, this.y, b.x, b.y) < 25) {
            b.takeDamage(this.damage);
            hits.push({ entity: b, damage: this.damage });
            this.alive = false;
            return hits;
          }
        }
      }
    }
    return hits;
  }
}

class ProjectilePool {
  constructor(size) {
    this.pool = [];
    this.active = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(new Projectile());
    }
  }

  acquire(x, y, tx, ty, speed, damage, side, splashRadius) {
    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
    } else {
      p = new Projectile();
    }
    p.init(x, y, tx, ty, speed, damage, side, splashRadius);
    this.active.push(p);
    return p;
  }

  releaseDead() {
    let write = 0;
    for (let i = 0; i < this.active.length; i++) {
      if (this.active[i].alive) {
        this.active[write++] = this.active[i];
      } else {
        this.pool.push(this.active[i]);
      }
    }
    this.active.length = write;
  }
}
