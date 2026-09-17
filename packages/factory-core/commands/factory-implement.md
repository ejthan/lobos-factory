---
description: Build the ticket in a worktree and open a PR (creation loop, step 3).
argument-hint: <id> [--dry-run]
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, Task
---

Implement ticket **$1**.

1. `ticket.sh show $1`. Refuse unless state is `planned`.
2. `ticket.sh current $1`, `ticket.sh event $1 step:implement`.
3. Branch `ticket/$1-<slug>` in a worktree under `.factory/worktrees/$1`:
   `git worktree add -b ticket/$1-<slug> .factory/worktrees/$1 <defaultBranch>`.
   `ticket.sh set $1 branch ticket/$1-<slug>`. All work happens in that worktree.
4. Delegate to the **implementer** subagent with the spec and the plan.
   Tests first: a failing test, then the code that makes it pass. Small conventional
   commits. It follows the plan; a deviation is written into the spec file first.
5. Run `commands.lint` and `commands.test` from `.factory.yml`. Both green, or fix and
   repeat. Do not proceed while red.
6. `git fetch origin && git rebase origin/<defaultBranch>`, then push the branch.
7. `vcs.sh pr-create "<id>: <title>" <body-file>` with a body that links the spec and
   lists the acceptance criteria as checkboxes. `ticket.sh set $1 pr <url>`,
   `ticket.sh event $1 pr-opened`, `ticket.sh state $1 in-review`.
8. Print the PR URL and `/factory-core:factory-review $1`.

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`.
With `--dry-run`: print branch name, worktree path, planned commits and the PR body. Touch nothing.
