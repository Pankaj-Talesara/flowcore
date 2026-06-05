# Flowcore

A pnpm + Turborepo monorepo: a Fastify API backed by Postgres/Prisma and a
Next.js 16 web app, sharing typed contracts and validation rules through
`@repo/*` workspace packages.

## What's inside

### Apps

- **`apps/api`** — Fastify 5 (Fastify-CLI + `@fastify/autoload`) API. Postgres
  via Prisma 7, stateless JWT auth in httpOnly cookies. See
  [apps/api/README.md](apps/api/README.md).
- **`apps/web`** — Next.js 16 (App Router, React 19, Tailwind v4 + shadcn/ui).
  Internationalized with next-intl, server state via TanStack React Query. See
  [apps/web/README.md](apps/web/README.md).

### Packages

- **`@repo/types`** — type-only shared API contracts (`WithError<T>` envelope,
  per-feature payload/response types). [packages/types](packages/types/).
- **`@repo/utils`** — compiled package of shared runtime helpers: validation
  regexes (`./validation`) and the Zod schemas built from them (`./schema`).
  [packages/utils](packages/utils/).
- **`@repo/eslint-config`** — shared ESLint flat configs (`base`, `next-js`,
  `react-internal`).
- **`@repo/typescript-config`** — shared `tsconfig` bases (`base.json`,
  `nextjs.json`).

## Getting started

```sh
pnpm install
```

Set the env vars each app needs (see each app's README) — `apps/api` needs
`DATABASE_URL` and the `AUTH_*` secrets; `apps/web` needs `API_ORIGIN` (the
origin the `/api/*` rewrite proxies to). Then:

```sh
pnpm dev            # run every app in dev (Turbo)
pnpm dev --filter web    # or a single app
```

## Common scripts (root, via Turbo)

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `pnpm dev`           | Run all apps in watch mode.                          |
| `pnpm build`         | Build everything (`^build` orders deps first).       |
| `pnpm lint`          | Lint every package/app.                              |
| `pnpm check-types`   | Type-check every package/app.                        |
| `pnpm format`        | Prettier-format the repo.                            |

Filter to one workspace with `--filter <name>` (e.g. `pnpm build --filter api`).

## Conventions

The repo's recurring patterns are documented as skills in
[.claude/skills/](.claude/skills/) — adding a shared type, a Fastify route, a
Prisma model, protecting a route with auth, sharing a validation rule, adding a
shadcn component, i18n copy, React Query data access, and scaffolding new
apps/packages. Reach for those before inventing a new pattern.
