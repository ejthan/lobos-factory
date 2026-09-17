---
name: adr-writing
description: Use when a decision is made that code will depend on - writing an architecture decision record before the code lands.
---

# ADRs

An ADR is written **before** the code depends on the decision, in the planning step, and
lands in the same PR as the code.

`docs/adr/NNNN-kebab-title.md`, numbered sequentially, never renumbered.

```markdown
# NNNN — <decision in one line>

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD
- Ticket: <id>

## Context
The forces. What is true in this repo that makes this a question at all.

## Decision
What we do, in the active voice. "We use X."

## Consequences
What gets easier. What gets harder. What we can no longer do cheaply.

## Alternatives
Each one, and the single reason it lost.
```

Write an ADR when the decision is expensive to reverse: a framework, a data format, a
boundary, a protocol, a persistence choice. Do not write one for a variable name or a
library you could swap in an afternoon.

The `## Consequences` section is the one a colleague reads in a year. An ADR with only
upsides in it was not a decision, it was an advert.
