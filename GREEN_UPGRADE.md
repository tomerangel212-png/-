# TRA Yellow → Green upgrade

This branch turns previously partial digital projects into testable release candidates without weakening existing gates.

## Added release candidates

- `angel-family-game.html` — standalone browser release with persistence, 12-round limit and win condition.
- `tra-dnd.html` — standalone cooperative five-challenge D&D-style release with roles, d20 and persistence.
- `tra-100.html` — searchable map of exactly 100 declared worlds.
- `wikifamily.html` — Kfar Blum family EscapeVerse release 1.0 with timer, missions, teams, score and persistence.
- `poetry/oy-ha-berech.html` — source-faithful archive release; missing text remains explicitly missing.
- `poetry/index.html` — active writing archive rather than a placeholder.

## Gates

- `yellow-to-green-check.js` protects the new digital releases.
- `hitster-source-audit.js` independently checks all 888 cards against their declared chart-year source pages.
- `.github/workflows/hitster-source-audit.yml` runs the provenance audit.
- Production quality checks run on this branch before merge.

## Truth boundary

No project is marked complete merely because a page exists. Physical pilots, legal/partner actions, travel completion and unretrieved music masters remain outside a software-only completion claim.
