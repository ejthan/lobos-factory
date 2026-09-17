# Tickets

One ticket, one file: `<id>-<slug>.md`. The frontmatter is the database — the board, the
reports and the state machine all read it. See the `ticket-format` skill for the fields.

```
backlog → spec-draft → [GATE 1: human approves the spec] → spec-approved
        → planned → in-review → [GATE 2: human merges] → merged → done
                  ↳ changes-requested (max 2 review rounds)
```

Create one with `/factory-core:factory-intake "<title>"`, run it with `/factory-core:factory-run <id>`, see the board
with `/factory-core:factory-status`. Never edit `state:` by hand to get past a refusal.
