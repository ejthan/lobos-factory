# Quality

The factory's honest memory of this product. Updated after every release by the
release-manager, read by `/factory-core:factory-improve` to propose the next tickets. Grades are A–F
and they move in both directions.

## Overview

| area | grade | since |
|---|---|---|
| Factory Core | C | 2026-09-17 |
| Factory GUI | F | 2026-09-17 |

## Areas

### Factory Core

_Grade: C_

Complete and partly proven: 11 commands, 5 subagents, 6 skills, 3 hooks, 5 scripts, 9
templates. `cfg.sh`, `ticket.sh`, `doctor.sh` and `report.sh` were exercised by hand, all
three hooks were tested with piped hook JSON (protected paths, the main-branch guard, the
force-push guard, the red-tests stop gate), and `/factory-core:factory-status` printed the
board from a real headless session. Not proven: any command past `status`, the whole loop
end to end, and `vcs.sh` — it has never opened a pull request on either host. No tests for
the shell scripts; the first real ticket is the test.

### Factory GUI

_Grade: F_

Does not exist. Tickets 001–007 build it. `apps/`, `libs/`, `nx.json` and `package.json`
are absent by design: this is the naked state the demo starts from.

## Known weaknesses

- **No product code at all.** Every grade above C is unearned until a ticket has gone
  through the whole loop.
- **The shell scripts are untested.** `ticket.sh` parses YAML frontmatter with `sed` and
  `awk`; `cfg.sh` parses two levels of YAML with `awk`. Both will break on anything fancy
  — quoted multi-line values, nested lists, tabs. Keep `.factory.yml` and ticket
  frontmatter boring.
- **The GitLab side of `vcs.sh` is written but unexercised.** Ticket 007 is where it gets
  proven; assume it is wrong until then.
- **Plugin loading needs a one-time install per clone.** `.claude/settings.json` declares
  the local marketplace (`./packages`) and enables `factory-core@lobos-local`, but the
  plugin only appeared after `claude plugin marketplace add ./packages --scope project`
  and `claude plugin install factory-core@lobos-local --scope project -y`. Verified on
  this machine only; a fresh clone on another machine is untested.
- **An installed plugin runs from `~/.claude/plugins/cache/`, not from the working tree.**
  Editing `packages/factory-core/` changes nothing until reinstall. Use
  `claude --plugin-dir packages/factory-core` while working on the Core. Easy to lose an
  hour to this.
- **Commands are namespaced `/factory-core:factory-…`.** The bare `/factory-status` from
  the plan is not recognised; a headless run of it answered from the files instead of
  running the command, which is exactly the failure mode that looks like success.
- **CI does not run at all yet.** The workflow is written but parked at
  `docs/ci/github-ci.yml`: GitHub refuses a workflow file from an OAuth token without the
  `workflow` scope, and neither the device flow nor the passphrase-protected SSH key came
  through. Ticket 008 (`type: factory`) owns it. Until then nothing verifies this repo on
  push — the checks exist only as commands someone has to remember to run.
- **`ticket.sh new` produced a filename with spaces in it** the first time it was used in
  anger: BSD `sed` does not understand `\+`. Fixed with `sed -E`, but it is a reminder
  that the shell scripts have no tests and were written against GNU habits. The next such
  bug will also be found by a human, not by a test.
