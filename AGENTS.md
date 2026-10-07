# TRA shared agent instructions

These are project working instructions, not authentication, permission enforcement, or an active multi-agent service.

## Read before acting
Read the relevant source files, and the active task under `docs/ai/tasks/`. Use `docs/ai/TRA-COLLABORATION.md` for handoffs. Preserve existing project principles and history.

## One task, one accountable editor
Record the task ID, current branch and commit, editor, changed paths, tests, and blockers. Do not overwrite another agent's unreviewed changes. A task owner is a coordination convention, not a technical lock. An independent reviewer checks the exact resulting commit.

## Change boundaries
- Work on a task branch. Do not push to `main`, merge, deploy, change sharing, or install integrations unless the current request authorizes that exact action and target.
- Never interpret a handoff request as permission to change production or every TRA project.
- Preserve existing files, routes, approved content, and version history. Prefer additive, narrowly scoped changes.
- Read workflow triggers before creating changes: the existing Pages workflow publishes on pushes to `main`.
- Do not invent artifact-to-repository mappings. A shared viewing URL is not proof of source access.

## Truth and privacy
- Distinguish prepared, committed, tested, reviewed, and published. Attach evidence and state unrun tests explicitly.
- Do not claim an integration, cross-assistant message, or shared memory works without an observed successful operation.
- Keep credentials and unrelated personal information out of code, task notes, commits, and logs.
- Do not infer identities from photographs or add unapproved biographical facts. Keep the project owner distinct from the person being remembered.
- Keep Hebrew user-facing text fully vocalized where compatible with the approved wording; preserve identifiers, URLs, filenames, and brand names. Use correct native Hebrew and English structures.

## Review expectations
Review the diff against the recorded base. Run checks relevant to the actual changed files. For interface changes, verify Hebrew RTL, mobile layout, accessibility, asset loading, and absence of unrelated changes. A successful static check is not a browser test or proof of publication.
