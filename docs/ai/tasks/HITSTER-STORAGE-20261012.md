# HITSTER storage recovery — 2026-10-12

Task: HITSTER-STORAGE-20261012. Editor: Codex.
Branch: fix/hitster-saved-setup-20261012.
Base: 500b2267b65bda43fde7f2c3d20ad9b752ed2f19.
Status: fixed and locally tested; independent commit review and publication pending.

Scope: user requested code troubleshooting for TRA - HIT STER using GitHub, PostHog and Base44. Repository identity verified through GitHub metadata and local origin. This repository has not been verified as the source of the separate kfar-bloom-2026.chatgpt.site project.

Reproduction: loading hitster-personal.js with localStorage values of JSON null throws Cannot read properties of null (reading team-1). A five-entry songs array containing null also crashes setup. The two settings reads previously shared a catch, so invalid setup JSON prevented valid scores from loading.

Change: validate each stored object independently; fall back to default songs when saved entries are invalid; reject non-string title/artist fields. Added a startup regression using the production script with simulated DOM and pending network, and included it in the existing personal-mode CI step.

Paths: hitster-personal.js, hitster-personal-core.js, hitster-personal-storage-regression.cjs, .github/workflows/pages.yml, this record.

Validation: startup regression covers JSON null, arrays, primitives, malformed JSON, invalid song entries, blocked storage, and independent preservation of valid settings/scores. Existing personal-mode, audio/lives, 888-card, generation and 21-card quality checks passed. JavaScript syntax and git diff checks passed. No real-browser or physical-device verification claimed.

Connections: GitHub repository accessible with push permission. Base44 returned only Tomer’s Diary and the memorial app; neither is mapped to TRA - HIT STER, so no remote app edits. PostHog active project is 529891 (Default project); project-specific skills unavailable because llm_skill:read is missing. No production errors attributed to this game and no analytics configuration changed.

Next: review exact patch and run CI before any production merge. Preserve the current Sites audience and source identity if working on that separate deployment.
