# Lobos Factory — the constitution

This repo is three things: the **Factory Core** (the process as files, in
`packages/factory-core/`), the **Factory GUI** (`apps/ui` + `apps/api`, built by the
factory itself), and the **story** — the git history shows the factory building its own
tools. Read this before you touch anything.

## Principles

- **Two loops.** The *creation loop* turns intent into code: ticket → spec → plan → build.
  The *quality loop* checks it: review → CI → smoke test. Findings from the quality loop
  go back into the creation loop as tickets.
- **Two human gates.** Spec approval and PR merge. Everything else is automated.
- **Humans are on the loop, not in it.** They write tickets, approve, merge, and tune the
  factory. They do not write production code.
- **Spec quality decides output quality.** When an acceptance criterion is unclear, ask.
  Never guess, never quietly widen the scope.
- **Tests first.** Every product ticket ends with green unit tests and at least one
  Playwright test with a screenshot.
- **Decisions are ADRs**, written before the code depends on them.
- **The factory does not modify itself while building a product.** Only a `type: factory`
  ticket may change the files in `protectedPaths`.
- **Files are the database.** Tickets, specs, reports and `quality.md` are markdown in the
  repo. The GUI reads and writes those files, nothing else.
- **Small steps.** One ticket, one branch, one PR.
- **Terminal first.** Everything the GUI does must work as a slash command. The GUI is a
  thin layer over the Core.

## Definition of Done

- Every acceptance criterion has a test, and the tests are green.
- At least one Playwright test with a screenshot; the `@smoke` test passes on `main`.
- Lint green, CI green.
- Decisions code depends on are ADRs in `docs/adr/`.
- PR merged, `docs/quality.md` updated, `docs/reports/<id>.md` written.

## Rules for agents

- Branch `ticket/<id>-<slug>`, in a worktree under `.factory/worktrees/<id>`.
- Rebase on `main` before opening the PR. Never force push.
- Small conventional commits (`feat(ui): …`). Factory bookkeeping is `chore(factory): …`.
- Never commit `.env`, credentials, binaries, or anything under `.factory/`.
- Never edit a ticket's `state:` by hand to get past a refusal — a refusal means a step
  was skipped.
- Stuck twice on the same error: stop, log `ticket.sh event <id> intervention`, and report
  what you tried. Never loop.
- Ask the human rather than guess. An open question in a spec is a feature, not a failure.

## States

```
creation loop:  backlog → spec-draft → [GATE 1: human approves] → spec-approved
                → planned → in-review
quality loop:   in-review → changes-requested → planned   (max 2 rounds)
                in-review → [GATE 2: human merges] → merged → done
```

Approving a spec is one command:
`packages/factory-core/scripts/ticket.sh state <id> spec-approved`.

## Where things live

| | |
|---|---|
| the factory itself | `packages/factory-core/` (commands, agents, skills, hooks, scripts, templates) |
| tickets | `tickets/<id>-<slug>.md` |
| specs and plans | `docs/specs/<id>.md` |
| decisions | `docs/adr/` |
| reports and metrics | `docs/reports/<id>.md` |
| product state | `docs/quality.md` |
| per-repo config | `.factory.yml` |
| run state, worktrees, logs | `.factory/` (gitignored) |

## Commands

| | |
|---|---|
| `/factory-core:factory-status` | the board |
| `/factory-core:factory-intake "<title>"` | new ticket in the backlog |
| `/factory-core:factory-spec <id>` | spec + risk class, then **gate 1** |
| `/factory-core:factory-plan <id>` | minimal-change plan + ADR drafts |
| `/factory-core:factory-implement <id>` | worktree, tests first, PR |
| `/factory-core:factory-review <id>` | adversarial review, max 2 rounds, then **gate 2** |
| `/factory-core:factory-release <id>` | smoke test, quality.md, changelog, report |
| `/factory-core:factory-improve` | proposes up to 3 tickets from quality.md |
| `/factory-core:factory-run <id>` | the whole loop, pausing at the gates |
| `/factory-core:factory-doctor [path]` | check a repo's preconditions |
| `/factory-core:factory-init [path]` | onboard a repo, file the findings as tickets |

Every command takes `--dry-run`.

The commands come from the `factory-core` plugin, so they carry its namespace. A fresh
clone registers it from `.claude/settings.json`; if the commands are missing, run once:

```bash
claude plugin marketplace add ./packages --scope project
claude plugin install factory-core@lobos-local --scope project -y
```

That copies the plugin into `~/.claude/plugins/cache/`, so **edits to
`packages/factory-core/` are not live**. While working on the Core itself, start Claude
with `claude --plugin-dir packages/factory-core`, or reinstall after the change. The hooks
are the exception: they run from the working tree and are live immediately.

## Hooks

Three guards, active only while a ticket run is in progress
(`.factory/current-ticket` exists):

- editing a `protectedPaths` file from a non-`factory` ticket → blocked. A **new** file
  under `docs/adr/` is the exception: that is how a product ticket records a decision;
- editing or committing on `main` during a run → blocked;
- stopping while lint or tests are red → the agent has to finish or report.

Force pushes are blocked always. Ad-hoc human work outside a run is not blocked — the
guards protect the factory from itself, not the humans from git.

## Metrics

Two headline numbers per ticket, in `docs/reports/<id>.md`: **PR-to-merge time** and
**autonomous rate** (agent steps completed without a human stepping in outside the two
gates). Log every intervention honestly — a flattering number makes the factory worse.

Spec gaps are not factory failures. They are the factory working: the gap surfaced before
the code was written.
