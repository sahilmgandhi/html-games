# Age of War — Game Design Document

## Overview
A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Two opposing bases face off across a horizontal battlefield. Players spawn units, build turrets, and evolve through five historical ages to unlock stronger units, turrets, and special attacks. The goal is to destroy the enemy base.

## Core Mechanics

### Battlefield
- 2D horizontal lane, 2400px world width × 600px viewport height
- Player base on the left (x=100), enemy base on the right (x=2300)
- Ground level at `CONFIG.GROUND_Y = 450` (units/bases stand on this line)
- Scrolling camera with mouse-edge detection and keyboard controls (WASD/arrows)

### Resources
- **Gold**: Earned from killing enemy units (and from the Gold Mine building). Used to spawn units, buy turrets, and build structures.
- **XP**: Earned from killing enemy units. Used to evolve to the next age.
- There is no passive gold/XP trickle; all income comes from combat and buildings.

### Units
Each age has three regular units plus a hero. Regular unit roles:
1. **Melee** — Close combat, sturdy, moderate damage
2. **Ranged/Fast/Siege/Armored** — Fills a tactical niche by age
3. **Hero** — Powerful unit summoned on a 60-second cooldown, some grant auras

Units auto-march toward the enemy base. When an enemy is within range, they stop and attack. Melee/armored units deal direct damage; ranged/siege units fire projectiles; siege units deal splash damage.

### Bases
- Each base has 5000 HP (`CONFIG.BASE_HP`)
- Units that reach the enemy base deal direct damage
- Evolving heals the base by 25% (`CONFIG.EVOLVE_HEAL`)

### Turrets
- Up to 4 turret slots per side (`CONFIG.TURRET_SLOTS`), each slot costs 250 gold (`TURRET_SLOT_COST`)
- Three turret variants per age; pick one per slot
- Auto-fire at nearby enemies; sold at 50% refund (`TURRET_REFUND_RATE`)
- Turrets keep their age's stats after you evolve (only newly built turrets use the new age)

### Buildings
- **Gold Mine** (200g, 200hp) — produces 3 gold every 4 seconds
- **Barracks** (300g, 300hp) — heals nearby friendly units (2hp/s within radius 80)

### Special Attacks
- Screen-wide AoE damage, 40-second cooldown (`CONFIG.SPECIAL_COOLDOWN`)
- Damage scales with age (250 → 1000), and scales further with the hero/special tree
- Affects all enemy units on screen

### Age Evolution
Players spend a cumulative XP threshold to advance to the next age, unlocking new units, turrets, and special attacks. Old-age turrets are sold on evolution (refunded at 50%).

### Difficulty
Three selectable difficulties scale the enemy only:
| Difficulty | Enemy HP | Enemy Damage | Enemy Gold | AI Think Speed |
|---|---|---|---|---|
| Normal | 1.0× | 1.0× | 1.0× | 1.0× |
| Harder | 1.3× | 1.3× | 1.3× | 0.8× (faster) |
| Impossible | 2.0× | 2.0× | 2.0× | 0.6× (faster) |

## Five Ages

| Age | Units | Turrets | Special | Special Damage |
|---|---|---|---|---|
| Stone Age | Clubman (melee), Slingshot (ranged), Dino Rider (fast, mounted) | Rock Slingshot / Egg Automatic / Primit. Catapult | Meteor Shower | 250 |
| Castle Age | Swordsman (melee), Archer (ranged), Knight (fast, mounted) | Catapult / Fire Catapult / Oil | Arrow Volley | 400 |
| Renaissance | Dueler (melee), Musketeer (ranged), Cannoneer (siege) | Small Cannon / Large Cannon / Explos. Cannon | Artillery Strike | 550 |
| Modern Age | Melee Infantry (melee), Infantry (ranged), Tank (armored) | Single Turret / Rocket Turret / Double Turret | Airstrike | 700 |
| Future Age | God's Blade (melee), Blaster (ranged), War Machine (armored), Super Soldier (elite) | Titanium Shooter / Lazer Cannon / Ion Ray | Orbital Laser | 1000 |

Each age also has a unique hero (Shaman, Paladin, War Engineer, Commander, Titan) summoned on a 60-second cooldown.

## Unit Stats

### Stone Age
- **Clubman**: 15g, 55hp, 16dmg, speed 0.8, range 28
- **Slingshot**: 25g, 42hp, 12dmg, speed 0.6, range 150, projectile
- **Dino Rider**: 100g, 160hp, 40dmg, speed 1.8, range 30 (mounted)

### Castle Age
- **Swordsman**: 50g, 100hp, 32dmg, speed 0.9, range 25
- **Archer**: 75g, 80hp, 20dmg, speed 0.65, range 170, projectile
- **Knight**: 500g, 300hp, 60dmg, speed 1.4, range 30 (mounted)

### Renaissance
- **Dueler**: 200g, 200hp, 79dmg, speed 0.85, range 28
- **Musketeer**: 400g, 160hp, 40dmg, speed 0.6, range 180, projectile
- **Cannoneer**: 1000g, 600hp, 120dmg, speed 0.4, range 200, splash 40

### Modern Age
- **Melee Infantry**: 1500g, 350hp, 100dmg, speed 0.8, range 28
- **Infantry**: 2000g, 300hp, 60dmg, speed 0.7, range 170, projectile
- **Tank**: 7000g, 1200hp, 300dmg, speed 0.4, range 180, projectile (armored)

### Future Age
- **God's Blade**: 5000g, 1000hp, 250dmg, speed 0.9, range 35
- **Blaster**: 6000g, 800hp, 130dmg, speed 0.75, range 200, projectile
- **War Machine**: 20000g, 3000hp, 600dmg, speed 0.35, range 200, projectile (armored)
- **Super Soldier**: 150000g, 4000hp, 400dmg, speed 0.8, range 150, projectile (elite)

## Evolution Costs (cumulative XP)
| From → To | XP Required |
|---|---|
| Stone → Castle | 4000 |
| Castle → Renaissance | 14000 |
| Renaissance → Modern | 80000 |
| Modern → Future | 200000 |

## Win/Lose Conditions
- **Win**: Enemy base HP reaches 0
- **Lose**: Player base HP reaches 0
- Game over overlay with restart option

## Debug Mode
A password-protected debug panel (SHA-256 gate) provides cheats: gold/XP grants, instant unit kills, base heal, instant win, forced evolution, invincibility, speed toggle, and per-unit spawn buttons. The panel is 620×600 and laid out in `renderer.drawDebugScreen`; its click handler lives in `game.handleDebugClick` and must stay in sync with the renderer layout.
