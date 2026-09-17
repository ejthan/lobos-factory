# Lobos Factory: Build Plan (v2)

Hand this file to Claude Code in an empty folder and say: "Read FACTORY_PLAN.md and execute it phase by phase. Stop after each phase and show me what changed."

Changes from v1: the product is now a GUI tool that runs the factory on any of our repos. The Ona software-factory ideas are folded in (two loops, quality.md, risk class, smoke test, two metrics, AGENTS.md). The erp-mock and order-status tickets are dropped. KISS is the rule for every decision below.

## 1. Goal

One repo, `lobos-factory`, that contains three things:

1. **Factory Core**: the process as files (AGENTS.md rules, slash commands, subagents, skills, hooks, scripts). Portable, no code of its own. Works from the terminal with Claude Code in any repo.
2. **Factory GUI**: a local web app, not a desktop app. Angular frontend + NestJS backend, started with one command (`pnpm factory`) on the developer machine, opens in the browser, drives the Core through the Claude Agent SDK. Shows a board over several repos, the two human gates as buttons, the live agent transcript, and a dashboard with numbers. Angular and NestJS are chosen because they are the team's stack: the team must be able to read, judge and maintain what the factory builds. An Electron wrapper is a possible stage 2 and changes nothing in the stack.
3. **The story**: the repo starts naked (Core only). Ticket 001 is "bootstrap the Nx workspace". Tickets 002 to 007 build the GUI. The factory builds its own GUI, and the git history shows it. Then the GUI is pointed at our real repos for the team demo.

## 2. Principles (go into AGENTS.md)

- Two loops. The **creation loop** turns intent into code: ticket, spec, plan, build. The **quality loop** checks it: review, CI, smoke test. Findings from the quality loop go back into the creation loop. The human stands at the two hand-over points.
- Two human gates only: spec approval and PR merge. Everything else is automated.
- Humans are on the loop, not in the loop: they write tickets, approve, merge, and tune the factory. They do not write production code in the demo.
- Spec quality decides output quality. When acceptance criteria are unclear, the agent asks. It never guesses.
- Tests first. Every product ticket ends with green unit tests and at least one Playwright e2e test with a screenshot.
- Decisions are written as ADRs before code depends on them.
- The factory does not modify itself while processing a product ticket. `type: factory` tickets are the only way to change Core files.
- Files are the database. Tickets, specs, reports and quality.md live in the target repo as markdown. The GUI reads and writes those files, nothing else.
- Small steps. One ticket, one branch, one PR.
- Terminal first. Everything the GUI can do must also work as a slash command. The GUI is a thin layer.

## 3. Tech decisions

| Area | Choice | Note |
|---|---|---|
| Agent engine | Claude Agent SDK (TypeScript) in the NestJS backend | same engine as Claude Code, loads AGENTS.md, skills, subagents, hooks from the target repo |
| Fallback engine | spawn `claude -p --output-format stream-json` | if the SDK blocks on something, use this first, swap later |
| Core distribution | folder `packages/factory-core`, loaded as a local plugin by the SDK / `--plugin-dir` in the CLI | no marketplace, no install step in target repos (stage 1). Verify the exact SDK option against current docs |
| Monorepo | Nx, pnpm, Node 22 LTS | Angular standalone + signals, NestJS |
| Unit tests | Vitest if Nx generators support it cleanly, else Jest | ticket 001 decides, ADR |
| E2E | Playwright with screenshots | |
| Live updates GUI | Server-Sent Events | no websockets, no message broker |
| Persistence | markdown files in the target repo + JSONL run logs under `<repo>/.factory/runs/` (gitignored) | no database in stage 1 |
| Git host adapter | thin shell scripts around `gh` (GitHub) and `glab` (GitLab) | selected by `.factory.yml host:` |
| Repo hosting for this repo | GitHub | our team repos stay on GitLab, adapter covers both |
| App form | local web app: `pnpm factory` starts api, serves ui, opens the browser | no Electron, no Tauri in stage 1. Tauri would need a Node sidecar for the SDK, Electron is the natural wrapper later |
| Adding repos | CLI `factory add <path>` (or `factory add .` inside a repo) and typing a path in the GUI | browsers cannot return absolute folder paths, so no folder picker |
| Backend scope | NestJS modules only for repos, tickets, runs, vcs, reports | no database, no auth module, no queues, no config service beyond one file |
| Auth, multi-user, server deploy | none in stage 1 | stage 2, only if the team wants it |

