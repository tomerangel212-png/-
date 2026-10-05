# TRA Chess — accessible five-language interface

## Scope

Replaces the fragile string-patching `games-loader.js` with an executable, directly maintained chess interface. The original `games.js` is left untouched for history and existing integrations. Both the chess area at `games.html#chess` and the dedicated `chess.html` use the replacement loader. HITSTER, star values, memorial records and family data are not changed.

## Behavior

Hebrew is the default. English, Arabic, French and Hindi include the full UI, dynamic status text, piece names, instructions, dialogs and error messages. Language and display preferences are saved locally where storage is allowed. Language changes do not reset the position.

Learning starts without a clock. Players may select five, ten or fifteen minutes per side. The board supports tap-to-move, keyboard arrows, Enter/Space, Escape, Tab and optional desktop dragging. TV display supports larger controls and directional exit from the edge of the board. Text enlargement, high contrast and reduced-motion preferences are supported. Promotion and draw declarations use on-page dialogs. Toddlers are described as participating with an adult, not as independent chess players.

Standard move legality remains delegated to chess.js 1.4.0. A second pinned source is attempted if the first fails. Failure produces a translated retry control, not a blank board. The first successful load still requires access to a dependency source; offline availability of the engine is not guaranteed.

Bot levels are explicitly local difficulty settings, not measured FIDE or platform ratings. The material-based timeout check is conservative and is not a solver proving every theoretical dead position. This update does not claim identical rules, ratings, or feature coverage to Lichess or Chess.com.

## Validation

`node chess-accessible-check.mjs --unit-only` runs translation, interpolation, module-evaluation and loader-failure checks without a chess engine. For executable rule tests, set `TRA_CHESS_ENGINE_PATH` to the installed chess.js 1.4.0 ESM build.

The dedicated GitHub workflow runs those real-engine tests plus Chromium layout and interaction checks in 25 viewport/language combinations. CI status and logs, not this document, determine whether a run passed. Actual iPad Safari, Android devices, television remotes, screen readers and a complete accessibility audit remain separate acceptance work. No WCAG certification is claimed.

## References

- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA 1.2 grid structure: https://www.w3.org/TR/wai-aria-1.2/#grid
- chess.js upstream: https://github.com/jhlywa/chess.js

© 2026 Tomer Rafael Angel. All rights reserved for this project. Upstream dependencies retain their respective licenses.
