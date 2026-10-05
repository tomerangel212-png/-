# TRA shared AI handoff protocol

Version: 1.0-draft | Recorded: 2026-10-05 | Timezone: Asia/Jerusalem
Repository: `tomerangel212-png/-`
Inspected main commit: `0a4e0b3f346c89ec5053ca97f5d2f084e1a27da6`
Working branch: `tra/ai-handoff-2026-10-05`

## Purpose
Use one repository task record instead of separate, conflicting project copies. ChatGPT/Codex, Claude Code, and any separately authorized third assistant can use the same record when their own tool access is verified. This document does not connect the assistants or activate a service.

## Evidence and current limits
Repository files and workflow definitions were read through the connected GitHub tool. The exact Claude artifact ID in the active memorial task produced no code-search results on the default branch. Related memorial content exists in `tomer-jeep.html` and `sources/tomer-jeep-2026-10-05.md`, but that does not establish that either is the source of the requested artifact.

No successful Claude-side read, Claude Code run, third-assistant run, or cross-assistant round trip has been observed in this task. The third assistant has not been identified for this handoff; do not guess its identity. App installation, credentials, and external session access remain unverified.

The current `.github/workflows/pages.yml` runs on a push to `main` and contains a deployment job. Keep these draft additions off `main`. No workflow, credential, production file, or permission change is included in this handoff.

## Handoff record
Every task records its ID, requested result, exact destination, approved inputs, base commit, assigned editor, changed files, checks actually run, blockers, and next action. When work changes hands, the receiving agent reads those files at the exact recorded commit and adds its own result and evidence. Use one editor at a time; this is a process rule, not an automatic locking mechanism.

Suggested states: prepared -> in_progress -> review_ready -> reviewed -> published. Use blocked with the missing input stated explicitly. Do not mark a state complete because a plan or instruction file exists.

## Connecting Claude Code separately
First verify that Claude Code can read this branch and summarize the task without changing anything. A local Claude Code session can use the repository without GitHub Actions automation.

For optional GitHub Actions operation, the repository owner can run `/install-github-app` from Claude Code opened in the repository. Follow the official setup prompts for the app and authentication. This handoff has not run that setup and includes no runnable AI workflow. Review the generated workflow and cost/permission scope separately. Never paste API keys or OAuth tokens into a conversation or tracked file. Only call the integration active after an authorized test produces a real response tied to a run or commit.

The `AGENTS.md` entry point is intended for Codex; `CLAUDE.md` imports that same guidance for Claude Code. Having matching guidance is not the same as shared private conversation history, automatic synchronization, or mutual access to artifacts.

## Current task
Read [JESS-TO-TYM](tasks/JESS-TO-TYM.md). Do not edit a similar-looking page as a substitute for the exact requested Claude artifact.

## Validation and history
This revision adds documentation only. Application tests and physical-device tests are not claimed. Review the four-file diff and preserve all existing files. Record any actual CI run separately; a draft PR is not a passing test or a deployment.

2026-10-05: 1.0-draft adds shared instructions, a Claude entry point, this protocol, and the memorial task. Existing project files and the live artifact are unchanged by this revision.

## Official references checked 2026-10-05
- OpenAI, repository instructions: https://developers.openai.com/codex/guides/agents-md
- Anthropic, project instructions and imports: https://code.claude.com/docs/en/memory
- Anthropic, optional GitHub Actions setup: https://code.claude.com/docs/en/github-actions
