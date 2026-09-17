---
id: "001"
title: Bootstrap Nx workspace
type: product
risk: 
state: done
created: 2026-09-17
branch:
pr:
spec:
report:
---

## Goal

An Nx workspace in this repo with `apps/ui` (Angular), `apps/api` (NestJS) and
`libs/shared/models`, a unit test runner, Playwright e2e with a `@smoke` test, and green CI.
Everything the next six tickets build on.

## Context

The repo is naked: factory files only, no `package.json`, no `nx.json`. The stack is fixed
(Angular standalone + signals, NestJS, pnpm, Node 22) because the team must be able to read
and maintain what the factory writes.

Hint for the implementer: run `create-nx-workspace` in a temp folder with
`--preset=apps --pm pnpm --nxCloud=skip`, move its contents into the repo root and merge
`.gitignore`; then `nx g @nx/angular:app ui` and `nx g @nx/nest:app api`. Do **not** run
`nx init` on the repo root — it would rewrite the factory files.

## Acceptance criteria (draft)

- `pnpm install && pnpm dev` starts both apps; the UI shows "Lobos Factory" and the result
  of a call to the API's `GET /api/health`.
- `libs/shared/models` exports the `Ticket`, `TicketState` and `Risk` types and both apps
  import them.
- Nx tags and `@nx/enforce-module-boundaries` are configured per the `nx-conventions` skill;
  a deliberate `ui → api` import fails lint.
- `apps/ui-e2e` has one Playwright test tagged `@smoke` that loads the UI and saves a
  screenshot.
- `pnpm nx affected -t lint test e2e` is green; CI runs it and uploads the screenshot.
- ADRs for: unit test runner (Vitest vs Jest), workspace layout and tags, SSE as the live
  transport, and the `pnpm dev` / docker-compose setup.
- README gets a real "Run it" section.

## Out of scope

Any factory file. Any GUI feature — this ticket is scaffolding plus a health check.
