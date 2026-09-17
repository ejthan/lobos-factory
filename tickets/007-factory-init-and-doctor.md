---
id: "007"
title: factory-init and factory-doctor for external repos
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

Point the factory at a repo that knows nothing about it: check what is missing, copy the
templates, and turn every remaining gap into a `type: factory` ticket. Make the GitLab path
real.

## Context

Our team repos are on GitLab; this one is on GitHub. The adapter covers both, but the GitLab
half of `vcs.sh` has never opened a merge request. Repos without tests are the normal case —
the factory has to be able to build its own preconditions.

## Acceptance criteria (draft)

- `doctor.sh` reports missing lint, test, e2e, CI, `.factory.yml` and `.gitignore` entries
  as structured findings, from the GUI and the terminal.
- `/factory-core:factory-init` copies the templates without overwriting, fills `.factory.yml` from what it
  detects and asks for the rest, and creates one `type: factory` ticket per finding.
- `vcs.sh` with `host: gitlab` creates a merge request against a scratch GitLab project,
  comments on it, and reports it as merged after it is merged.
- CI templates for both hosts are used by `/factory-core:factory-init`.
- Run `/factory-core:factory-init` on a copy of one real team repo: the findings become tickets and the
  board shows them.

## Out of scope

Running one of those factory tickets to completion — that is Phase 4, by hand.
