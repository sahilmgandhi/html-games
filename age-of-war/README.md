# Age of War

A strategy game inspired by the classic Flash "Age of War" by Max Games/Louissi. Built entirely in HTML5 Canvas with no external dependencies.

## How to Run

From the repo root:

```bash
npm run serve
```

Open http://localhost:8081/age-of-war/ in your browser.

## Tests

```bash
npm test          # from this directory, or `npm test -w age-of-war` from the root
```

Runs the headless harness (`test-runner.js`), which loads the real game files listed in
`index.html` and drives simulated frames — no browser required.

## Docs

- [`docs/balance.md`](docs/balance.md) — every stat in the game, generated from `js/config.js`.
  Run `npm run docs` after any balance change; a test fails if it is stale.
- [`docs/game-design.md`](docs/game-design.md) — mechanics and design intent.
- [`docs/architecture.md`](docs/architecture.md) — module layout and invariants.

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

## Difficulty and Ages

Three difficulties scale the enemy's HP, damage, gold income, and AI reaction speed; the player is
never scaled. Five ages each bring three units, a hero, three turret tiers, and a special attack.

Full numbers — every unit, turret, hero, cost, and multiplier — are in
[`docs/balance.md`](docs/balance.md).

## Resources

- **Gold** — Earned from kills, a passive per-age trickle, and the Gold Mine building. Spends on
  units, turrets, turret slots, buildings, heroes, and unit upgrades.
- **XP** — Earned from kills. Spends on evolving to the next age and on special attacks.
