---
description: After the merge — smoke test, quality.md, changelog, report (quality loop, close).
argument-hint: <id> [--dry-run]
allowed-tools: Bash(*), Read, Write, Edit, Task
---

Release ticket **$1**.

1. `ticket.sh show $1`. Run `vcs.sh merged <pr>`; if it is not merged, say so and stop —
   the merge is human gate 2.
2. `ticket.sh state $1 merged`, `ticket.sh event $1 step:release`.
3. Checkout the default branch, pull, install.
4. Run `commands.smoke` from `.factory.yml`. Save the screenshot to `.factory/smoke/$1.png`.
   Red smoke test → stop and report; do not write quality.md.
5. Delegate to **release-manager**: update `docs/quality.md` (a grade and one paragraph per
   area, plus "known weaknesses" — honest, not marketing), append the CHANGELOG entry.
6. `report.sh $1`, then fill the `## Notes` section with what was hard and what the factory
   got wrong.
7. `ticket.sh state $1 done`, `ticket.sh current --clear`, remove the worktree.
8. Commit `chore(factory): release $1`. Print the report path and the two headline numbers
   (PR-to-merge, autonomous rate).

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`.
With `--dry-run`: print the smoke command and the files you would write. Touch nothing.
