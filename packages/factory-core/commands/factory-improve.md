---
description: Read quality.md and propose improvement tickets. Does not start them.
allowed-tools: Bash(*/scripts/ticket.sh:*), Read, Write, Edit
---

Read `docs/quality.md` and `docs/reports/*.md`.

Propose **at most 3** tickets against the weakest areas — the ones that would raise a grade
or remove a known weakness. For each: `ticket.sh new "<title>" <type>`, then fill Goal,
Context and draft acceptance criteria with the evidence from quality.md (quote the line).

They stay in `backlog`. Do not spec them, do not build them.

Print the three titles and why each was chosen. If quality.md gives no evidence for an
improvement, say so and create nothing.
