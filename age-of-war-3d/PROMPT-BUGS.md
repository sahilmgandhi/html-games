# Goal

Squash every bug in `age-of-war-3d/` the way the polish loop squashes visual
debt: one ranked list, worst first, each fix proven by a failing test and a
fresh browser verification, never by inspection alone. This file extends
`PROMPT.md` and `PROMPT-CONTINUE.md`; where they conflict, this file wins
for bug work only.

Triage baseline (2026-09-11, verified live, zero console errors throughout):
sim smokes 23/23, both suites green, spawn/turret/mine/evolve/special/pause/
restart/gallery all PASS on the current build. The game is healthy; the bugs
left are the ones only structured playtesting finds.

# The Bug Loop (binding order, no skipping steps)

1. **Reproduce.** Drive the live game (`tools/probe.mjs`, real clicks) until
   the bug shows. Record the exact steps, the showcase/URL, seed if any, and
   a screenshot or video. A bug with no reproduction is a rumor, not a bug.
2. **File.** Append to `docs/BUGS.json`: `{ id, title, severity, steps,
   expected, actual, shot }`. IDs run `BUG-001, BUG-002, ...`. Severity:
   **crash** (error thrown / game unplayable), **high** (feature broken,
   exploit, softlock), **medium** (wrong visuals, wrong numbers, missing
   feedback), **low** (nit, copy, alignment).
3. **Test first.** Write a failing Node test that captures the bug (wrong
   value, thrown error, broken contract). Watch it fail. No test, no fix —
   the test is the proof the bug existed and the guard it never returns.
4. **Fix.** Smallest change that fixes the cause, not the symptom. One bug
   per commit. Never edit `age-of-war/`; balance-number bugs are fixed by
   matching the 2D original, feel bugs by the 3D-first law.
5. **Verify.** The new test goes green, both suites stay green
   (`npm test -w age-of-war` 156, `npm test -w age-of-war-3d` current count),
   and the live reproduction is re-driven clean with a fresh screenshot or
   video. Update `docs/BUGS.json` to `fixed-verified` with the commit hash.
6. **Commit often**, concise messages (`3d: fix BUG-014: ...`). One bug per
   commit so reverts stay surgical.

# Playtest Sweeps (where bugs come from)

Each sweep drives all five ages in order and files everything found before
fixing anything:

- **Combat sweep:** spawn every unit, buy every turret slot, place every
  turret, mine + barracks, hero, special, evolve through all five ages to
  victory and to defeat. Watch HP bars, damage numbers, death FX, gold/XP.
- **Chrome sweep:** pause/resume, restart (mid-battle and post-game), 1x/2x/
  3x speed, BOT toggle + manual takeover, gallery round-trip, difficulty
  cycler. Every button, every hotkey, focused-button + Space included.
- **Camera sweep:** full battles at close/wide/side framings; gate fights
  (keep-out), one-sided openings (vista framing), 10+ unit brawls (follow
  focus). No clipping, no parking inside geometry, no lost action.
- **Console sweep:** every screenshot and video runs `--strict`. Zero
  console errors and zero app errors is the pass line; warnings get filed
  as low bugs, not ignored.
- **Regression sweep (runs first, halts all bug work on failure):**
  original `age-of-war/` loads and plays, score ≥9/10.

# Scoring (no inflation, same as the art gauntlet)

- Count open bugs by severity, not vibes: `0 crash, 0 high` ships;
  mediums are scheduled; lows are fixed opportunistically.
- A fix is `fixed-verified` only with: failing-then-green test + clean
  live re-drive + both suites green. Anything less stays open.
- Never close a bug by inspection ("looks fixed"). Never bulk-close.
- Report dead ends: irreproducible bugs stay open with the attempts logged,
  or close as `cannot-repro` with the exact tries listed.

# Rules

- Never edit `age-of-war/`. Never edit another module's folder; core
  changes go through the integrator.
- `npm test -w age-of-war` (156) and `npm test -w age-of-war-3d` must pass
  before every commit.
- Decide routine matters yourself, state assumptions, keep going. The loop
  is the authority.
- Never inflate: real counts, failed reproductions, still-open lists.

Start with a combat sweep, file everything, then fix worst-first.
