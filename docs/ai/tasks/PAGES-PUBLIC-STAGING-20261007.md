# PAGES-PUBLIC-STAGING-20261007

Status: review_ready
Editor: Codex
Repository: `tomerangel212-png/-`
Branch: `fix/pages-public-staging`
Base commit: `2b238ff47da51c7b64aaf48bb14999ab91ef64a3`
Resulting commit: the commit containing this record; exact SHA and CI evidence belong in the PR.

## Scope

Create an isolated PR that stages public content before `upload-pages-artifact`,
blocks `TRA_PRINCIPLES.json`, `TRA-ART-TRY.md`, and `tra-art-try.html` before upload,
and preserves public routes and post-deployment 404 checks. No Actions version,
Node migration, quality runner, or application-content changes. Merge is not requested.

The three private files are already absent on the inspected main. The new guard
also covers their future reintroduction into the checkout.

## Changed paths

- `.github/pages-public-files.txt`: explicit public files, preserving all 53 HTML
  routes, runtime assets, public data, existing public documentation, and history.
- `scripts/stage-pages.cjs`: copy only approved regular files into a fresh output
  directory and independently verify exact membership, bytes, and privacy exclusions.
- `scripts/stage-pages.test.cjs`: private-file, archive, symlink, stale-output,
  missing-file, route, and offline-asset regressions.
- `.github/workflows/pages.yml`: stage after the generated chart snapshot, verify
  before upload, and exercise the same artifact build on PRs without deploying.
  PR concurrency is isolated from production deployment runs.
- This task record (excluded from the public artifact).

Build scripts, regression tests, AI instructions/handoffs, and incidental browser
screenshots are not website content. The manifest is explicit: new public files
must be added intentionally; route checks reject missing local HTML references.

## Validation and remaining evidence

- Five focused staging tests pass, including Linux tar flags used by upload-pages-artifact v4.
- Actual staging: 125 files; all 53 HTML routes and local references pass the existing route checker.
- Existing constitution privacy check passes.
- YAML comparison confirms unchanged deploy/404 steps, Action versions, and `quality.yml`.
- PR CI, independent review of the resulting commit, and live HTTP results are
  recorded in the PR after execution. Local/PR checks alone are not a deployment.

## Deployment

The requested Pages run can use `workflow_dispatch` on this branch. GitHub's
existing environment restrictions still apply; do not weaken them or merge merely
to bypass them. Post-deployment 404 checks and the Live HTTP workflow remain intact.
At preparation time the connector has no workflow-dispatch operation and the
browser is signed out. An authenticated workflow dispatch remains to be verified.
