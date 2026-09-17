# Lobos Factory

A software factory: the development process as files, plus a local GUI that runs it
on any of our repos.

Three parts:

1. **Factory Core** (`packages/factory-core/`) — the process as files: rules, slash
   commands, subagents, skills, hooks, scripts. Portable, no code of its own. Works
   from the terminal with Claude Code in any repo.
2. **Factory GUI** (`apps/ui`, `apps/api`) — Angular + NestJS, runs locally, drives
   the Core through the Claude Agent SDK. Board over several repos, the two human
   gates as buttons, live agent transcript, dashboard.
3. **The story** — this repo starts naked (Core only) and the factory builds its own
   GUI. The git history is the proof.

Humans are *on* the loop, not *in* it: write tickets, approve specs, merge PRs, tune
the factory.

## Status

Phase 0–2: naked factory. The GUI does not exist yet — tickets 001–007 build it.

## Run it

Terminal only, for now:

```bash
claude
```

Then `/factory-core:factory-status` for the board and `/factory-core:factory-run 001` to
start the first ticket. If the commands are not there, register the local plugin once:

```bash
claude plugin marketplace add ./packages --scope project
claude plugin install factory-core@lobos-local --scope project -y
```

While changing the Core itself, run `claude --plugin-dir packages/factory-core` — an
installed plugin runs from a cache copy, a `--plugin-dir` one from the working tree.

See [AGENTS.md](AGENTS.md) for the rules and [FACTORY_PLAN.md](FACTORY_PLAN.md) for
the build plan.
