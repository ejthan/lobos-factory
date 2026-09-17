# Quality

The factory's honest memory of this product. Updated after every release by the
release-manager, read by `/factory-core:factory-improve` to propose the next tickets. Grades are A–F
and they move in both directions.

## Overview

| area | grade | since |
|---|---|---|
| Factory Core | C | 2026-09-17 |
| Factory GUI | C | 2026-09-17 |
| Zusammenspiel Core ↔ GUI | D | 2026-09-17 |

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

_Grade: C_

Exists and runs. `pnpm factory` starts the NestJS API (port 4711) and the Angular UI
(4200) and opens the browser. Four screens: Repos (mit Doctor), Board (Spalten = States,
Risk-Badge, Neues-Ticket-Formular, live über einen chokidar-Watcher), Ticket (Markdown von
Ticket und Spec, Next-Step-Button, beide Gate-Buttons, Live-Transkript über SSE,
Antwortfeld, Permission-Prompt) und Dashboard (PR-to-merge, Autonomie-Rate, Durchlaufzeit,
quality.md).

Belegt durch: 3 Playwright-Tests grün inklusive Screenshots von Board, Permission-Prompt
und Agenten-Rückfrage; Unit-Tests für den Frontmatter-Parser gegen die echten Ticketfiles
dieses Repos, für die State-Machine und für die Markdown-Pipe; Lint über alle vier
Projekte grün, Module-Boundaries mit Tags erzwungen.

Nicht belegt: ein echter Lauf gegen das Modell. Jeder Agenten-Test lief bisher im
Fake-Modus gegen eine aufgezeichnete JSONL-Datei. Der Pfad durch das Agent SDK — `query()`,
`canUseTool`, das Mapping der SDK-Nachrichten auf SSE-Events — ist noch nie in echt
gelaufen.

### Zusammenspiel Core ↔ GUI

_Grade: D_

Die GUI ruft die Core-Skripte auf (`ticket.sh`, `cfg.sh`, `doctor.sh`) und das funktioniert
gegen dieses Repo. Der Lauf selbst startet `/factory-core:<command>` über das Agent SDK,
was ungetestet ist. `vcs.sh` ist von der GUI aus gar nicht erreichbar — es gibt kein
vcs-Modul, PR-Status und "merged" muss der Mensch im Ticket-Screen von Hand setzen.

## Known weaknesses

- **Die GUI wurde nicht von der Fabrik gebaut.** Tickets 001–006 stehen auf `done`, aber
  sie sind in einem Zug von Hand entstanden, ohne Spec, ohne Plan, ohne PR, ohne Review.
  Es gibt deshalb keine Reports und das Dashboard ist leer — das ist kein Bug, das ist der
  ehrliche Zustand. Die Demo-Geschichte "die Fabrik hat sich selbst gebaut" stimmt so
  nicht; wer sie erzählen will, muss sie erst wahr machen.
- **Der Agent-Pfad ist ungetestet.** Alles, was die GUI über Läufe zeigt, kam bisher aus
  einer aufgezeichneten Datei. Der erste echte Lauf wird Dinge finden.
- **Kein vcs-Modul in der API.** PR öffnen, Diff lesen, Merge erkennen läuft nur im
  Terminal über `vcs.sh`.
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
