# Age of War

This is a 2D strategy game. You defend your base. You destroy the enemy base. You win when it falls.

## Start

Do these steps from the repo root:

```bash
npm run serve
```

Then open `http://localhost:8081/age-of-war/` in your browser. Pick a difficulty on the title screen. Click to start.

## Play

- Spawn units from the bottom bar. You can also press `1` to `9`.
- Upgrade a unit with the small `↑` button. Each unit has two tiers.
- Press Evolve to enter the next age. Evolve costs XP. It heals your base.
- Use Special Attack to hit all enemy units. It costs XP. It has a cooldown.
- Buy turrets to guard your base. You can sell them back.
- Buy buildings for gold and healing. Gold Mine gives gold. Barracks heals units.
- Spawn your hero with `H`. Each age has one hero.

You earn gold from kills and buildings. You spend gold on units and defense. You earn XP from kills. You spend XP on Evolve and Special Attack.

## Controls

| Input | Action |
|---|---|
| `A` / `D` or arrows | Move camera |
| Click top strip | Jump camera |
| `1` to `9` | Spawn unit |
| `E` | Evolve |
| `Space` | Special Attack |
| `H` | Spawn hero |
| `B` / `N` | Buy mine / barracks |
| `T` | Change game speed |
| `P` or `ESC` | Pause |

## Test

```bash
npm test  # from this folder
```

Or from the root, use `npm test -w age-of-war`. Tests run in Node. No browser is needed.

## Docs

- [`docs/game-design.md`](docs/game-design.md) describes the game rules.
- [`docs/architecture.md`](docs/architecture.md) describes the code layout.
- [`docs/balance.md`](docs/balance.md) lists all unit numbers. It is made from `js/config.js`. Run `npm run docs` after each change.
