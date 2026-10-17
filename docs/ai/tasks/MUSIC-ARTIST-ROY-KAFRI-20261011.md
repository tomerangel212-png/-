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

## Publication follow-up — 2026-10-17
Editor: Codex. User instruction: Publish (Roy Kafri addition in PR #95).
Branch: music/add-roy-kafri-20261011. Previous head: c363410aed5435f5dd2d9cbc5a26a8072cf5d4e9.
Integrated main: 070dfbe16be0442d5db263beb31421828f1987b8.
Resolved catalog HTML/JavaScript conflicts by retaining all four current filters, URL views, artist-first song display, and the added artist card. The artist list heading is vocalized Hebrew.

Local checks passed: JavaScript syntax, catalog/source-link regression, all 688 artist filters and combined/URL filter cases, HITSTER audio/lives regression, five Pages staging/privacy tests, and diff whitespace checks.
Added `history-and-music-browser.cjs` to the existing Pages validation job to check the card, both source links, mobile/desktop width, RTL, filter preservation, real PCM tone decoding/playback progression, and isolation between local audio and the embedded player. Its screenshot joins the existing validation artifact. Local browser installation failed because the downloaded archives were truncated; the required browser check runs in CI before merge.

Additional changed paths: `.github/workflows/pages.yml`, `history-and-music-browser.cjs`.
Status: ready for independent review and CI; publication authorized, pending both checks. No physical iPhone audibility or Spotify/Apple Music preview availability is claimed. This addition publishes an artist card and source links; it does not add Roy Kafri recordings to the HITSTER deck.

The pre-publication HTTP check found that the supplied 2019 PDF returns 404. The official chords page (HTTP 200) now links to `/wp-content/uploads/2026/03/רועי-כפרי-אקורדים-14.3.2026.pdf`; replaced the dead public link with this official current PDF and updated its label and regression assertion. The original supplied URL remains in the earlier commit history.
CI run 39051391576 passed the new Chromium artist/local-audio browser step on candidate a28c1020be477e22346ba0fb5dbac1d0a3acdf56. The final PDF-link adjustment must pass the same checks on its own final commit.
