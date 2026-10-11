# Shared catalog views — 2026-10-11
Task: CATALOG-VIEWS-20261011. Editor: Codex. Branch: catalog/views-20261011.
Base: 2dd2610364ded8c3eeabcda7f51b67818e737a19.
User requested live catalog views by artist, decade, language and style from one shared data source.

Paths: history-and-music-catalog.html, history-and-music.js, history-and-music-filters-check.cjs, this task record.
Adds counted artist/decade/language/genre filters, combinations, reset, and a URL for each view. Artist appears before song title without changing data fields. Uses the existing 888-card source; all current cards lack language/genre, so they remain explicitly unclassified. No inferred music metadata, new public manifest entries, archive changes, family/event tree changes or Ant changes.

Validation: all 688 artist values, combined filters, query URL restoration, invalid values, unclassified metadata and reset tested with jsdom. Known language/genre handling tested with synthetic fixtures, not claimed as actual catalog metadata. Existing catalog/audio-cache regression, five public staging tests, HITSTER audio regression, JS syntax and diff checks passed. Real browser/layout/physical-device tests remain unrun locally due to missing Chromium. Publishing requested within live catalog scope; merge and deployment only after CI success.
