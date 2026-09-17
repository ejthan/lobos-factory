---
id: "003"
title: api — runs module with the Agent SDK and SSE
type: product
risk:
state: backlog
created: 2026-09-17
branch:
pr:
spec:
report:
---

## Goal

The API can start a factory command for a ticket, stream what the agent does, take an answer
to an agent's question and a permission decision, and survive a browser reload.

## Context

The Agent SDK loads AGENTS.md, skills, subagents and hooks from the target repo, same as
Claude Code. If it blocks on something, the fallback is spawning
`claude -p --output-format stream-json` — that choice is ADR 0007.

CI has no API key, so the tests need a fake-agent mode that replays a recorded JSONL file.

## Acceptance criteria (draft)

- `POST /api/runs` with a repo, a ticket and a command starts `/factory-core:factory-spec <id>` in the
  repo's worktree and returns a run id.
- `GET /api/runs/:id/events` (SSE) emits `run.started`, `agent.message`, `agent.tool_use`,
  `agent.tool_result`, `agent.question`, `agent.permission`, `ticket.state`, `run.finished`
  with the payloads from the plan.
- `POST /api/runs/:id/answer` and `POST /api/runs/:id/permission` reach the running agent.
- Every event is appended to `<repo>/.factory/runs/<runId>.jsonl`; reconnecting to the SSE
  endpoint replays the log first, then continues live.
- Fake-agent mode replays a JSONL fixture and needs no API key; it is what the tests use.
- ADR 0007: Agent SDK vs CLI spawn, with what was actually tried.

## Out of scope

UI. Running more than one command per ticket at a time.
