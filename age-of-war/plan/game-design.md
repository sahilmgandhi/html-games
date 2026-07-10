# Age of War — Game Design Document

## Overview
A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Two opposing bases face off across a horizontal battlefield. Players spawn units, build turrets, and evolve through five historical ages to unlock stronger units and special attacks. The goal is to destroy the enemy base.

## Core Mechanics

### Battlefield
- 2D horizontal lane, 2400px world width × 600px viewport
- Player base on the left (x=100), enemy base on the right (x=2300)
- Scrolling camera with mouse-edge detection and keyboard controls (WASD/arrows)

### Resources
- **Gold**: Earned passively (2/sec) and from killing enemy units. Used to spawn units and build turrets.
- **XP**: Earned passively (0.5/sec) and from killing enemy units. Used to evolve to the next age.

### Units
Each age has three unique units:
1. **Melee** — Close combat, sturdy, moderate damage
2. **Ranged/Fast/Siege** — Varies by age, fills a tactical niche
3. **Fast/Special** — High speed or special ability

Units auto-march toward the enemy base. When an enemy is within range, they stop and attack. Melee units deal direct damage; ranged units fire projectiles.

### Bases
- Each base has 5000 HP
- Units that reach the enemy base deal direct damage
- Evolving heals the base by 25%

### Turrets
- Defensive structures placed near the base
- Automatically fire at nearby enemies
- One turret type per age, sold when evolving

### Special Attacks
- Screen-wide AoE damage with a 30-second cooldown
- Damage scales with age (300 → 1200)

### Age Evolution
Players spend XP to advance to the next age, unlocking new units, turrets, and special attacks. Old-age turrets are sold on evolution.

## Five Ages

| Age | Units | Turret | Special | Special Damage |
|---|---|---|---|---|
| Stone Age | Clubman (melee), Slingshot (ranged), Raptor Rider (fast) | Egg Turret | Meteor Shower | 300 |
| Castle Age | Swordsman (melee), Archer (ranged), Cavalry (fast) | Arrow Tower | Arrow Volley | 450 |
| Renaissance | Pikeman (melee), Musketeer (ranged), Cannon (siege) | Cannon Emplacement | Artillery Strike | 600 |
| Modern Age | Rifleman (melee), Tank (armored), Helicopter (air) | Machine Gun Nest | Airstrike | 800 |
| Future Age | Laser Mech (melee), Super Soldier (ranged), Drone (fast) | Energy Turret | Orbital Laser | 1200 |

## Unit Stats Summary

### Stone Age
- **Clubman**: 50g, 120hp, 25dmg, speed 0.8, range 30
- **Slingshot**: 75g, 80hp, 15dmg, speed 0.6, range 180, projectile
- **Raptor Rider**: 100g, 90hp, 20dmg, speed 1.8, range 25

### Castle Age
- **Swordsman**: 80g, 180hp, 35dmg, speed 0.9, range 28
- **Archer**: 100g, 100hp, 22dmg, speed 0.65, range 200, projectile
- **Cavalry**: 150g, 150hp, 30dmg, speed 2.0, range 28

### Renaissance
- **Pikeman**: 100g, 220hp, 40dmg, speed 0.85, range 35
- **Musketeer**: 140g, 120hp, 35dmg, speed 0.6, range 220, projectile
- **Cannon**: 200g, 200hp, 60dmg, speed 0.4, range 250, splash 40

### Modern Age
- **Rifleman**: 150g, 280hp, 50dmg, speed 0.9, range 30
- **Tank**: 300g, 600hp, 70dmg, speed 0.5, range 180, projectile
- **Helicopter**: 250g, 200hp, 45dmg, speed 1.5, range 200, projectile

### Future Age
- **Laser Mech**: 250g, 400hp, 80dmg, speed 1.0, range 32
- **Super Soldier**: 300g, 250hp, 65dmg, speed 0.8, range 240, projectile
- **Drone**: 350g, 180hp, 55dmg, speed 2.2, range 200, projectile

## Evolution Costs
| From → To | XP Required |
|---|---|
| Stone → Castle | 500 |
| Castle → Renaissance | 1500 |
| Renaissance → Modern | 3500 |
| Modern → Future | 7000 |

## Win/Lose Conditions
- **Win**: Enemy base HP reaches 0
- **Lose**: Player base HP reaches 0
- Game over overlay with restart option
