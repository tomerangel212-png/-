# TRA-BANK-212-REGRESSION-20261007

Status: review_ready
Editor: Codex
Branch: `test/tra-bank-212-regression-20261007`
Base/current starting commit: `2b238ff47da51c7b64aaf48bb14999ab91ef64a3`
Destination: isolated pull request to `tomerangel212-png/-`, base `main`.

## Scope

Add minimal executable regression coverage for the existing TRA BANK 212 inline
script: opening 9,999 tokens, nonnegative balance, local save/reload and confirmed
reset. Preserve virtual-only/no-real-money notices and unrelated local storage.
Wire the regression into `quality.yml` and check the bank route/title in
`live-http.yml`. No application changes, Actions upgrades, runtime changes,
merge, or deployment are included.

## Changed paths

- `tra-bank-212-regression.cjs`
- `.github/workflows/quality.yml`
- `.github/workflows/live-http.yml`
- This task record.

## Evidence and next action

- All 17 executable steps from the updated `quality.yml` passed locally on
  Node v24.19.0, including the bank regression, site smoke and route integrity.
  The bank syntax/behavior check was rerun after its final assertion refinement.
- Six temporary application mutations were each rejected: wrong opening balance,
  missing overdraft guard, disabled save, disabled load, ineffective reset, and
  reset clearing unrelated local storage. The actual application is unchanged.
- Both workflow files parse as YAML; the live HTTP script passes `bash -n`.
- The new live bank check passed: HTTP 200 containing `TRA BANK 212`.
- `git diff --check` passed. No browser/device test is claimed for the VM harness.

No blocker identified. Independent review of the resulting commit is next.
Final commit, review, complete live HTTP result, and GitHub CI evidence will be
recorded in the pull request so recording that SHA does not change the reviewed
commit. Opening the PR is authorized; merge/deployment is outside this task.
