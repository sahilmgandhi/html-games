# Age of War — Build Phase Breakdown

## Phase 1: Project Scaffold + Dev Server
**Files**: `index.html`, `css/style.css`, `js/main.js`
- HTML5 boilerplate with canvas element
- CSS for centered canvas, dark background
- main.js: canvas setup, title screen with animated unit previews, click-to-start handler
- Dev server: `python3 -m http.server 8080`

## Phase 2: Game Config + Utilities
**Files**: `js/config.js`, `js/utils.js`
- CONFIG object with all game constants (viewport, world, camera, base, economy, ages)
- Full age definitions with unit/turret/special data
- Utility functions: clamp, lerp, dist, randFloat, randInt, pointInRect, weightedRandom

## Phase 3: Game Loop + Entity Classes
**Files**: `js/game.js`, `js/entities.js`
- Game class with requestAnimationFrame loop, dt calculation
- Base class (HP, damage, healing)
- Unit class (stats from config, target acquisition, movement, attack, projectile spawning)
- Turret class (stationary defender, auto-target, fire)
- Projectile class (directional movement, hit detection, splash damage)
- Basic update/render cycle

## Phase 4: Terrain + Scrolling Camera
**Files**: `js/renderer.js` (terrain section)
- Camera class with worldToScreen transform and scroll clamping
- Era-specific sky gradients and ground colors
- Ground line and grid decoration
- Parallax-style vertical grid lines

## Phase 5: Base Rendering
**Files**: `js/renderer.js` (base section)
- Era-appropriate base structures (color-coded by age)
- HP bar with color coding (green > 50%, yellow > 25%, red ≤ 25%)
- Base labels ("YOUR BASE" / "ENEMY BASE")
- HP text display

## Phase 6: Unit Sprites
**Files**: `js/renderer.js` (unit sprite section)
- 15 unique canvas-drawn unit types via switch statement
- Stone Age: simple shapes (club, slingshot arc, raptor body)
- Castle Age: armored figures (helmet, bow, horse)
- Renaissance: period clothing (pikeman, musketeer, cannon)
- Modern Age: military (rifleman, tank treads, helicopter rotors)
- Future Age: neon glow effects (laser mech, energy weapons, drone)
- Hit flash effect, bob animation, HP bars

## Phase 7: Input + HUD
**Files**: `js/input.js`, `js/renderer.js` (HUD section)
- Mouse-edge camera scrolling (50px margin)
- Keyboard controls (WASD, arrow keys)
- HUD bar at bottom of screen
- Unit spawn buttons (name, cost, affordability indicator)
- Evolve button (XP cost, availability)
- Special attack button (cooldown display, ready state)
- Gold and XP display
- Click detection for all HUD elements

## Phase 8: Unit Spawning + Movement
**Files**: `js/game.js` (spawn methods), `js/entities.js` (movement)
- spawnUnit() for player units (gold deduction, spawn near base)
- spawnEnemyUnit() for AI units (spawn near enemy base)
- Auto-march toward enemy base
- Stop and attack when enemy in range

## Phase 9: Combat System
**Files**: `js/entities.js` (attack/takeDamage), `js/game.js` (combat loop)
- Melee: direct damage on attack
- Ranged/siege/armored/air: fire projectiles
- Splash damage for siege units
- Projectile hit detection with distance check
- Kill rewards (gold + XP to killer's side)
- Dead entity cleanup

## Phase 10: AI Opponent
**Files**: `js/ai.js`
- Think timer (2.5s interval)
- Evolution check (60% chance if XP sufficient)
- Special attack check (30% chance if ready)
- Weighted random unit selection:
  - Melee: weight 3 (preferred)
  - Ranged: weight 2
  - Fast/Air: weight 1.5
  - Armored: weight 1
  - Siege: weight 0.8
- Scale-up when player has >5 units

## Phase 11: Age Evolution
**Files**: `js/game.js` (evolve methods)
- XP cost check per age transition
- Age index increment
- Base heal (25% of max HP)
- Sell old-age turrets (filter by side)
- Unlock new units/turrets/specials

## Phase 12: Special Attacks
**Files**: `js/game.js` (useSpecial methods)
- Per-age AoE damage (300 → 1200)
- 30-second cooldown
- Affects all enemy units on screen
- Visual particle burst
- Sound effect

## Phase 13: Particle Effects
**Files**: `js/particles.js`
- Burst particles on unit death (side-colored)
- Burst particles on turret death
- Floating damage numbers
- Floating gold reward numbers
- Alpha fade over lifetime
- Position-based rendering (world to screen)

## Phase 14: Audio
**Files**: `js/audio.js`
- Web Audio oscillator-based synthesis
- 8 sound types with unique waveforms:
  - spawn: sine sweep up
  - hit: sawtooth sweep down
  - fire: square sweep down
  - explosion: sawtooth deep sweep
  - evolve: sine sweep up
  - special: sawtooth up+down
  - death: triangle sweep down
  - gold: sine double-beep
- Mute toggle
- Graceful fallback if Web Audio unavailable

## Phase 15: Minimap
**Files**: `js/minimap.js`
- Horizontal strip at top of screen
- Scaled world representation (2400px → viewport width)
- Unit dots (blue=player, red=enemy)
- Turret markers
- Base rectangles
- Camera viewport outline

## Phase 16: Polish + Win/Lose
**Files**: `js/game.js` (game over, restart)
- Win/lose detection (base HP ≤ 0)
- Game over overlay (victory/defeat text, semi-transparent background)
- Click to restart (full state reset)
- Balance tuning (unit costs, HP, damage, evolution costs)
- Title screen animations
