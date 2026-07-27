# Age of War

A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Built entirely in HTML5 Canvas with no external dependencies.

## How to Run

```bash
cd age-of-war
python3 -m http.server 8081
```

Open http://localhost:8081 in your browser.

## Tests

```bash
npm test
```

Runs the headless harness (`test-runner.js`), which loads the real game files and drives
simulated frames — no browser required.

## How to Play

Pick a difficulty on the title screen, then click anywhere to start.

- **Spawn units** by clicking their buttons in the bottom HUD (or press `1`–`9`)
- **Upgrade a unit type** with the small `↑` button beside its spawn button — two tiers, each
  raising HP, damage, and speed
- **Evolve** to the next age with the Evolve button (costs XP, heals your base 25%)
- **Special attack** damages every enemy *unit* on the map. It costs XP *and* has a 40s
  cooldown; turrets and buildings are immune.
- **Turrets** are placed into slots beside your base. You start with one slot and can buy up to
  four. Turrets have HP, can be destroyed by the enemy, and can be sold back for half cost.
- **Buildings** (up to four): a Gold Mine trickles gold, a Barracks heals nearby friendly units.
  They also have HP and can be destroyed.
- **Heroes** are a single powerful unit on a 60s cooldown, unique per age.
- **Destroy the enemy base** to win

## Controls

| Input | Action |
|---|---|
| Mouse edge / `A` / `D` / `←` `→` | Scroll camera |
| Click minimap strip (top of screen) | Jump camera |
| `1`–`9` | Spawn unit |
| Click Evolve / `E` | Advance to next age |
| Click Special / `Space` | Use age-specific AoE attack |
| `H` | Spawn hero |
| `B` / `N` | Buy Gold Mine / Barracks |
| `T` or the 1x/2x/3x buttons | Cycle game speed |
| `F5` / `F8` | Save / load |
| `ESC` / `P` | Pause menu (music, SFX, restart) |

The world is two screens wide and one screen tall, so only horizontal scrolling does anything.

## Difficulty

| Difficulty | Enemy HP | Enemy damage | Enemy income | AI think rate |
|---|---|---|---|---|
| Normal | 1.0x | 1.0x | 1.0x | 1.0x |
| Harder | 1.15x | 1.15x | 1.1x | 1.25x faster |
| Impossible | 1.3x | 1.3x | 1.2x | 1.67x faster |

Scaling applies to enemy units and turrets alike.

## Ages

| Age | Units | Special |
|---|---|---|
| Stone | Clubman, Slingshot, Dino Rider | Meteor Shower |
| Castle | Swordsman, Archer, Knight | Arrow Volley |
| Renaissance | Dueler, Musketeer, Cannoneer | Artillery Strike |
| Modern | Melee Infantry, Infantry, Tank | Airstrike |
| Future | God's Blade, Blaster, War Machine (+ Super Soldier elite) | Orbital Laser |

Each age also has its own hero and three turret tiers.

## Resources

- **Gold** — Earned from kills, a passive per-age trickle, and the Gold Mine building. Spends on
  units, turrets, turret slots, buildings, heroes, and unit upgrades.
- **XP** — Earned from kills. Spends on evolving to the next age and on special attacks.
