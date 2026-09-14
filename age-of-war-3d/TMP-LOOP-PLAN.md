# TMP LOOP PLAN — age-of-war-3d (approved 2026-09-14, DONE 2026-09-14)

- [x] 0. Regression + sweep (156 + 652 green, soak 0 findings, filed BUG-008/009/010)
- [x] 1. Turret no-fire: sim healthy (all 15 slots fire+damage); fixed render visuals test-first (5924116)
- [x] 1b. No other crash/high/med/low found (soak clean twice, smokes 23/23)
- [x] 2. ALL teamRings removed; garments/trim/banners/HP keep readability (8437913)
- [x] 3a. Towers: emblem shield + bond-beams, procedural (no CC0 fetch needed) (4e06ddf)
- [x] 3b. Turrets: pennons + aim/flash/first-shot fixes (03239fc)
- [x] 3c. Env: talus, skirts, lane edges, scatter (a7d2604)
- [x] 4. Gates: 689 + 156 green, --strict zero errors, 60fps, ≤872 calls

Note: uniform tint delta already covered by accent garments (headbands/coats/trim).
Note: external CC0 towers deferred — procedural pass met the bar with zero asset risk.

Laws: never edit age-of-war/, one folder per module, core via integrator, ARCHITECTURE.md first on contract change, STATUS.json persist, commit often.
