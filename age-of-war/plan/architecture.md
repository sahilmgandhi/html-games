# Age of War — Architecture Document

## File Structure
```
age-of-war/
├── index.html              # Entry point, loads all JS in order
├── css/style.css           # Canvas centering, dark background
├── js/
│   ├── config.js           # All game data (ages, units, turrets, economy)
│   ├── utils.js            # Math helpers (clamp, lerp, dist, etc.)
│   ├── entities.js         # Base, Unit, Turret, Projectile classes
│   ├── renderer.js         # Canvas drawing (terrain, bases, sprites, HUD, minimap)
│   ├── input.js            # Mouse/keyboard input, camera scrolling, HUD clicks
│   ├── ai.js               # AI opponent decision loop
│   ├── particles.js        # Particle system (death, damage numbers, gold numbers)
│   ├── audio.js            # Web Audio oscillator synth
│   ├── minimap.js          # Minimap strip overlay
│   ├── game.js             # Game class: loop, state, update, render
│   └── main.js             # Canvas setup, title screen, click-to-start
└── plan/
    ├── game-design.md      # This document
    ├── architecture.md     # Architecture overview
    └── phases.md           # Build phase breakdown
```

## Module Responsibilities

### config.js
- Single `CONFIG` object containing all game constants
- Viewport/world dimensions, camera settings, base stats, economy rates
- Full age definitions: unit stats, turret stats, special attack data, evolution costs

### utils.js
- `clamp(val, min, max)` — Restrict value to range
- `lerp(a, b, t)` — Linear interpolation
- `dist(x1, y1, x2, y2)` — Euclidean distance
- `randFloat(min, max)` — Random float in range
- `randInt(min, max)` — Random integer in range
- `pointInRect(px, py, rx, ry, rw, rh)` — Point-in-rectangle test (for HUD clicks)
- `weightedRandom(items, weights)` — Weighted random selection

### entities.js
- **Base**: Position, HP, takeDamage, healFraction
- **Unit**: Full combat entity with state (alive, hitFlash, attackCooldown), target acquisition (nearest enemy unit/turret/base), movement, attack (melee direct / ranged projectile), splash damage
- **Turret**: Stationary defender, auto-targets nearest enemy in range, fires projectiles
- **Projectile**: Directional movement, hit detection against enemy units, splash damage support

### renderer.js
- **Camera**: `worldToScreen()` coordinate transform, `scrollTo()` with clamping
- **Terrain**: Era-specific sky gradients, ground color, grid lines
- **Bases**: Era-colored rectangles with HP bars
- **Units**: 15 unique canvas-drawn sprites via `drawUnitSprite(type, ageIndex)` switch statement
- **Turrets**: Era-colored structures with side-colored barrel
- **Projectiles**: Color-coded dots (yellow=player, red=enemy)
- **HUD**: Unit spawn buttons (cost, affordability), evolve button, special attack button, gold/XP display, age name
- **Minimap**: Position strip with unit dots, turret markers, base rectangles, camera viewport outline

### input.js
- **InputHandler**: Mouse position tracking, keyboard state, mouse-edge camera scrolling
- **HUD click detection**: Maps click coordinates to unit buttons, evolve button, special button

### ai.js
- **AI**: Think timer (2.5s interval), decision logic:
  1. Check evolution (60% chance if affordable)
  2. Check special attack (30% chance if ready)
  3. Weighted random unit selection (melee weighted highest, siege lowest)
  4. Scale up melee weight when player has >5 units

### particles.js
- **ParticleSystem**: Array-based particle management
- `emit()` — Burst of colored particles with velocity spread
- `emitDamageNumber()` — Floating damage text
- `emitGoldNumber()` — Floating gold reward text
- Alpha fade over lifetime

### audio.js
- **AudioManager**: Web Audio oscillator-based synthesis
- 8 sound types: spawn, hit, fire, explosion, evolve, special, death, gold
- Each uses different waveform (sine/sawtooth/square/triangle) and frequency envelopes
- Mute toggle support

### game.js
- **Game**: Central orchestrator
- `start()` → `loop()` → `update(dt)` → `render()` cycle
- Gold/XP passive income
- Entity lifecycle: spawn, update, combat, death, cleanup
- Kill rewards (gold + XP to killer's side)
- Evolution logic (XP cost, base heal, turret sell)
- Special attack logic (cooldown, AoE damage)
- Win/lose detection, game over overlay, restart

### main.js
- Canvas setup (1200×600)
- Title screen with animated unit previews
- Click-to-start handler
- Instantiates Game on start

## Data Flow
```
main.js (entry)
  ↓
config.js (data loaded first)
  ↓
utils.js (helpers available)
  ↓
entities.js (classes defined)
  ↓
renderer.js (drawing functions)
  ↓
input.js (input handling)
  ↓
ai.js (opponent logic)
  ↓
particles.js (effects)
  ↓
audio.js (sound)
  ↓
minimap.js (minimap)
  ↓
game.js (orchestrator, uses all above)
  ↓
main.js (creates Game, starts loop)
```

## Game Loop
```
requestAnimationFrame
  → Game.loop(timestamp)
    → calculate dt (capped at 50ms)
    → Game.update(dt)
      → input.update() (camera scrolling)
      → passive income (gold, xp)
      → AI decision
      → unit updates (movement, targeting, attack)
      → turret updates (targeting, fire)
      → projectile updates (movement, hit detection)
      → dead unit cleanup (particles, rewards)
      → dead projectile cleanup
      → dead turret cleanup
      → win/lose check
      → particle updates
    → Game.render()
      → clear canvas
      → draw terrain
      → draw bases
      → draw turrets
      → draw units
      → draw projectiles
      → draw particles
      → draw HUD
      → draw minimap
      → draw game over (if applicable)
```

## Coordinate System
- **World coordinates**: 0 to 2400 (horizontal), 0 to 600 (vertical)
- **Screen coordinates**: 0 to 1200 (horizontal), 0 to 600 (vertical)
- Camera offset: `screenX = worldX - camera.x`
- Ground level: y = 500 (VIEWPORT.HEIGHT - 100)
- Base positions: Player at (100, 500), Enemy at (2300, 500)
