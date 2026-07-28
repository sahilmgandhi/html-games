# Age of War — Balance Reference

<!-- GENERATED FILE — do not edit by hand. Change `js/config.js`, then run `npm run docs`. -->

Every number below is read straight from `js/config.js`. `tests/docs.test.js` fails if this
file drifts from the config, so a rebalance without `npm run docs` breaks the suite.

## Difficulty

Scaling applies to enemy units and enemy turrets alike; the player is never scaled.

| Difficulty | Enemy HP | Enemy damage | Enemy gold | AI think interval |
|---|---|---|---|---|
| Normal | 1× | 1× | 1× | 1× |
| Harder | 1.15× | 1.15× | 1.1× | 0.8× (faster) |
| Impossible | 1.3× | 1.3× | 1.2× | 0.6× (faster) |

## Economy

| Constant | Value |
|---|---|
| Base HP | 1,000 |
| Starting gold | 200 |
| Starting XP | 0 |
| Passive gold per second, by age | 2 / 4 / 8 / 16 / 32 |
| Evolution base heal | 25% |
| Special attack cooldown | 40s |
| Hero cooldown | 60s |
| Turret slots | 4 |
| Turret slot cost | 250g |
| Turret sell refund | 50% |
| Max buildings | 4 |
| AI think interval | 2500ms |

### Unit upgrades

Each unit type upgrades up to tier 2. Cost is a multiple of the unit's spawn cost.

| Tier | Cost | HP | Damage | Speed |
|---|---|---|---|---|
| Base | — | 1× | 1× | 1× |
| 1 | 1.5× unit cost | 1.3× | 1.25× | 1.05× |
| 2 | 2.5× unit cost | 1.75× | 1.6× | 1.1× |

### Buildings

| Building | Cost | HP | Effect |
|---|---|---|---|
| Gold Mine | 200g | 200 | 3g every 4s |
| Barracks | 300g | 300 | heals 2hp/s within 80px |

## Ages

| Age | XP to unlock | Special | Special damage | Special XP cost | Hero |
|---|---|---|---|---|---|
| Stone Age | — (start) | Meteor Shower | 250 | 100 | Shaman |
| Castle Age | 1,500 | Arrow Volley | 400 | 250 | Paladin |
| Renaissance | 5,000 | Artillery Strike | 550 | 600 | War Engineer |
| Modern Age | 15,000 | Airstrike | 700 | 1,500 | Commander |
| Future Age | 45,000 | Orbital Laser | 1,000 | 3,000 | Titan |

### Stone Age

**Units**

| Unit | Role | Cost | HP | Damage | Speed | Range | Attack every | Gold reward | XP reward | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Clubman | melee | 15 | 55 | 16 | 0.8 | 28 | 1s | 20 | 50 | — |
| Slingshot | ranged | 25 | 42 | 12 | 0.6 | 150 | 1.2s | 33 | 75 | projectile 4 |
| Dino Rider | fast | 100 | 160 | 40 | 1.8 | 30 | 0.8s | 130 | 200 | — |
| Shaman | hero (melee) | 300 | 250 | 45 | 0.9 | 35 | 0.9s | 400 | 400 | aura r120, heal 3/s |

**Turrets**

| Turret | Cost | HP | Damage | Range | Attack every | Notes |
|---|---|---|---|---|---|---|
| Rock Slingshot | 100 | 150 | 12 | 200 | 0.75s | — |
| Egg Automatic | 200 | 200 | 5 | 180 | 0.28s | — |
| Primit. Catapult | 500 | 400 | 25 | 250 | 1.75s | splash 30 |

### Castle Age

**Units**

| Unit | Role | Cost | HP | Damage | Speed | Range | Attack every | Gold reward | XP reward | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Swordsman | melee | 50 | 100 | 32 | 0.9 | 25 | 1s | 65 | 100 | — |
| Archer | ranged | 75 | 80 | 20 | 0.65 | 170 | 1.3s | 98 | 150 | projectile 5 |
| Knight | fast | 500 | 300 | 60 | 1.4 | 30 | 1.1s | 650 | 400 | — |
| Paladin | hero (melee) | 800 | 500 | 80 | 1 | 30 | 0.9s | 1,000 | 600 | aura r140, buff 1.2× |

