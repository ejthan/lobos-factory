# 0002 — Files are the database

- Status: accepted
- Date: 2026-09-17
- Ticket: —

## Context

The factory needs state: tickets, their states, specs, plans, decisions, reports, and the
product's quality over time. The obvious move is a database in the API. But the state we
are tracking is *about* a repository and is produced and consumed by agents, whose native
interface is a file and a diff.

## Decision

All durable factory state is markdown in the target repo: `tickets/*.md` with YAML
frontmatter, `docs/specs/`, `docs/adr/`, `docs/reports/`, `docs/quality.md`. Transient run
state is JSONL under `<repo>/.factory/` and gitignored. There is no database in stage 1.
The GUI reads and writes those files and nothing else.

## Consequences

- Easier: the terminal and the GUI cannot drift apart — there is one store and both use it.
  A slash command and a button do the same thing.
- Easier: state is reviewable and revertible. A wrong ticket state is a diff. History,
  blame and PRs work on the process itself.
- Easier: agents edit state with the tools they already have. No API client, no schema.
- Harder: no queries. "All tickets over all repos older than a week" means walking files.
  At our volume that is fine; at a thousand tickets it is not.
- Harder: no transactions and no locking. Two writers on one ticket file is last-write-wins.
  Single-user local operation (ADR 0001) is what makes this safe.
- Harder: the frontmatter parser is hand-rolled shell. Keep the format boring.
- We can no longer cheaply do cross-repo aggregation in real time; the dashboard reads
  reports per repo instead.

## Alternatives

- **SQLite in the API** — lost because the state would stop being reviewable, and agents
  would need a tool to touch it. The duplication between file and row is the bug factory.
- **GitHub/GitLab issues as the store** — lost on portability and offline work: two hosts,
  two APIs, rate limits, and nothing readable in a fresh clone.
- **Files plus an index database** — lost on stage-1 value: a cache to keep in sync before
  anything is slow.
