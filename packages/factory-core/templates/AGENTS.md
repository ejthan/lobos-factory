# <repo> — rules for agents

This repo is run by the Lobos Factory. The full rules live in the factory repo's
`AGENTS.md`; this file carries the repo-specific parts.

## The loop

`/factory-core:factory-run <id>` walks a ticket from backlog to done and stops at the two human gates:
spec approval and PR merge. Everything between is automated.

## Definition of Done

- Every acceptance criterion has a test, and the tests are green.
- At least one Playwright test with a screenshot.
- Lint green.
- Decisions that code depends on are written as ADRs in `docs/adr/`.
- The PR is merged, the smoke test passed on the default branch, `docs/quality.md` and
  `docs/reports/<id>.md` are updated.

## Rules

- One ticket, one branch (`ticket/<id>-<slug>`), one PR. Rebase on the default branch
  before opening it.
- Tests first. A test written after the code is a description, not a test.
- Ask instead of guessing. An unclear acceptance criterion is a question for the human,
  never an assumption.
- Only a `type: factory` ticket may change the files under `protectedPaths` in `.factory.yml`.
- Small conventional commits.

## Where things live

| | |
|---|---|
| tickets | `tickets/` |
| specs and plans | `docs/specs/` |
| decisions | `docs/adr/` |
| reports | `docs/reports/` |
| product state | `docs/quality.md` |
| config | `.factory.yml` |