**Turrets**

| Turret | Cost | HP | Damage | Range | Attack every | Notes |
|---|---|---|---|---|---|---|
| Catapult | 500 | 400 | 40 | 250 | 1.75s | — |
| Fire Catapult | 750 | 500 | 50 | 250 | 1.75s | splash 25 |
| Oil | 1,000 | 600 | 4 | 180 | 0.5s | splash 50 |

### Renaissance

**Units**

| Unit | Role | Cost | HP | Damage | Speed | Range | Attack every | Gold reward | XP reward | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Dueler | melee | 200 | 200 | 79 | 0.85 | 28 | 1s | 260 | 200 | — |
| Musketeer | ranged | 400 | 160 | 40 | 0.6 | 180 | 1.5s | 520 | 300 | projectile 6 |
| Cannoneer | siege | 1,000 | 600 | 120 | 0.4 | 200 | 2.5s | 1,300 | 500 | projectile 4, splash 40 |
| War Engineer | hero (siege) | 2,500 | 800 | 180 | 0.5 | 220 | 2s | 3,200 | 1,000 | projectile 5, splash 50 |

**Turrets**

| Turret | Cost | HP | Damage | Range | Attack every | Notes |
|---|---|---|---|---|---|---|
| Small Cannon | 1,500 | 600 | 30 | 300 | 1.75s | — |
| Large Cannon | 3,000 | 800 | 70 | 300 | 1.75s | splash 20 |
| Explos. Cannon | 6,000 | 1,000 | 100 | 300 | 1.75s | splash 35 |

### Modern Age

**Units**

| Unit | Role | Cost | HP | Damage | Speed | Range | Attack every | Gold reward | XP reward | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Melee Infantry | melee | 1,500 | 350 | 100 | 0.8 | 28 | 0.9s | 1,950 | 400 | — |
| Infantry | ranged | 2,000 | 300 | 60 | 0.7 | 170 | 1.2s | 2,600 | 600 | projectile 7 |
| Tank | armored | 7,000 | 1,200 | 300 | 0.4 | 180 | 2s | 9,100 | 1,500 | projectile 8 |
| Commander | hero (ranged) | 12,000 | 1,500 | 200 | 0.7 | 220 | 1s | 16,000 | 2,500 | projectile 8, aura r160, buff 1.3× |

**Turrets**

| Turret | Cost | HP | Damage | Range | Attack every | Notes |
|---|---|---|---|---|---|---|
| Single Turret | 7,000 | 800 | 70 | 300 | 1s | — |
| Rocket Turret | 9,000 | 900 | 100 | 300 | 1.25s | — |
| Double Turret | 14,000 | 1,000 | 70 | 300 | 0.55s | — |

### Future Age

**Units**

| Unit | Role | Cost | HP | Damage | Speed | Range | Attack every | Gold reward | XP reward | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| God's Blade | melee | 5,000 | 1,000 | 250 | 0.9 | 35 | 0.8s | 6,500 | 1,000 | — |
| Blaster | ranged | 6,000 | 800 | 130 | 0.75 | 200 | 1s | 7,800 | 1,500 | projectile 9 |
| War Machine | armored | 20,000 | 3,000 | 600 | 0.35 | 200 | 2.5s | 26,000 | 3,000 | projectile 8 |
| Super Soldier | elite | 150,000 | 4,000 | 400 | 0.8 | 150 | 1s | 200,000 | 5,000 | projectile 10 |
| Titan | hero (armored) | 40,000 | 5,000 | 800 | 0.5 | 200 | 1.5s | 50,000 | 6,000 | projectile 10, splash 60 |

**Turrets**

| Turret | Cost | HP | Damage | Range | Attack every | Notes |
|---|---|---|---|---|---|---|
| Titanium Shooter | 24,000 | 1,000 | 100 | 250 | 1s | — |
| Lazer Cannon | 40,000 | 1,200 | 40 | 300 | 0.25s | — |
| Ion Ray | 100,000 | 1,500 | 60 | 400 | 0.25s | — |
