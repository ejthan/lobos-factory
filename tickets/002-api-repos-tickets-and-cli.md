---
id: "002"
title: api — repos and tickets modules, pnpm factory and factory add
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

The API can list the repos the developer registered, read their tickets from disk, create a
ticket, and notice when a file changes. `pnpm factory` starts everything and opens the
browser.

## Context

Files are the database (ADR 0002). The registry of repos is the one thing that lives outside
a repo: `~/.factory/repos.json`. Browsers cannot return absolute folder paths, so repos are
added from the CLI or by typing a path.

## Acceptance criteria (draft)

- `factory add <path>` and `factory add .` register a repo after checking it is a git
  repository; a non-repo and a duplicate are both refused with a clear message.
- `pnpm factory` serves the UI, starts the API on a fixed local port and opens the browser.
- `GET /api/repos`, `GET /api/repos/:id/tickets`, `GET /api/tickets/:id`,
  `POST /api/tickets` (writes the markdown file).
- The frontmatter parser is tested against this repo's own ticket files — all seven parse,
  with the right id, state, type and title.
- A ticket file changed on disk is reflected by the API without a restart (chokidar).

## Out of scope

Running agents. Any UI. Auth.
