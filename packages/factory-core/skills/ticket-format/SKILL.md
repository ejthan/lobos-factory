---
name: ticket-format
description: Use when creating, reading or moving a factory ticket - the frontmatter fields, the state machine and the legal transitions.
---

# Ticket format

Files are the database. One ticket is one file: `<tickets>/<id>-<slug>.md`, id is three
digits, slug is kebab-case from the title.

```markdown
---
id: "001"
title: Bootstrap Nx workspace
type: product | factory | bug
risk: low | medium | high
state: backlog
created: 2026-09-17
branch: ticket/001-bootstrap-nx-workspace
pr: https://github.com/…/pull/12
spec: docs/specs/001.md
report: docs/reports/001.md
---

## Goal
## Context
## Acceptance criteria (draft)
## Out of scope
```

`type: factory` is the only type allowed to change factory files (AGENTS.md, `.claude/`,
`.factory.yml`, `docs/adr/`, `packages/factory-core/`). The factory never rebuilds itself
while it is building a product ticket.

## States

```
creation loop:  backlog → spec-draft → [GATE 1: human approves] → spec-approved
                → planned → in-review
quality loop:   in-review → changes-requested → planned (max 2 rounds)
                in-review → [GATE 2: human merges] → merged → done
```

Never edit `state:` by hand to get past a refusal. A refusal means a step was skipped.

## Reading and writing

Always through the script, never with an ad-hoc editor — it validates transitions and
writes the event log the reports are built from:

```bash
scripts/ticket.sh list [state]
scripts/ticket.sh show|path|get <id> [field]
scripts/ticket.sh set <id> <field> <value>
scripts/ticket.sh state <id> <new-state>
scripts/ticket.sh event <id> <name>      # step:<cmd> | pr-opened | intervention
scripts/ticket.sh current [<id>|--clear]
```

`event … intervention` is what the autonomous rate is computed from. Log it every time a
human has to step in outside the two gates. An honest low number is worth more than a
flattering high one.