## 4. Repository layout

### Naked state (before ticket 001)

```
.
├── AGENTS.md                      # the constitution (see section 6)
├── CLAUDE.md                      # one line: "Read AGENTS.md."
├── README.md
├── FACTORY_PLAN.md                # this file
├── .claude/
│   └── settings.json              # points at packages/factory-core as local plugin, hooks, permissions
├── packages/
│   └── factory-core/              # the portable factory, no app code
│       ├── .claude-plugin/plugin.json
│       ├── commands/
│       │   ├── factory-intake.md      # /factory-intake <title>
│       │   ├── factory-spec.md        # /factory-spec <id>
│       │   ├── factory-plan.md        # /factory-plan <id>
│       │   ├── factory-implement.md   # /factory-implement <id>
│       │   ├── factory-review.md      # /factory-review <id>
│       │   ├── factory-release.md     # /factory-release <id>   incl. smoke test, quality.md, report
│       │   ├── factory-improve.md     # /factory-improve        reads quality.md, proposes tickets
│       │   ├── factory-run.md         # /factory-run <id>       full loop, pauses at the two gates
│       │   ├── factory-status.md      # /factory-status         board in the terminal
│       │   ├── factory-init.md        # /factory-init           onboard an existing repo
│       │   └── factory-doctor.md      # /factory-doctor         check preconditions of a repo
│       ├── agents/
│       │   ├── spec-writer.md
│       │   ├── architect.md
│       │   ├── implementer.md
│       │   ├── reviewer.md
│       │   └── release-manager.md
│       ├── skills/
│       │   ├── ticket-format/SKILL.md
│       │   ├── adr-writing/SKILL.md
│       │   ├── conventional-commits/SKILL.md
│       │   ├── testing-playwright/SKILL.md
│       │   ├── nx-conventions/SKILL.md
│       │   └── risk-classification/SKILL.md
│       ├── hooks/                     # shell scripts, referenced via ${CLAUDE_PLUGIN_ROOT}
│       │   ├── protect-factory-files.sh
│       │   ├── protect-main.sh
│       │   └── stop-gate.sh
│       ├── scripts/
│       │   ├── ticket.sh              # new | state | list | show    (frontmatter read/write)
│       │   ├── vcs.sh                 # pr-create | pr-diff | pr-comment | pr-status | merged   (gh or glab)
│       │   ├── report.sh              # writes docs/reports/<id>.md
│       │   └── doctor.sh              # checks lint/test/e2e/ci presence, prints findings as JSON
│       └── templates/                 # files that /factory-init copies into a target repo
│           ├── factory.yml
│           ├── AGENTS.md
│           ├── CLAUDE.md
│           ├── quality.md
│           ├── tickets/README.md
│           ├── docs/adr/0000-template.md
│           ├── PULL_REQUEST_TEMPLATE.md
│           ├── ci-github.yml
│           └── ci-gitlab.yml
├── .factory.yml                   # this repo is its own first target
├── tickets/
│   ├── README.md
│   └── 001-bootstrap-nx-workspace.md ... 007-factory-init-and-doctor.md
├── docs/
│   ├── adr/0000-template.md, 0001-factory-runs-locally.md, 0002-files-are-the-database.md
│   ├── specs/
│   ├── reports/
│   ├── quality.md
│   └── demo-script.md
├── .github/workflows/ci.yml       # exits 0 with a message until nx.json exists
├── .gitignore                     # node, dist, .nx, playwright-report, .factory/
└── .nvmrc
```

### After ticket 001 (added by the factory)

```
apps/ui         Angular, the Factory GUI
apps/ui-e2e     Playwright
apps/api        NestJS, orchestrator with Agent SDK
libs/shared/models   ticket, run, event, report types shared by ui and api
nx.json, package.json, pnpm-lock.yaml, tsconfig.base.json, docker-compose.yml
```

## 5. Ticket format and state machine

```markdown
---
id: "001"
title: Bootstrap Nx workspace
type: product | factory | bug
risk: low | medium | high        # set by spec-writer, see skill risk-classification
state: backlog
created: 2026-09-17
branch:
pr:
spec: docs/specs/001.md
report:
---

## Goal
## Context
## Acceptance criteria (draft)
## Out of scope
```

