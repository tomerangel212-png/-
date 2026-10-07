# ORIENTATION-KNOWLEDGE-20261006

Editor: ChatGPT. Branch: `feat/orientation-knowledge-preservation-20261006`.
Base commit: `17566d0f085c2a78a6e50dd36a1eaed7c9bfba43`.
Scope: public orientation timetable integration and the requested knowledge-preservation principle.

## Changes
- Add `tra-orientation.html` under the existing navigation section in `links/index.html`. Preserve all existing links and clarify that the government-site note refers to transport links.
- Add `data/navigation/huji-orientation-06-10.json`: 41 entries, source labels, vocalized display labels, source-image SHA-256, explicit uncertainty and non-personal metadata.
- Preserve the social-work exception: auditorium 283, 13:15–14:45. Preserve PPE: room 21205, round A only. General rounds: A 13:15–14:00, B 14:15–15:00.
- Bump `TRA_PRINCIPLES.json` from 1.3.0 to 1.4.0. Retain all 36 existing principles verbatim and add `knowledge-preservation`. Keep existing governance safeguards.
- Add `scripts/check_orientation.py` for repeatable checks.

## Evidence
- Reconstructed baseline source bytes matched Git blob SHAs before editing: principles `3425c03f409ad712511dad82c9770528b0cb5b40`; links `3de92fcf5d281b32dbb148b99c1e150b3d703b7d`.
- `python3 scripts/check_orientation.py`: passed locally.
- Extracted page JavaScript: `node --check` passed.
- Local comparison: all existing principle objects, governance safeguards and navigation hrefs retained.
- Chromium via Playwright `set_content`: 320×720, 390×844 and 1440×900 passed; no horizontal overflow or page errors. Search checked with niqqud, auditorium number, PPE without quote marks, no-match input, and clear/focus behavior.
- JavaScript-disabled, offline DOM rendering retained all 41 rows. File-scheme navigation was blocked by the browser environment, so this is not an end-to-end file-open test.
- New orientation page has no third-party scripts, network search, location request, attendance tracking or persistent search state. Existing analytics on unrelated pages were not modified or audited.

## Limits and release state
The source poster says 6.10 but prints no year. No year, current-live status, floor, entrance, coordinates or accessible indoor route was invented. Source punctuation is typographically normalized; display niqqud is editorial.

Prepared and locally tested. This document is not evidence of independent review, repository-wide CI success, merge, deployment or live HTTP verification. Review the final PR commit separately before any release.
