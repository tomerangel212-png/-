# Kfar Blum 2026: ten star types

## Draft integration status — 2026-10-04

This experimental ledger is **not loaded by hitster-mobile.html**. The current
`HITSTER_STAR_VALUES.json` remains the authoritative specification and has
`runtimeEnabled: false`; level 9 is explicitly unresolved. The 999 interpretation
and inactive levels described below are historical assumptions of this isolated
prototype, not approved live rules. Its arithmetic tests validate the prototype
only. Integration must first reconcile the ledger with the canonical specification.
The mobile wrapper retains the current audio cache version and existing game flow.
The Runtime section below documents the former experimental integration.

This is a manual host ledger, separate from legacy HITSTER tokens and victory rules. It is not a replacement game, authentication system, shared database, or auto-award rule.

The latest spoken correction is interpreted as **Star 9 = 999**, replacing its previously discussed 50,000 value. That interpretation is visible in the UI and in `ruleFor(9).interpretation`. IDs, quantities, and values are separate.

| Type | Active value | Status |
| --- | ---: | --- |
| 1 | 10 | User anchor |
| 2 | 20 | User anchor |
| 3 | 50 | User anchor |
| 4 | unset | Earlier assistant proposal only |
| 5 | 500 | User anchor |
| 6 | unset | Earlier assistant proposal only |
| 7 | unset | Earlier assistant proposal only |
| 8 | unset | Earlier assistant proposal only |
| 9 | 999 | Latest-turn interpretation |
| 10 | unset | Earlier assistant proposal only |

This is a custom scale, not an exponential mathematical sequence. Happy/sad star names are not silently mapped to numbered types. No final-game winner/tie-break formula has been assumed.

## Runtime

`hitster-mobile.html?entry=kfar-bloom` mounts the ledger inside the existing same-origin game iframe. English uses `&lang=en`. Other entries do not mount it. Host-entered quantities replace prior quantities, so repeated entry does not double-award. Each team is isolated. Unapproved types cannot receive a nonzero quantity. Local saving uses a separate versioned key and handles blocked storage; it is not synchronized across devices. Resetting this ledger requires confirmation and never changes game timelines. Game reset and ledger reset are deliberately separate and labeled.

The extension never changes the audio player, song answers, score tokens, existing wins, or PostHog events. No private memory/person mapping is added. The existing one-token skip and three-token card rules are not converted into points.

## Validation

Local Node tests: 20/20 pass (`node --test hitster-star-ledger.test.cjs`).
Local Chromium offline fixture tests: 15/15 pass, including mobile layout, Hebrew/English rendering, team isolation, repeat mount, hidden answers, token preservation, and blocked simulated storage. These are not real-site/real-device tests or an audio-output test. The whole-wrapper browser navigation test was blocked by the execution environment, so end-to-end hosting is not claimed.

The pre-existing main deployment for c53c4b9db560897ae93140e9c74229dbc759f0e5 failed before this extension (run 37196832787, annual HITSTER release gate; deploy skipped). No existing quality gate is disabled or weakened by this change. Live release requires those checks to pass and a real-browser Kfar route test.
