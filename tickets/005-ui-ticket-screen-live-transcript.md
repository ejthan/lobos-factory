---
id: "005"
title: ui — ticket screen with the live transcript
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

The screen where a human watches the factory work and answers it: the ticket, its spec and
plan, the next step as one button, the two gates, and the agent's transcript live.

## Acceptance criteria (draft)

- Ticket, spec, plan and ADR drafts render as markdown.
- One primary button, labelled with the next step from the state machine; it starts the run.
- Gate buttons: "Approve spec", the PR link, and "Mark merged" (or the state detected
  through `vcs.sh merged`).
- The transcript streams over SSE: messages, tool calls and their results, clearly separated.
- An `agent.question` shows an answer box; the answer reaches the agent and the run continues.
- An `agent.permission` shows what the agent wants to run, with allow and deny.
- Closing and reopening the browser resumes the transcript from the JSONL log.
- Playwright against fake-agent mode, with screenshots of a question and of a permission
  prompt.

## Out of scope

Editing the spec in the browser. Dashboard.
