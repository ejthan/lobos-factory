---
name: conventional-commits
description: Use when committing in a factory repo - the message format, scopes, and what belongs in one commit.
---

# Conventional commits

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `perf`.
Scope: the Nx project or folder — `ui`, `api`, `shared-models`, `factory`.
Subject: imperative, lowercase, no period, under 72 characters.

```
feat(api): stream run events over SSE
test(ui): cover the permission prompt
chore(factory): spec for 003
```

One commit is one idea. A commit that needs "and" in its subject is two commits. Never mix
a refactor into a feature commit — the reviewer has to be able to read them apart.

Factory bookkeeping (state changes, specs, plans, reports) is `chore(factory): …`.

The commit body is for *why*, when the why is not obvious. The diff already says what.

Never commit: `.env`, credentials, binaries, `node_modules`, anything under `.factory/`.
Stage the files you changed, not `git add -A`.