States:

```
creation loop:  backlog → spec-draft → [Gate 1: human] → spec-approved → planned → in-review
quality loop:   in-review → changes-requested (back to planned/implement, max 2 rounds)
                in-review → [Gate 2: human merges] → merged → done
```

Risk rule (skill `risk-classification`): docs, tests, dependency patch updates are `low`; new UI or endpoints without data changes are `medium`; anything touching persistence, auth, payments, or an ERP boundary is `high`. Stage 1: the field changes nothing. It is the prepared switch for skipping Gate 2 on `low` tickets later, and a discussion point for the team.

## 6. Factory Core, piece by piece

### AGENTS.md (CLAUDE.md just says "Read AGENTS.md.")
Purpose, the principles from section 2, Definition of Done, rules for agents (branch `ticket/<id>-<slug>`, worktree under `.factory/worktrees/<id>`, rebase on main before opening a PR, small conventional commits, ask instead of guess), where things live, command cheat sheet. Under 150 lines.

### .factory.yml (per target repo)
```yaml
host: github | gitlab
defaultBranch: main
packageManager: pnpm
commands:
  install: pnpm install --frozen-lockfile
  lint: pnpm nx affected -t lint
  test: pnpm nx affected -t test
  e2e: pnpm nx affected -t e2e
  smoke: pnpm nx e2e ui-e2e --grep @smoke
protectedPaths: [AGENTS.md, CLAUDE.md, .claude/, docs/adr/, .factory.yml]
tickets: tickets
docs: docs
```
Hooks and scripts read this file. This is the only thing that differs between repos.

### Commands
Each: frontmatter `description`, `argument-hint`, `allowed-tools`. Body: read ticket via `ticket.sh show`, refuse if the state is wrong, delegate to the subagent, update state via `ticket.sh state`, commit `chore(factory): ...`.

- `/factory-implement`: worktree + branch, `implementer`, run lint and test from `.factory.yml`, rebase on main, push, `vcs.sh pr-create`, write PR URL into the ticket.
- `/factory-review`: `reviewer` on `vcs.sh pr-diff`, posts findings via `vcs.sh pr-comment`. Blocking findings set `changes-requested` and call `implementer` with the findings. Max 2 rounds, then stop and ask the human.
- `/factory-release`: after `vcs.sh merged` is true: checkout main, run `commands.smoke`, save screenshot, update `docs/quality.md` (grades per area, one paragraph each, plus "known weaknesses"), append CHANGELOG, `report.sh`, state `done`.
- `/factory-improve`: reads `quality.md`, proposes up to 3 improvement tickets as files in `backlog`, does not start them.
- `/factory-doctor`: runs `doctor.sh`, prints findings. `/factory-init`: copies templates, fills `.factory.yml` by asking or detecting, creates `type: factory` tickets for every doctor finding (for example "add lint", "add test harness", "add e2e smoke test"). This is how repos without tests get onboarded: the factory creates its own preconditions as tickets.

### Subagents
`spec-writer` (read-only tools, asks questions, writes Gherkin criteria and the risk class), `architect` (plans, writes ADR drafts), `implementer` (strongest model, tests first), `reviewer` (read-only + vcs.sh, adversarial prompt: security, architecture rules, test gaps), `release-manager` (smoke test, quality.md, report).

### Hooks (`.claude/settings.json`, scripts in the plugin)
- `PreToolUse` Edit|Write: block `protectedPaths` unless the current ticket (file `.factory/current-ticket`) has `type: factory`. Block when on `main`.
- `PreToolUse` Bash: block `git push --force`, block `git commit` on `main`.
- `Stop`: if a ticket is active, run `commands.lint` and `commands.test`; refuse to stop while red, one retry, then let the agent report instead of looping.

### Report (`docs/reports/<id>.md`)
Timestamps (created, spec approved, PR opened, merged, done), lead time, **PR-to-merge time**, review rounds, commits, tests added, **autonomous rate** (agent steps completed without a human intervention outside the two gates, over all agent steps), token cost if available, smoke screenshot link.

## 7. Factory GUI

### Start and repo registration
`pnpm factory` (an Nx target or a small bin script in `apps/api`) builds or serves ui, starts api on a fixed local port, opens the browser. `factory add <path>` writes the path into `~/.factory/repos.json` after checking it is a git repo; `factory add .` works inside a repo. The GUI also accepts a typed path. No native folder dialog.

