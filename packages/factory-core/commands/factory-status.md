---
description: Show the ticket board for this repo in the terminal.
argument-hint: "[state]"
allowed-tools: Bash(*/scripts/ticket.sh:*), Bash(*/scripts/cfg.sh:*)
---

Run `${CLAUDE_PLUGIN_ROOT}/scripts/ticket.sh list $1` and print it as a board:
one section per state in this order — backlog, spec-draft, spec-approved, planned,
in-review, changes-requested, merged, done — with `id  risk  title` per line.
Mark the two human gates: tickets in `spec-draft` wait for spec approval, tickets
in `in-review` wait for a merge. End with the single most useful next command.

Print nothing else.
