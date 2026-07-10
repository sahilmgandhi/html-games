class Base {
  constructor(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.hp = CONFIG.BASE_HP;
    this.maxHp = CONFIG.BASE_HP;
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
  constructor(x, y, side, ageIndex, unitIndex) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.ageIndex = ageIndex;
    this.unitIndex = unitIndex;

    const data = CONFIG.AGES[ageIndex].units[unitIndex];
    this.name = data.name;
    this.type = data.type;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.damage = data.damage;
    this.speed = data.speed;
    this.range = data.range;
    this.attackSpeed = data.attackSpeed;
    this.projectileSpeed = data.projectileSpeed || 0;
    this.splashRadius = data.splashRadius || 0;
    this.goldReward = data.goldReward;
    this.xpReward = data.xpReward;

    this.target = null;
    this.attackCooldown = 0;
    this.alive = true;
    this.hitFlash = 0;
  }

  getTarget(units, turrets, enemyBase) {
    let closest = null;
    let closestDist = Infinity;

    for (const t of turrets) {
      if (t.side !== this.side && t.alive) {
        const d = dist(this.x, this.y, t.x, t.y);
        if (d < closestDist) {
          closestDist = d;
          closest = t;
        }
      }
    }

    for (const u of units) {
      if (u.side !== this.side && u.alive) {
        const d = dist(this.x, this.y, u.x, u.y);
        if (d < closestDist) {
          closestDist = d;
          closest = u;
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

  update(dt, allUnits, allTurrets, enemyBase, projectiles) {
    if (!this.alive) return null;

    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const info = this.getTarget(allUnits, allTurrets, enemyBase);
    const target = info.target;

    if (info.dist <= this.range) {
      if (this.attackCooldown <= 0) {
        const isRanged = this.attack(target, projectiles);
        this.attackCooldown = this.attackSpeed;
        return isRanged ? 'ranged' : 'melee';
      }
    } else {
      const dir = Math.sign(target.x - this.x);
      this.x += this.speed * dir * dt * 60;
    }
    return null;
  }

  attack(target, projectiles) {
    if (this.type === 'ranged' || this.type === 'siege' || this.type === 'armored' || this.type === 'elite') {
      projectiles.push(new Projectile(
        this.x, this.y - 10,
        target.x, target.y,
        this.projectileSpeed,
        this.damage,
        this.side,
        this.splashRadius
      ));
    } else {
      target.takeDamage(this.damage);
    }
    return this.type !== 'melee' && this.type !== 'fast';
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.1;
    if (this.hp <= 0) {
      this.alive = false;
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

  update(dt, allUnits, projectiles) {
    if (!this.alive) return;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    let closest = null;
    let closestDist = Infinity;
    for (const u of allUnits) {
      if (u.side !== this.side && u.alive) {
        const d = dist(this.x, this.y, u.x, u.y);
        if (d < closestDist && d <= this.range) {
          closestDist = d;
          closest = u;
        }
      }
    }

    if (closest && this.attackCooldown <= 0) {
      projectiles.push(new Projectile(
        this.x, this.y - 15,
        closest.x, closest.y,
        this.projectileSpeed,
        this.damage,
        this.side,
        this.splashRadius
      ));
      this.attackCooldown = this.attackSpeed;
    }
  }
}

class Projectile {
  constructor(x, y, tx, ty, speed, damage, side, splashRadius) {
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
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.ttl -= dt;
    if (this.ttl <= 0 || this.x < -200 || this.x > CONFIG.WORLD.WIDTH + 200) {
      this.alive = false;
    }
  }

  checkHit(units, turrets, bases) {
    const hits = [];
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
