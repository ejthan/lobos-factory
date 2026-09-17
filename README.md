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
3. **The story** — dieses Repo ist der erste Kunde der Fabrik. Die GUI wurde allerdings
   von Hand gebaut, nicht von der Fabrik; siehe `docs/quality.md`.

Humans are *on* the loop, not *in* it: write tickets, approve specs, merge PRs, tune
the factory.

## Status

Core und GUI laufen lokal. Was fehlt: ein echter Agentenlauf gegen das Modell, das
vcs-Modul in der API, CI auf GitHub (Ticket 008) und das Onboarding fremder Repos
(Ticket 007). Siehe [docs/quality.md](docs/quality.md) — dort steht es ungeschönt.

## Run it

```bash
pnpm install
pnpm factory            # UI auf 4710, API auf 4711, Browser geht auf
pnpm factory add .      # dieses Repo registrieren (oder einen anderen Pfad)
```

Die Ports meiden bewusst 3000, 4200, 4300 und 1337 — die gehören unseren Apps.
Verschieben lassen sie sich so:

```bash
FACTORY_UI_PORT=5710 FACTORY_API_PORT=5711 pnpm factory
```

Der UI-Port steht zusätzlich als Default in `apps/ui/project.json`, die API-Adresse
im Browser-Bundle in `apps/ui/src/app/api.ts` — ein Bundle liest keine
Umgebungsvariablen.

Im Terminal geht alles auch ohne GUI:

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