### Screens (stage 1, nothing more)
1. **Repos**: list of local repo paths from `~/.factory/repos.json`. "Add repo" takes a typed path, runs `doctor`, offers `init`.
2. **Board**: one repo selected, columns = states, cards = tickets with risk badge. "New ticket" opens a form (title, goal, context, criteria) and writes the markdown file.
3. **Ticket**: the ticket, spec, plan, ADR drafts as rendered markdown. One primary button for the next step in the state machine. Gate buttons: "Approve spec", "Open PR" (link), "Mark merged" (or auto-detected via `vcs.sh merged`). Live transcript of the running agent, an answer box for agent questions, a permission prompt for commands not on the allow list.
4. **Dashboard**: numbers from `docs/reports/*` for the selected repo and across repos: lead time, PR-to-merge, review rounds, autonomous rate, tickets per week. Plus `quality.md` rendered.

### Backend modules (NestJS)
- `repos`: read/write `~/.factory/repos.json`, run `doctor.sh`, run `/factory-init`.
- `tickets`: parse frontmatter from `tickets/*.md`, watch with chokidar, REST list/get/create.
- `runs`: start a factory command for a ticket through the Agent SDK in the repo's worktree, stream events over SSE, keep a JSONL log per run in `<repo>/.factory/runs/<runId>.jsonl`, resume on reconnect.
- `vcs`: wraps `vcs.sh`.
- `reports`: parse `docs/reports/*.md` into numbers.

### Event interface (SSE `GET /api/runs/:id/events`)
```
run.started        { runId, ticketId, command }
agent.message      { role, text }
agent.tool_use     { tool, input }
agent.tool_result  { tool, output, ok }
agent.question     { questionId, text }           → POST /api/runs/:id/answer
agent.permission   { requestId, tool, input }     → POST /api/runs/:id/permission { allow }
ticket.state       { ticketId, from, to }
run.finished       { status: ok|failed|waiting-for-human, summary }
```
Permission handling: allow list from `.factory.yml` and `.claude/settings.json`; only unlisted commands reach the GUI.

### Shared models (`libs/shared/models`)
`Ticket`, `TicketState`, `Risk`, `Run`, `RunEvent`, `Report`, `RepoConfig`. Used by ui and api, one source of truth.

## 8. The tickets

All tickets are `type: product` unless noted. Each includes Gherkin acceptance criteria written by the spec-writer at spec time; the lines below are the human draft.

**001 Bootstrap Nx workspace.** `apps/ui` (Angular standalone, shows "Lobos Factory" and api health), `apps/api` (NestJS, `GET /api/health`), `libs/shared/models`, Nx tags and module boundaries, Vitest or Jest with ADR, `apps/ui-e2e` Playwright with screenshot and a `@smoke` tagged test, docker-compose, `pnpm dev`, CI green with screenshot artifact, ADRs 0003 to 0006, README "Run it". Factory files untouched. Hint: `create-nx-workspace` in a temp folder with `--preset=apps --pm pnpm --nxCloud=skip`, move contents into the repo root, merge `.gitignore`; then `nx g @nx/angular:app ui`, `nx g @nx/nest:app api`. Do not run `nx init` on the repo root.

**002 api: repos and tickets modules, `pnpm factory` and `factory add`.** `~/.factory/repos.json`, `factory add <path>` CLI (validates git repo, rejects duplicates), `pnpm factory` start command that serves ui and api and opens the browser, chokidar watcher, REST endpoints, frontmatter parser with tests against the ticket files of this very repo.

**003 api: runs module with Agent SDK and SSE.** Start `/factory-spec <id>` for a ticket, stream events, JSONL log, answer and permission endpoints, resume. ADR 0007: Agent SDK vs CLI spawn. Includes a fake-agent mode for tests (replays a JSONL file) so ui e2e tests need no API key.

**004 ui: repos and board.** Repos screen, board with columns, new-ticket form, risk badge. E2E with screenshot of the board.

**005 ui: ticket screen with live transcript.** Markdown rendering, next-step button, gate buttons, transcript via SSE, answer box, permission prompt. E2E against fake-agent mode with screenshots of a question and a permission prompt.

**006 Dashboard, reports, quality.md.** `reports` module, dashboard screen, quality.md rendering, `/factory-improve` wired to a button.

