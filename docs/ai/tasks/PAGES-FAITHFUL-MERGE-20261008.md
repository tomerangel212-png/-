# PAGES-FAITHFUL-MERGE-20261008

Editor: Codex
Branch: `integrate/pages-privacy-node24-20261008`
Base: `1662411ec88ef10d424f2b1b81962537801a2a38`
Authorization: user requested merging both reviewed Pages fixes while preserving the originals on 2026-10-08.

## Original inputs and preservation

- PR #90: `0439d2fa20ed97d56ffe0f65dcaa149a56159fd5`.
- PR #91: `75086e2098f52f65e8a5769104f343aea56c3a10`.
- Both source commits are retained as ancestors through merge commits.
- The single conflict in Configure Pages retains PR #90's non-PR condition and PR #91's v6 action.
- Relative to PR #90, pages.yml has exactly PR #91's four Action version substitutions.
- Original manifest, staging implementation, tests and task record remain byte-for-byte unchanged.
- Application content, privacy exclusions, artifact names, deployment environment, permissions and production concurrency remain as specified by the original fixes.
- This record is excluded from the public allowlist.

## Checks and completion evidence

- Five staging regression tests passed locally on Node v24.19.0.
- Independent exact-commit review and combined GitHub CI results will be recorded in the integration PR.
- The combined PR exercises the original PR build path, including the upgraded artifact upload Actions.
- The user's merge request authorizes the existing main push deployment trigger. Verify production deployment, post-deploy privacy checks and downstream HTTP checks after merge; do not weaken environment protections.
- No authenticated manual workflow dispatch is claimed. A successful PR build is not a production deployment.

Changed paths comprise PR #90's five files, PR #91's four substitutions in pages.yml, and this record. Original task scope statements are retained as historical records; this later user authorization permits the integration merge.
