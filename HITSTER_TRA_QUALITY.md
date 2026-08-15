# HITSTER TRA — 99.9999999999 Quality Standard

## Mission
Zero wrong cards. HITSTER TRA must prioritize data accuracy and uninterrupted gameplay before adding new features.

## Non-negotiable targets
- Decade classification accuracy: 100%
- Release year accuracy: 100%
- Artist + title accuracy: 100%
- Audio availability: 99.99%+
- Audio clip target: 20 seconds
- No forced external navigation when an in-app playback path is available
- Team timelines stay fully separated
- Revealed cards are inserted into the correct team's timeline automatically
- No unintended duplicates
- Mobile/iPhone reliability: 99.9%+
- Normal interaction response: under 1 second
- Critical crashes: 0

## Scoring model
HITSTER Score = 40% data accuracy + 20% audio + 15% game rules + 10% UX + 10% stability + 5% speed.

Hard rule: any wrong decade or wrong release year caps the quality score at 90.

## Release gate
Do not publish new song batches unless:
1. Every card has a validated releaseYear.
2. releaseYear matches the selected decade range.
3. The audio preview loads and plays.
4. Reveal adds the card only to the active team's timeline.
5. A complete game session can be finished without a critical failure.

## Known regression to prevent
The 1960–1969 category must never surface tracks from the 2020s or any year outside 1960–1969.

## TRA principle
Accuracy before expansion. Fix, validate, then publish.
