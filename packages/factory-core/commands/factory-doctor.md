---
description: Check whether a repo has what the factory needs.
argument-hint: "[repo-path]"
allowed-tools: Bash(*/scripts/doctor.sh:*), Read
---

Run `${CLAUDE_PLUGIN_ROOT}/scripts/doctor.sh $1`.

Print the findings as a short table (check, what is missing, the fix) and say whether the
repo is ready for `/factory-core:factory-run`. If there are findings, offer `/factory-core:factory-init` — it turns
each finding into a `type: factory` ticket.

Change nothing.
