---
description: Create a new ticket in the backlog from a title.
argument-hint: <title> [--type product|factory|bug]
allowed-tools: Bash(*/scripts/ticket.sh:*), Read, Edit
---

Create a ticket for: **$ARGUMENTS**

1. `${CLAUDE_PLUGIN_ROOT}/scripts/ticket.sh new "<title>" <type>` (default type `product`).
2. Fill in **Goal**, **Context**, **Acceptance criteria (draft)** and **Out of scope**
   from what the human wrote. Write only what you were told — do not invent scope.
   Anything you are unsure about goes into the ticket as an open question, not a guess.
3. Leave `risk:` empty. The spec-writer sets it.
4. Print the file path and the Goal.

Do not start work on the ticket.

With `--dry-run`: print the ticket file you would write and stop.
