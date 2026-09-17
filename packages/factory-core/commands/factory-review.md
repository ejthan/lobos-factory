---
description: Review the PR of a ticket (quality loop). Max 2 rounds, then ask the human.
argument-hint: <id> [--dry-run]
allowed-tools: Bash(*), Read, Glob, Grep, Task
---

Review ticket **$1**.

1. `ticket.sh show $1`. Refuse unless state is `in-review`.
2. `ticket.sh event $1 step:review`. Take the diff with `vcs.sh pr-diff <pr>`.
3. Delegate to the **reviewer** subagent. It is adversarial and read-only: security,
   the rules in AGENTS.md, architecture boundaries, test gaps, acceptance criteria not
   covered. Every finding is `blocking` or `note`, each with file and line.
4. Post the findings with `vcs.sh pr-comment <pr> <file>`.
5. No blocking finding → print "clean, waiting for merge" and stop. This is human gate 2.
6. Blocking findings → `ticket.sh state $1 changes-requested`, hand the findings to the
   **implementer** in the existing worktree, then review again.
7. After **2 rounds** stop regardless and ask the human what to do. Log
   `ticket.sh event $1 intervention` when you hand back.

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`.
With `--dry-run`: print the PR you would review and stop.
