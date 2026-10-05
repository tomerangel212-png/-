# TRA Version History

## TRA ART TRY — forward-port · 2026-10-05

PR68 originally proposed TRA ART TRY, History & Music and patient listening against principles registry 1.1.0. The current implementation preserves those ideas on the later 1.3.0 registry rather than restoring the older registry.

- The original PR68 registry patch is historical and is not the active registry.
- The living TRA ART TRY page reads the current principles registry.
- Navigation and documentation from PR68 were forward-ported where still useful.
- This entry records repository history; it does not claim a deployment or live-site verification.


## TRA Perfect Target — Draft program · 2026-08-23

Not released. This program defines the next measurable target: **9,999,999,999/9,999,999,999**.

- The target is not an achieved-score claim.
- Legacy contracts `10/10` and `999/1000` remain preserved.
- Every historical TRA principle is registered in `TRA_PRINCIPLES.json`.
- Quality is divided into weighted, testable dimensions whose weights total exactly 9,999,999,999.
- Hard guardrails prevent a perfect claim when truth, accessibility, offline resilience, security, content completeness, CI, live verification or human approval is missing.
- No merge or publication may occur without explicit human approval.

## TRA 9.9 — 2026-08-20

Current release across the TRA system.

- All active TRA components are aligned to version 9.9.
- Previous versions remain part of the Git history and are never overwritten conceptually.
- Versioning rule: **source → preserve → improve → new version**.
- Core principle: **an update does not delete the previous version; always respect the source.**
- Reference-app principle: **before upgrading a TRA product, inspect strong comparable source apps, identify the patterns that make them work, and use those patterns as inspiration without copying branding, text, assets or proprietary implementation.**
- Quality principle: **10/10 is a release gate backed by checks and real functional improvements, not a decorative score.**

### TRA 9.9 reference set

- Casino Angel: inspired by the product patterns of leading social poker apps such as Zynga Poker — clear stakes, fast table entry, progression, tournaments, readable table state and virtual-chip safety.
- Casino Angel now plays a complete Texas Hold’em hand: two private cards for every player, blinds and pre-flop betting, flop (3), turn (4), river (5), hand reveal, and every main or side pot awarded to its winning hand.
- Casino Angel fairness: every seat now starts with the same 10,000 virtual chips and uses one neutral bot policy; cards and the initial dealer are shuffled without player-specific weighting.
- TRA Chess: inspired by Chess.com/Lichess patterns — distinct bots, strict rules, review/analysis affordances, training orientation and clear game state.
- HITSTER TRA: inspired by HITSTER and modern music apps — immediate playback, simple draw/reveal flow, resilient audio fallback, clear library state and offline resilience.

## TRA 8.5

Previous baseline release. Preserved as the direct predecessor of TRA 9.9.

Earlier versions remain preserved through repository history.
