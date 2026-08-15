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

## Enforced release gate
GitHub Pages deployment now depends on `node hitster-quality-check.js` passing.

The automated gate blocks deployment when:
1. A card is missing title, artist, integer year, era, or a valid Apple Music URL.
2. A card's year does not match its era.
3. A card falls outside the supported 1960–2026 range.
4. The 1960–1969 category contains any year outside 1960–1969.
5. The same title + artist + year identity appears more than once.
6. The songs dataset is empty or cannot be parsed.

## Remaining release targets
These require dedicated runtime/integration checks before they can honestly be called automatically enforced:
- Audio preview actually loads and plays for 20 seconds.
- Reveal inserts the card only into the active team's timeline.
- Full-session gameplay finishes without a critical failure.
- Mobile/iPhone reliability and interaction latency meet their targets.

## Known regression to prevent
The 1960–1969 category must never surface tracks from the 2020s or any year outside 1960–1969.

## TRA principle
Accuracy before expansion. Fix, validate, then publish.
