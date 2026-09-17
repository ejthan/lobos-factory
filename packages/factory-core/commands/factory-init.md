---
description: Onboard a repo — copy the factory templates, write .factory.yml, file the doctor findings as tickets.
argument-hint: "[repo-path]"
allowed-tools: Bash(*), Read, Write, Edit
---

Onboard the repo at `$1` (default: this repo).

1. Run `doctor.sh` first and show the findings.
2. Detect what you can: git host from `git remote -v` (github/gitlab), default branch,
   package manager, and the lint/test/e2e commands from package.json or nx.json.
   **Ask** for anything you cannot detect. Do not guess commands.
3. Copy from `${CLAUDE_PLUGIN_ROOT}/templates/`, never overwriting an existing file:
   `factory.yml` → `.factory.yml` (filled in), `AGENTS.md`, `CLAUDE.md`, `quality.md` →
   `docs/quality.md`, `tickets/README.md`, `docs/adr/0000-template.md`,
   `PULL_REQUEST_TEMPLATE.md`, and the CI file for the detected host.
   Add `.factory/` to `.gitignore`.
4. For every remaining doctor finding create a `type: factory` ticket in `backlog`
   (`ticket.sh new "<fix>" factory`) with the finding as the Goal. This is how a repo
   without tests gets onboarded: the factory builds its own preconditions first.
5. Commit `chore(factory): onboard repo`.
6. Print the board and the first ticket to run.

With `--dry-run`: list the files you would copy and the tickets you would create.
