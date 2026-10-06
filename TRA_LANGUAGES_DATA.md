# TRA Languages — data foundation v1

Task: `TRA-LANGUAGES-CATALOG-20261006`  
Source snapshot: `29a8417021858f7c58d96857661693004ae0b5da`  
Public name: Tomer Angel · TRA Languages

## What exists, and what does not

This is an extensible **seed catalog**, not all human languages. There are 10 individual-language records, 2 macrolanguage records, 4 regional-locale records, **zero researched dialect records and zero researched accent records**. Those numbers are calculated from `catalog.json`; do not add them to the application as a second source of truth.

Only English, Español, Français and Italiano have playable packs: the same five source/translation pairs in each pack, with the same Hebrew vocalization and `en-US`, `es-ES`, `fr-FR`, `it-IT` speech requests. A catalog record is not a lesson, pronunciation inventory, device voice, completed course or proof of comprehensive linguistic documentation. American Sign Language is an identification record only, not a speech-synthesis lesson.

## Boundaries and files

- `data/languages/catalog.json`: versioned, sourced identification records and explicit incomplete coverage; no lesson items or voice promises.
- `data/languages/lesson-packs.json`: the independent playable-pack manifest. An entry joins to a catalog entity by stable ID, not its display label, and resolves a relative JSON path.
- `data/languages/lessons/{en,es,fr,it}.json`: individual content packs, requested on selection and cached in memory for that page session. Each includes provenance to the inspected original Git commit.
- `tra-languages-data.js`: shared browser/Node v1 contract validators, reference checks, derived coverage and lazy retryable JSON loading. No framework or runtime dependency.
- `tra-languages.js` and `tra-languages.html`: controller and view. The learning menu comes only from the pack manifest. Catalog search and ID suggestions render at most 50 matches at a time, without limiting stored records.

The existing `tra-languages.html` URL, `links/index.html` inbound link, navigation, credit, Archive/Language/Model/Learning/Adaptation categories and storage keys remain intact. No global principle registry, unrelated game or existing deployment workflow is edited.

## Identity and provenance contract

`catalog.json` has `schemaVersion: 1`, a `coverage` object (`status: seed`, `complete: false`, an explanatory note), `sources`, and `entities`.

A source requires `id`, `title`, an HTTPS `url`, `version` and `retrievedOn`. Every entity requires an immutable project `id`, `kind`, `name`, `bcp47` and at least one `{sourceId, record}` reference. The ID is a join key, not a claim that TRA is a standards authority. Do not change an ID when a display name changes.

Supported `kind` values are `language`, `macrolanguage`, `locale`, `dialect`, and `accent`. Language records use primary subtags; `macrolanguageId` records sourced macrolanguage membership without relabeling an individual language as an accent. Locale/dialect/accent records require a resolvable `parentId`; cycles are rejected. A researched dialect or accent may have `bcp47: null` and a stable local ID when no applicable registered tag is known. **Do not fabricate ISO codes, Glottocodes, BCP 47 tags, phoneme inventories or classification sources.** ISO 639-3/Glottolog data have not been imported in this seed.

Regional tags are composed from sourced subtags according to RFC 5646. They are not names for all accents spoken within a country. The source registry does not settle every sociolinguistic classification. V1 checks the structural tag subset used here and cross-references; it is **not a full BCP 47 parser or an independent source-authenticity validator**. New registrations, deprecated aliases and finer classifications require source review, not just passing a regex.

Each pack descriptor requires a unique `id`, `label`, `entityId`, and safe `lessons/<filename>.json` path. Pack files repeat the identity and add `translationLanguage`, optional speech capability (`speechTag` may be null), source `provenance` and a nonempty `items` array of source/translation pairs. The engine uses `items.length`, not a fixed five-item limit. The v1 engine still implements this simple recall activity; the catalog does not imply all modalities have a lesson engine.

## Sources checked on 6 October 2026

1. IANA Language Subtag Registry, observed `File-Date: 2026-09-17`: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
   The seed references the `Type: language` records for en, es, fr, it, he, ar, de, pt, zh, cmn, yue and ase, plus the US, ES, FR and IT region records. `ar` and `zh` have macrolanguage scope; `cmn` and `yue` have macrolanguage `zh`. Names and identifiers retain their source meaning; no full registry has been mirrored.
