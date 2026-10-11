# Add Roy Kafri to the TRA music artist index — 2026-10-11

Task: MUSIC-ARTIST-ROY-KAFRI-20261011
Editor: Codex
Branch: music/add-roy-kafri-20261011
Base: 77032588b33d954cba9203ff2524e71021b5d1e6 (PR #93 draft head)
Status: prepared on a separate branch for review; no merge or deployment.

## Scope
Add Roy Kafri (רועי כפרי) as an artist card on the History & Music catalog. Link to the official chords page and the PDF supplied by the user. Keep artist metadata in `tra-artists.json`, and include that exact file in the explicit Pages allowlist.

No chord transcriptions, lyrics, or HITSTER song cards are copied or added. The supplied PDF is treated as a source link; individual track titles/chart years were not independently verified for this task.

## Changed paths
- `history-and-music-catalog.html`
- `history-and-music.js`
- `tra-artists.json`
- `.github/pages-public-files.txt`
- `history-and-music-check.cjs`
- `docs/ai/tasks/MUSIC-ARTIST-ROY-KAFRI-20261011.md`

## Validation
Catalog regression assertions added for the artist card and both external source links. Run with:
`TRA_CHESS_TEST_PREFIX=/path/to/prefix node history-and-music-check.cjs`
The prefix must provide jsdom@26.1.0. No live browser/device validation, merge, or deployment is claimed.
