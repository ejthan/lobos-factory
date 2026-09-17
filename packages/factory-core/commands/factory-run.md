---
description: Run a ticket through the whole loop, pausing at the two human gates.
argument-hint: <id> [--step] [--dry-run]
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, Task
---

Run ticket **$1** through the factory.

Start from its current state and walk the chain, each step being the matching command:

```
backlog        → /factory-core:factory-spec       → stop: GATE 1, the human approves the spec
spec-approved  → /factory-core:factory-plan → /factory-core:factory-implement → stop: GATE 2, the human merges
merged         → /factory-core:factory-release    → done
```

Rules:

- Stop at the two gates. Print exactly what the human has to do and the command to resume.
- After `/factory-core:factory-implement`, run `/factory-core:factory-review` before handing over to the human.
- `--step`: stop after every command and wait for "continue".
- Any step that fails twice: stop, `ticket.sh event $1 intervention`, and report what broke
  and what you tried. Never loop.
- Never skip a state. Never move a state by hand to get past a refusal.

With `--dry-run`: print the chain of commands from the current state and stop.
