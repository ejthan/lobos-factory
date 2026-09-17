---
id: "006"
title: Dashboard, reports and quality.md
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

The numbers that tell the team whether the factory is working, and the product state it
keeps in `quality.md`.

## Context

The two headline metrics are PR-to-merge time and autonomous rate. They come from
`docs/reports/*.md`, which `report.sh` writes from the ticket event log.

## Acceptance criteria (draft)

- `reports` module parses `docs/reports/*.md` into numbers and exposes them per repo and
  across repos.
- Dashboard shows lead time, PR-to-merge, review rounds, autonomous rate and tickets per
  week, for the selected repo and for all of them.
- `docs/quality.md` renders on the dashboard with its grades.
- A button runs `/factory-core:factory-improve`; the proposed tickets appear in the backlog column.
- Playwright: a screenshot of the dashboard with real numbers from this repo's reports.

## Out of scope

Charts beyond what the numbers need. Historical trends per day.
