# 0001 — The factory runs locally as a web app, not as a service

- Status: accepted
- Date: 2026-09-17
- Ticket: —

## Context

The factory drives Claude Code over our repositories. Those repositories are checkouts on
developer machines, the git hosts are partly internal (GitLab), and the agent needs a real
working tree, a real `pnpm install` and a real `git push` with the developer's own
credentials. A hosted service would need all of that in a container, plus auth, plus a way
to reach internal hosts.

We also want the team to read and judge the code. The stack is therefore Angular + NestJS,
what the team already maintains.

## Decision

`pnpm factory` starts a NestJS API and serves the Angular UI on the developer's machine and
opens the browser. Single user, no auth, no database, no server deployment. The agent runs
in-process through the Claude Agent SDK, in the target repo's own worktree, with the
developer's git credentials.

## Consequences

- Easier: no auth, no secrets management, no container per run, no network path to internal
  GitLab. The developer's existing `gh`/`glab` login just works.
- Easier: the browser is the UI, so there is no desktop packaging. An Electron wrapper stays
  possible later and changes nothing in the stack.
- Harder: nothing is shared. Two developers running the factory on the same repo see two
  boards, and only what is committed is common ground. That is acceptable because the files
  *are* the database (ADR 0002).
- Harder: no scheduled or unattended runs. Someone has to have the app open.
- We can no longer cheaply offer this to non-developers. That is stage 2, and only if the
  team asks for it.

## Alternatives

- **Hosted multi-user service** — lost on cost: auth, containers per run, credential
  delegation and network access to internal hosts, all before the first ticket runs.
- **Desktop app (Electron/Tauri)** — lost on stage-1 value: Tauri would need a Node sidecar
  for the SDK, Electron adds packaging work, and neither adds anything the browser lacks.
- **Terminal only, no GUI** — lost on the demo: the board, the gates and the live transcript
  are what make the process visible to the team.
