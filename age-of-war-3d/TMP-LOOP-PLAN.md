# TMP LOOP PLAN — age-of-war-3d (approved 2026-09-14)

Do not delete mid-loop. Check off as you go.

- [ ] 0. Regression + sweep (2D ≥9, suites green, combat/chrome/camera/console, file BUGS.json BUG-008+)
- [ ] 1. Turret no-fire BUG: repro → failing test → fix → green + live re-drive
- [ ] 1b. All other bugs worst-first (crash/high → med → low), one commit each
- [ ] 2. Remove ALL teamRing (units/gltf/tower/bases incl. hero gold); keep trim/banners/HP + subtle uniform tint delta
- [ ] 3a. Towers: CC0-only + License.txt, procedural fallback, per-age detail
- [ ] 3b. Turrets: hybrid CC0 + procedural, true muzzles, recoil/flash
- [ ] 3c. Terrain/env/ground/small props all 5 ages, veto-clear, mergeStatic
- [ ] 4. Simplify + reviewer pass; gates: 156 + 3d green, shot --strict zero errors, ≥50fps ≤1500 calls

Laws: never edit age-of-war/, one folder per module, core via integrator, ARCHITECTURE.md first on contract change, STATUS.json persist, commit often.
