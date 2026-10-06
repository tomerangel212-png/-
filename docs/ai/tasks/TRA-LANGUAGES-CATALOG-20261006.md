# TRA-LANGUAGES-CATALOG-20261006

State: review_ready (prepared checks recorded below; independent review and remote CI are separate)
Editor: ChatGPT, accountable editor for this task only
Branch: `tra/languages-catalog-2026-10-06`
Inspected base/current source commit: `29a8417021858f7c58d96857661693004ae0b5da`
Destination: focused pull request into `tomerangel212-png/-:main`; no merge or deployment authorized

## Requested result
Separate the broad language/dialect/accent identification catalog from the four working lesson packs. Use stable identifiers and primary-source provenance. Keep current content, routes, categories and user archives. Do not present a worldwide catalog as complete.

## Approved inputs and scope
Read `AGENTS.md`, `TRA-ART-TRY.md`, the existing inline language page, the shared handoff protocol, and the quality/Pages workflow triggers. The existing other task under `docs/ai/tasks/` concerns JESS-TO-TYM and is not edited or reassigned. IANA/RFC records are newly reviewed public identification sources; no personal files, credentials, participant records or other project data are imported.

Changed paths: `tra-languages.html`; new `tra-languages-data.js`, `tra-languages.js`, `tra-languages.test.cjs`, `tra-languages-browser.cjs`, `TRA_LANGUAGES_DATA.md`, `data/languages/catalog.json`, `data/languages/lesson-packs.json`, four `data/languages/lessons/*.json` files, `.github/workflows/tra-languages.yml`, and this task record. The existing `links/index.html` inbound link and existing deployment/quality workflows are unchanged.

## Implementation and evidence
- Ten individual-language records, two macrolanguages, four regional locales; zero researched dialect/accent records. Schema supports those distinct types without inventing standardized codes.
- Original twenty lesson pairs are preserved. SHA-256 regression expectations were extracted from original Git blob `81040ebd7fa453e7d7bd2960de3b354a618fb6cb` after checking its exact bytes against the connector's SHA.
- Node 22.16.0: 36 tests passed, zero failures. JavaScript syntax checks passed.
- Local Chromium DOM fixture checks passed for four complete games, four speech request tags, catalog-only status, optional note IDs, count zero, safe rendering, corrupt storage preservation, retry behavior, stale requests, independent catalog failure and 320/390/900px RTL layouts. No uncaught page errors; mobile screenshot visually reviewed. The fixture used simulated transport/storage/speech.
- The committed Playwright HTTP suite is ready for CI. The local environment denied URL navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`), so a local real-origin HTTP/storage result is not claimed. Real audio, Safari and physical devices have not been tested.

## Handoff and next action
Review the exact PR head commit and its diff against the recorded base; the PR creation response identifies the resulting commit without a self-referential in-file SHA. Check the new Languages CI job and existing repository checks separately. An independent reviewer should verify source semantics, storage preservation and the browser result before any later merge request. Do not treat this task, a green unit test, or a newly created PR as published production code.

History: 2026-10-06 adds the scoped data foundation and this new task. No earlier task, registry version, language pack or user archive was deleted.
