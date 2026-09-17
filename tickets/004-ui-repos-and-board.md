---
id: "004"
title: ui — repos screen and the board
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

The two screens a human starts from: the list of registered repos, and the ticket board for
the selected one.

## Context

Angular standalone components with signals. The board is the demo's centrepiece — columns
are states, so the process is visible at a glance.

## Acceptance criteria (draft)

- Repos screen lists the repos from the API with their path; "Add repo" takes a typed path
  and reports what doctor found.
- Board shows one column per state in loop order, cards with id, title and a risk badge.
- Tickets in `spec-draft` and `in-review` are visibly marked as waiting for a human.
- "New ticket" writes the markdown file through the API and the card appears.
- A ticket file edited on disk moves the card without a page reload.
- Playwright: a screenshot of the board with this repo's seven tickets.

## Out of scope

The ticket detail screen, transcripts, the dashboard.