**007 factory-init and factory-doctor for external repos.** `doctor.sh`, `factory-init` with templates, GitLab adapter in `vcs.sh` tested against a scratch GitLab project, CI templates for both hosts. Acceptance: run `/factory-init` on a copy of one real team repo, doctor findings become factory tickets, board shows them.

**Backlog for the demo, do not create yet:** 008 "make the app faster", the deliberately bad ticket, to show the spec-writer asking questions.

## 9. Build order for Claude Code

After each phase: commit with a conventional message, stop, show a short summary.

**Phase 0: repo skeleton.** `git init`, `main`, `.gitignore`, `.nvmrc`, `README.md`, `CLAUDE.md` ("Read AGENTS.md."), empty folders with `.gitkeep`.

**Phase 1: Factory Core.** `AGENTS.md`, `packages/factory-core` complete (plugin.json, commands, agents, skills, hooks, scripts, templates), `.claude/settings.json` loading the core as local plugin, `.factory.yml` for this repo, `tickets/README.md`, tickets 001 to 007 in `backlog`, ADRs 0000 to 0002, `docs/quality.md` with an initial honest grade ("no product yet"). Every command must work in `--dry-run` mode on ticket 001. Test each hook by hand: edit `AGENTS.md` on a product ticket (blocked), commit on main (blocked).

**Phase 2: GitHub glue.** `ci.yml` with the "no nx yet, exit 0" guard, PR template, `gh repo create`, push, CI green on the naked repo. This commit is the "naked factory" the demo starts from.

**Phase 3: the factory builds the product.** Process tickets 001 to 007 with the terminal commands (`/factory-run <id>`). Alexander approves specs and merges PRs. When the factory blocks, fix it as a `type: factory` ticket. If a fix would take more than an hour, fall back to plain Claude Code for that step, note it in the report as a human intervention, and continue. Do not let dogfooding stall the GUI.

**Phase 4: first external repo.** Pick one small team repo, run `factory-init` through the GUI, let doctor create factory tickets, run one of them end to end (for example "add lint"). Fix what breaks.

**Phase 5: demo script.** `docs/demo-script.md`, 20 minutes: naked commit and git log as the story, board of this repo with 7 done tickets and their reports, dashboard numbers, then live: add a team repo, doctor, one small ticket through both gates, end with bad ticket 008 and the spec-writer asking questions. Close with "on the loop, not in the loop".

## 10. Verification checklist

- [ ] Fresh clone, `claude` in the folder, `/factory-status` lists tickets. `/factory-spec 001` twice: second run refuses because of state.
- [ ] Hooks block protected paths and commits on main.
- [ ] `pnpm dev` starts ui and api. Board shows this repo's tickets. Creating a ticket in the GUI creates a file; editing the file updates the board without reload.
- [ ] Starting a run in the GUI shows the transcript live; a question from the agent can be answered in the GUI; closing and reopening the browser resumes the transcript from the JSONL log.
- [ ] `docs/reports/00x.md` contains lead time, PR-to-merge, review rounds, autonomous rate.
- [ ] `quality.md` changes after a release and `/factory-improve` proposes tickets from it.
- [ ] `factory-init` on a GitLab repo works with `glab`, PR (merge request) is created and detected as merged.
- [ ] ui e2e runs green in CI without an API key (fake-agent mode).

## 11. Open decisions for Alexander

- Repo name and visibility (public makes it shareable; Core contains nothing internal).
- Vitest vs Jest (ticket 001 decides).
- Which team repo is the first external target for Phase 4. Prefer a small one with a working local build.
- Whether `/factory-run` should stop after each step for the first demo (`--step` flag, default automatic).
- Stage 2 (server, multi-user, containers per run) only after the team has seen stage 1.

## 12. Borrowed from software-factory.dev, and what was left out

Taken: two-loop structure, `quality.md` as the factory's memory of product state with improvement tickets derived from it, risk class with progressive escalation as a prepared switch, post-merge smoke test, autonomous rate and PR-to-merge as the two headline metrics, `AGENTS.md` as the tool-independent rule file, "spec gaps are not factory failures" as the framing.

Left out on purpose: separate agents for merge conflicts, incidents and performance (a rebase in the implementer and five agents are enough), Sentry, auto-deploy, auto-merge, 14 automations.
