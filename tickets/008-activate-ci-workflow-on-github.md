---
id: "008"
title: Activate the CI workflow on GitHub
type: factory
risk:
state: backlog
created: 2026-09-17
branch:
pr:
spec:
report:
---

## Goal

`.github/workflows/ci.yml` exists in the repo and runs green on `main`. The file is
already written and parked at `docs/ci/github-ci.yml` — this ticket is about getting it
past GitHub's push protection, not about writing it.

## Context

Phase 2 could not push it. GitHub refuses to let an OAuth token create or update a file
under `.github/workflows/` without the `workflow` scope, and the `gh` token on this
machine has `admin:public_key, delete_repo, gist, read:org, repo` — no `workflow`. Two
attempts at `gh auth refresh -h github.com -s workflow` never completed the device flow.

The SSH route is unaffected by that restriction, but the key registered on the `ejthan`
account (`~/.ssh/id_ed25519_privat`, alias `github-privat`) is passphrase-protected and
the passphrase was not at hand.

Three ways out, in order of preference:

1. Unlock the existing key: `ssh-add --apple-use-keychain ~/.ssh/id_ed25519_privat`, then
   `git remote set-url origin github-privat:ejthan/lobos-factory.git`. Best end state —
   `gh` keeps handling the API (which is all `vcs.sh` needs) and git uses SSH.
2. A new key without passphrase, added with `gh ssh-key add`.
3. Finish `gh auth refresh -h github.com -s workflow` — press Enter for the device flow
   *before* switching windows, the one-time code expires.

## Acceptance criteria (draft)

- `git mv docs/ci/github-ci.yml .github/workflows/ci.yml` is pushed to `main`.
- The `core` job is green: shell syntax, the board reads, the state machine refuses an
  illegal transition.
- The `product` job skips itself with a message while there is no `nx.json`.
- `docs/quality.md` loses the "no CI" weakness.
- How the push was made to work is written down in the report — the next repo will hit it.

## Out of scope

Anything about the product build. Ticket 001 turns the `product` job on by creating
`nx.json`.
