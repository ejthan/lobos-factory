---
name: nx-conventions
description: Use when adding or changing projects in the Nx workspace - layout, tags, module boundaries and the commands.
---

# Nx conventions

```
apps/ui         Angular, standalone components + signals
apps/ui-e2e     Playwright
apps/api        NestJS
libs/shared/models   the types ui and api share
```

## Boundaries

Every project carries tags; the `@nx/enforce-module-boundaries` lint rule is what makes
them real:

| tag | may depend on |
|---|---|
| `type:app` | `type:lib` |
| `type:lib` | `type:lib` |
| `scope:ui` | `scope:ui`, `scope:shared` |
| `scope:api` | `scope:api`, `scope:shared` |
| `scope:shared` | `scope:shared` |

`ui` never imports from `api` and the other way round. Anything both need is a type in
`libs/shared/models` — one source of truth for `Ticket`, `Run`, `RunEvent`, `Report`,
`RepoConfig`.

## Commands

Run through the ones in `.factory.yml`, not from memory:

```bash
pnpm nx affected -t lint
pnpm nx affected -t test
pnpm nx affected -t e2e
pnpm nx e2e ui-e2e --grep @smoke
```

`affected` is the point of the workspace. A full-graph run in CI means the tags are wrong.

## Generating

Use the generators (`nx g @nx/angular:app`, `@nx/nest:app`, `@nx/js:lib`) rather than
hand-written project files, then trim what they produce. Never run `nx init` on a repo
that already has the factory in it.
