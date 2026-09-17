---
description: Turn an approved spec into a minimal-change plan (creation loop, step 2).
argument-hint: <id> [--dry-run]
allowed-tools: Bash(*/scripts/*.sh:*), Read, Write, Edit, Glob, Grep, Task
---

Plan for ticket **$1**.

1. `ticket.sh show $1`. Refuse unless state is `spec-approved` or `changes-requested`.
   If it is `spec-draft`, say the spec is not approved yet and print the approve command.
2. `ticket.sh current $1`, `ticket.sh event $1 step:plan`.
3. Delegate to the **architect** subagent with the ticket and `docs/specs/$1.md`.
   It produces, appended to the spec file under `## Plan`: the file-by-file change list,
   the test list (unit + at least one Playwright e2e), the rollback procedure, and a
   draft ADR under `docs/adr/` for every decision code will depend on.
4. No plan may invent an API. Anything not verified in this repo or in fetched docs is
   an open question for the human.
5. `ticket.sh state $1 planned`, commit `chore(factory): plan for $1`.
6. Print the change list and `/factory-core:factory-implement $1`.

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`.
With `--dry-run`: print the steps and the target files, touch nothing.
