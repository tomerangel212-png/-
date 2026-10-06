# TRA Primate Lab publication

Task: 2026-10-06-primate-lab-publish
Editor: ChatGPT, on the owner's explicit request to publish the game.
Base: 17566d0f085c2a78a6e50dd36a1eaed7c9bfba43
Branch: publish/primate-lab-20261006

## Scope
Add the previously approved local TRA Primate Lab v1 as a standalone static page at `primate-lab/`. Preserve all existing files and routes. Do not publish or modify personal diary entries, unrelated source material, or existing games. The original diary remains unchanged.

Published application files: `primate-lab/index.html`, `primate-lab/core.js`, `primate-lab/app.js`, `primate-lab/style.css`. JavaScript and CSS retain the exact original archived bytes; the HTML template loads them as same-origin files instead of inline substitutions.

Exact original sound sequence (no normalization or correction):

> ב נ נננ. נננננ נננ הההההה

Default revisions, notes, lessons and game progress are empty. User data remains in the browser under `tra.primate-lab.v1.state`; there is no diary-cloud API, account, tracking script or microphone use. Local storage and exported backups are not encrypted. The interface differentiates fictional mechanics from sourced animal facts and is not affiliated with Sling Kong.

## Validation and release
Locally rerun: Node syntax checks for core.js and app.js, and all 2,103 original pure-function assertions for exact Unicode preservation, musical timeline, validated backup merge and ballistic intersection: passed.

Prior browser QA included simulated localStorage; it is not evidence of real-device persistence. No independent human review is claimed. PR comments record any additional current browser checks and the exact tested commit. Use the existing production checks and GitHub Pages workflow without bypassing their gates. A source commit is not proof of deployment; verify the Pages deployment and live route before calling it published.
