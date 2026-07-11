# Age of War

A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Built entirely in HTML5 Canvas with no external dependencies.

## How to Run

```bash
cd age-of-war
python3 -m http.server 8081
```

Open http://localhost:8081 in your browser.

## How to Play

- **Spawn units** by clicking their buttons in the bottom HUD
- **Evolve** to the next age by clicking the Evolve button (costs XP)
- **Special attack** damages all enemies on screen (40s cooldown)
- **Scroll the camera** by moving your mouse to the screen edges, or use WASD/arrow keys
- **Destroy the enemy base** to win

## Controls

| Input | Action |
|---|---|
| Mouse edge | Scroll camera |
| WASD / Arrow keys | Scroll camera |
| Click unit button | Spawn unit |
| Click Evolve | Advance to next age |
| Click Special | Use age-specific AoE attack |

## Ages

| Age | Units | Special |
|---|---|---|
| Stone | Clubman, Slingshot, Dino Rider | Meteor Shower |
| Castle | Swordsman, Archer, Knight | Arrow Volley |
| Renaissance | Dueler, Musketeer, Cannoneer | Artillery Strike |
| Modern | Melee Infantry, Infantry, Tank | Airstrike |
| Future | God's Blade, Blaster, War Machine (+ Super Soldier elite) | Orbital Laser |

## Resources

- **Gold** — Earned from kills and the Gold Mine building. Spawns units and turrets.
- **XP** — Earned from kills. Used to evolve to the next age.
