---
description: Write the spec for a ticket (creation loop, step 1). Stops at the human gate.
argument-hint: <id> [--dry-run]
allowed-tools: Bash(*/scripts/*.sh:*), Read, Write, Edit, Glob, Grep, Task
---

Spec for ticket **$1**.

1. `ticket.sh show $1`. Refuse unless state is `backlog` or `spec-draft`, and say which
   command applies instead.
2. `ticket.sh current $1` and `ticket.sh event $1 step:spec`.
3. Delegate to the **spec-writer** subagent. Give it the ticket and the repo.
4. The spec-writer writes `docs/specs/$1.md` with Gherkin acceptance criteria and a
   risk class (skill `risk-classification`). If anything material is unclear it asks
   the human here instead of guessing — one round of questions, then finish.
5. `ticket.sh set $1 spec docs/specs/$1.md`, `ticket.sh set $1 risk <class>`,
   `ticket.sh state $1 spec-draft`.
6. Commit `chore(factory): spec for $1`.

Then **stop**. This is human gate 1. Print:

> Spec ready: docs/specs/$1.md — approve with
> `packages/factory-core/scripts/ticket.sh state $1 spec-approved`, then `/factory-core:factory-plan $1`.

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`.
With `--dry-run`: print the steps and the target files, touch nothing.
