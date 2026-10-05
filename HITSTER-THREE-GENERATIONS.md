# HITSTER Three Generations

Requested by Tomer: an additional HITSTER mode that starts with children's songs answered only by children, followed by adult songs answered only by adults, then older-generation songs answered only by older adults.

## Behavior

- Entry: `hitster-888.html?mode=generations`, or `hitster-mobile.html?mode=generations`; English uses `hitster-888-en.html?mode=generations`.
- The host advances to the next stage only after a complete round, children first and adults second. No transition is permitted during an active card or pending audio preparation. Victory remains blocked until all three stages have received a complete round, then uses the existing 10-card/fair-final-round rule.
- The active generation is displayed without a decade/year-range spoiler. All guessing and timeline placement belong to that generation. The host confirms this on every card, including replacements and after reload; scoring/year-reveal handlers also check the confirmation. This is a host-enforced social rule, not automatic age verification.
- Group membership is agreed at the table; no ages or dates of birth are collected.
- Separate local save key preserves the standard game. Stage, timelines, used songs and tokens survive reload. Reset starts at children's songs. Replacing a song does not advance the stage.
- Existing 30-second audio, preview cache, no-repeat rule, exclusions and fair final round remain in place. Missing audio never falls back to songs from another generation.

## Playlist choices and provenance

The children stage has ten candidates: eight added Hebrew/English children's recordings and two existing child-oriented chart entries. Added cards have per-recording source URLs in `hitster-generations.js`, checked against Apple Music, Disney/Pixar and the National Library of Israel. Hebrew classics include songs from *The Sixteenth Sheep*, whose 1978 release is documented at https://www.nli.org.il/he/items/NNL_MUSIC_AL990038506340205171/NLI.

Children's classification takes precedence over recording date: a 1978 children's song stays in the children stage. Remaining existing chart cards are listed in explicit editable ID playlists, initially curated by era: modern hits for adults and older hits for older adults. The initial editorial boundary is 1980; runtime selection uses the explicit lists, not a year inference. This is not a factual assertion about age or taste. Additional children's cards retain their recording/catalog-year basis; existing cards retain chart-year basis. No audio files are redistributed by this change. Remote preview availability is resolved at play time and is not guaranteed.

## Verification

- `node hitster-generations-regression.cjs`: both languages; pool selection, complete-round transitions, host guards, replacement, separate saves, reload/reset, no repeats and offline/missing-audio behavior.
- `node hitster-audio-regression.cjs`: existing gesture-only audio tests pass.
- `node hitster-fair-round-regression.cjs`: all 400 existing fair-round scenarios pass.
- Local visual browser verification was unavailable because the installed Playwright package has no Chromium executable. No real-device audio or mobile visual pass is claimed.

The annual 888-card JSON remains unchanged; the eight extra recordings are loaded only in this mode. This work does not include or merge the independent ten-lives PR.
