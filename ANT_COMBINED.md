# Ant combined experiment — 2026-10-09

Task: ANTI-COMBINED-20261009. Editor: Codex. Branch: experiment/anti-combined-20261009.
Base: 38b99483ea28029349c62a1696c9523359685dd2. This branch preserves that experiment and its original report unchanged.

Combines three previously proposed changes in games-loader.js / chooseAntMove:
- One extra legal check-evasion ply at the quiescence boundary, shared across each line.
- Up to one quiet checking move per quiescence line, identified using legal chess.js SAN.
- Optional threefold/50-move draw score of zero for either player, without forcing a draw when continuing is better. Uses chess.js incremental repetition detection to avoid rebuilding history at every node.

The existing 4200-node / 120ms target and completed-iteration fallback remain. This is cooperative timing, not a hard real-time guarantee. quiescence:false disables boundary extensions for the original isolation tests.

Validation performed locally with chess.js 1.4.0 and jsdom 26.1.0:
- 14 existing Ant checks passed.
- 9 added combined checks passed: bounded check extensions, optional draw choice for both sides, and real repetition history restoration. Eight are isolated synthetic search-tree tests; one uses a real chess position/history.
- 30 accessible chess/rules checks passed.
- jsdom Hebrew UI / Ant / e4 / legal response / return to human passed.
- 13 existing positions x 3 paired repetitions: 78 legal moves, state restored, no node cap breach.
- Maximum measured time: baseline 126.83ms; combined 118.26ms. One Italian-position choice differed in one repetition. Raw timing/choices are in chess-anti-combined-benchmark.json.

Not measured: independent Stockfish move quality, the previously proposed 6+4 position acceptance suites, physical devices, real browser performance, or Elo. The combined change is an experiment, not an accepted strength improvement. Integration to main is withheld because main triggers Pages deployment and the preceding scope prohibited publication.

Reproduce:
```
TRA_CHESS_ENGINE_PATH=/tmp/anti-chess-test/node_modules/chess.js/dist/esm/chess.js node chess-anti-combined-check.mjs
TRA_CHESS_ENGINE_PATH=/tmp/anti-chess-test/node_modules/chess.js/dist/esm/chess.js node chess-anti-combined-benchmark.mjs
```

Rollback: select the untouched base commit in a separate checkout. No reset, branch deletion, or history rewrite is needed.
