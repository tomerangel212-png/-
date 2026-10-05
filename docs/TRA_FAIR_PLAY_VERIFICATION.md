# TRA fair-play implementation — 2026-10-05

## Source and change
The current TRA research-principles charter (updated 2026-10-04) requires a 10-card target, completion of the current round, all tied winners named, and the family HITSTER champion message. The annual runtime and its Hebrew/English pages still used an immediate 18-card win. This change aligns their behavior with the current charter and adds an executable release gate.

## Principle applications and evidence
- Fairness and simplicity: each team gets one opportunity in the final round, in the selected starting-team order. Correct cards, free cards and missed placements all finish through the same round boundary. The existing rules explain this in Hebrew and English.
- Source, history and improvement: Git keeps the previous implementation. Existing saved timelines, used-card history and token balances are retained. Old unfinished saves without a starting-team field start a complete round from the saved active team rather than inventing previous turns. Historical completed saves remain completed.
- Truth before presentation: the new gate runs 400 behavioral scenarios; the result is not a claim of universal correctness or physical-device audio. No arbitrary quality rating is awarded.
- Privacy and consent: this change adds no personal records, no new external integration and no public memorial content. Winner names come from the existing game state and are written as text.
- Offline and lawful audio: the existing 30-second player and device preview cache stay intact. Static cache generation changes so the current runtime and rules refresh together.
- Release discipline: the fair-round regression is enforced in both PR quality and pre-deployment workflows. The three stale structural assertions now enforce the approved 10-card target and the new cache generation; none of the audio, catalog, privacy or site gates are removed.

## Validation
`node hitster-fair-round-regression.cjs` executes 400 scenarios using production handlers with simulated DOM/media: standard and personal games, 2–10 teams, varied starting teams, Hebrew/English, ties, misses, free cards, reload mid-round, reload after completion, reset and global uniqueness. It also checks migration from the older save format.

The existing audio regression checks one-tap playback, pause/resume, stop/replay, 30-second cutoff, failed playback, saved offline clips, missing previews and no repeated songs. Physical iPhone Safari audibility is still manual verification.

## Boundaries
This is a focused implementation of the charter's concrete HITSTER mismatch, not a declaration that every TRA project or every device has been verified. Star-9 valuation and reward/redemption semantics remain unresolved in the canonical JSON; no value is inferred. PR59/PR60 chess integration is separate, and their branch checks do not establish that the chess changes are deployed. Memorial consent and access-control decisions are unaffected.
