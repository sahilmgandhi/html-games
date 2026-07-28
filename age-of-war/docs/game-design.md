# Age of War — Game Design Document

Design intent and mechanics. **Every number lives in [`balance.md`](balance.md)**, generated from
`js/config.js` — this document deliberately does not restate stats, so it cannot drift from them.

## Overview

A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Two opposing bases
face off across a horizontal battlefield. Players spawn units, build turrets, and evolve through
five historical ages to unlock stronger units, turrets, and special attacks. The goal is to destroy
the enemy base.

## Core Mechanics

### Battlefield

- 2D horizontal lane: the world is two viewports wide and one tall, so only horizontal scrolling
  does anything.
- Player base on the left, enemy base on the right; both stand on `CONFIG.GROUND_Y`.
- Scrolling camera with mouse-edge detection and keyboard controls (WASD/arrows), plus a minimap
  strip for jumping the camera.

### Resources

- **Gold** — from kills, a per-age passive trickle (`CONFIG.PASSIVE_GOLD_RATE`), and the Gold Mine
  building. Spends on units, turrets, turret slots, buildings, heroes, and unit upgrades.
- **XP** — from kills only. Spends on evolving and on special attacks.

The passive trickle scales with your current age, and the enemy's is additionally scaled by the
difficulty's gold multiplier. It exists so a player who loses their army can still recover.

### Units

Each age has three regular units plus a hero. Roles by tag:

| Role | Behaviour |
|---|---|
| `melee` | Closes to short range, deals damage directly |
| `ranged` | Stops at long range, fires a projectile |
| `fast` | Mounted; high speed, high cost, melee engagement |
| `siege` | Slow, long range, splash damage |
| `armored` | Slow, very high HP, heavy projectile |
| `elite` | Future-age-only prestige unit |
| `hero` | One at a time per side, on a cooldown; some carry a heal or damage aura |

Units auto-march toward the enemy base, stop when a target is in range, and prefer the nearest enemy
unit, then turret, then base. Each unit type can be upgraded through tiers that raise HP, damage,
and speed for a multiple of the unit's spawn cost.

### Bases

Units that reach the enemy base attack it directly. Evolving heals your own base by
`CONFIG.EVOLVE_HEAL`. A base at 0 HP ends the game.

### Turrets

- Slots sit beside the base. You start with one and can buy up to `CONFIG.TURRET_SLOTS`.
- Three turret variants per age; pick one per slot.
- Turrets auto-fire at the nearest enemy in range, have HP, and can be destroyed by enemy units.
- Selling refunds a fraction of the cost. Evolving sells your old-age turrets at that same refund —
  turrets do not retroactively upgrade.

### Buildings

Up to `CONFIG.MAX_BUILDINGS` per side, placed behind the base. A **Gold Mine** trickles gold; a
**Barracks** heals friendly units within its radius. Both have HP and can be destroyed.

### Special Attacks

A screen-wide attack on a cooldown that also costs XP, so it competes with evolving rather than
being free. It damages enemy **units only** — turrets and buildings are immune, which keeps it from
being a one-button answer to a fortified base. Name and damage are per-age.

### Age Evolution

Advancing to the next age unlocks that age's units, turrets, hero, and special. The XP cost is
deducted from your balance, so it competes directly with special attacks for the same currency.

### Difficulty

Three selectable difficulties scale the **enemy only** — HP, damage, gold income, and how often the
AI re-evaluates. The player's numbers never change.

## Win / Lose Conditions

- **Win**: enemy base HP reaches 0.
- **Lose**: player base HP reaches 0.
- Either shows a game-over overlay with a restart option.

## Debug Mode

A password-protected debug panel (SHA-256 gate) provides cheats: gold/XP grants, instant unit kills,
base heal, instant win, forced evolution, invincibility, speed toggle, and per-unit spawn buttons.
It is drawn by `renderer.drawDebugScreen` and its click handler lives in `game.handleDebugClick`;
the two layouts must stay in sync.