2. RFC 5646, September 2009, especially section 2.2.4 on region subtags: https://www.rfc-editor.org/rfc/rfc5646
3. Original TRA lesson content: https://github.com/tomerangel212-png/-/blob/29a8417021858f7c58d96857661693004ae0b5da/tra-languages.html
   Git blob: `81040ebd7fa453e7d7bd2960de3b354a618fb6cb`. Preserving those phrases is not a claim of a new linguistic review.

The JSON records retain source attribution and retrieval/version metadata. The TRA footer does not confer ownership of third-party identifiers. Before bulk-importing another dataset, record its exact release, license/terms and field-level provenance; preserve attribution and review retirement/alias mappings rather than silently merging distinct entities.

## Adding data without overstating coverage

Add a researched catalog record first: check the identifier and classification against a primary source, assign a stable ID, cite a precise record/section and resolve its relationships. A catalog-only record stays out of the learning menu. Do not use region codes as shortcuts for dialect research.

To add a real lesson, separately create a sourced pack and add its manifest entry. Verify the translations, content rights, modality, optional speech locale and actual loading behavior. Extend regression expectations intentionally. Do not create empty lesson files or placeholder packs to inflate coverage.

For a large import, keep it out of the HTML: add a versioned offline import/review step, deduplicate using verified identifiers (not names), report actual per-type totals and missing fields, and consider catalog shards or search indexing before scaling transport. This PR supplies the data boundary and bounded rendering, not a bulk importer, a comprehensive registry, an accent recognizer or a shared database.

## Existing personal Language Map

`traLanguagesSoundMap` remains a separate local user archive. Existing rows and unknown historical fields are not automatically rewritten, deleted or promoted into the sourced catalog. A new row can optionally link `catalogId`; all old language, dialect/accent, grapheme, sequence, IPA, word and category fields remain free text. New rows are marked `provenance: user-supplied`. A source label typed by a user is not verification of a phonetic claim.

Rendering uses text nodes, not HTML generated from stored strings. Count zero is preserved. Corrupt or unavailable storage produces a visible message and is not overwritten. `traLanguagesLastScore` still stores the completed score; there is no claim of per-question saved progress or cloud synchronization.

## Loading, failure and compatibility

Serve the directory over HTTP(S), for example `python3 -m http.server 8000`, and open `/tra-languages.html`. Asset paths are relative and the browser test also serves the app under `/-/`, matching project-site deployment. The new JSON transport is not intended for double-clicked `file://` loading.

Catalog and lesson loading are independent. Failed HTTP/JSON/contract requests are evicted from the session cache and can be retried. A failed pack does not prevent selecting another pack. A request token prevents an old selection's delayed response from replacing the new selection. Personal notes remain independent of both data loads.

No autoplay is introduced. Speech remains a best-effort device capability, invoked by a user gesture; requested locale is not proof of an installed matching voice. Written lessons remain usable without speech.

The view has Hebrew RTL, vocalized Hebrew UI text, native pack labels, labeled controls and live load/error messages. Only the final score and user notes are persisted. **There is no new durable offline asset cache**: an already opened pack remains usable in the current session, but an unvisited pack or a fresh offline page load may fail. Do not claim universal device support, offline installation or physical iOS/Android/Windows validation from these tests.

## Tests and review

```sh
node --check tra-languages-data.js
node --check tra-languages.js
node --check tra-languages-browser.cjs
node --test tra-languages.test.cjs
# With Playwright available (the workflow installs an isolated, pinned copy):
node tra-languages-browser.cjs
```

The 36 Node tests check the source-item hashes, four speech mappings, schema/version/coverage invariants, source and parent references, cycles, unsafe paths, missing/invalid packs, lazy requests, retries and preserved routes/categories. Source semantics still require human review.

The committed browser test exercises all four full games, real localStorage preservation, source-text rendering safety, unavailable assets, retry behavior, selection races, keyboard use, RTL and widths of 320/390/900 pixels over a local project-subpath HTTP server. Speech is stubbed: it validates requested text/tags, not audible pronunciation.

Local preparation ran the 36 Node tests successfully. Chromium DOM checks also passed with fixture-backed data transport and a simulated storage/speech layer, and the mobile rendering was inspected. The local environment blocked browser URL navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; the committed HTTP/browser suite could not run there. The new read-only CI workflow runs that full suite. Report its observed run result separately; a workflow file is not a passing run. No live-site, Safari, physical-device or independent reviewer result is claimed by this document.

© 2026 Tomer Rafael Angel · TRA. Third-party source rights remain with their respective holders.
