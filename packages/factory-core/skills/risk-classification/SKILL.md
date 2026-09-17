---
name: risk-classification
description: Use when setting the risk field on a ticket or spec - what counts as low, medium or high risk and why it matters.
---

# Risk classification

One field, three values, set by the spec-writer.

| risk | what it covers |
|---|---|
| `low` | docs, tests, comments, dependency patch updates, pure refactoring with no behaviour change |
| `medium` | new UI, new endpoint, new logic — **without** touching stored data or permissions |
| `high` | persistence (schema, migrations, writes), auth or permissions, payments, any ERP boundary, anything that deletes or overwrites data |

Rules of thumb:

- If a bug in this change would be visible in the database tomorrow, it is `high`.
- If a bug would be visible on screen and fixable by a redeploy, it is `medium`.
- If nothing ships to a user, it is `low`.
- When you hesitate between two, take the higher one. The cost of being wrong is not symmetric.

Write the class into the spec as `<class> — because <one sentence>`. The sentence is the
part that matters; it is what the human reads at the gate.

## What it does today

Nothing. Both gates apply to every ticket. The field exists so the team can decide later
whether `low` tickets may skip gate 2 — and so the discussion has data instead of opinions.
Do not build the escalation logic until that decision is made.
