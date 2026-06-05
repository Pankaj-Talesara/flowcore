# `api`

The Flowcore HTTP API — [Fastify 5](https://fastify.dev) (bootstrapped with
Fastify-CLI), Postgres via [Prisma 7](https://www.prisma.io), and stateless JWT
auth in httpOnly cookies.

## Layout

- `src/app.ts` — app entry. Auto-loads everything in `src/plugins` and
  `src/routes` via [`@fastify/autoload`](https://github.com/fastify/fastify-autoload).
- `src/routes/**/index.ts` — routes. A folder's path becomes the URL prefix
  (`routes/auth/index.ts` → `/auth`). Handlers return the `WithError<T>` envelope
  from `@repo/types` and set status with `reply.status(...)`.
- `src/plugins/` — cross-cutting plugins. `authenticate.ts` decorates
  `fastify.authenticate` (JWT cookie guard); `sensible`, `support` are support
  plugins.
- `src/lib/` — `auth.ts` (token issue/verify), `prisma.ts` (the single
  `PrismaClient`, exported via the `@prisma-client` path alias).
- `prisma/` — `schema.prisma` + committed migrations. The generated client is
  emitted to `src/generated/prisma/`.

Validation is **Zod** (`@repo/utils/schema`), not joi. Types come from
`@repo/types`.

## Environment

Set these (e.g. in `.env`, loaded by `dotenv`):

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `AUTH_SECRET` / `AUTH_SECRET_EXPIRES_IN` | Access-token secret + expiry (seconds). |
| `AUTH_REFRESH_SECRET` / `AUTH_REFRESH_SECRET_EXPIRES_IN` | Refresh-token secret + expiry (seconds). |
| `NODE_ENV` | `production` enables the `secure` cookie flag. |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm --filter api dev` | Build, then run with watch + reload on `:8080`. |
| `pnpm --filter api start` | Build and start in production mode. |
| `pnpm --filter api build:ts` | Compile TS → `dist/` (then `tsc-alias` rewrites path aliases). |
| `pnpm --filter api lint` | Lint. |
| `pnpm --filter api exec tsc --noEmit` | Type-check (there is no `check-types` script). |
| `pnpm --filter api exec prisma migrate dev --name <x>` | Create a migration + regenerate the client. |

> The `test` script is inherited from the Fastify-CLI template but there is
> currently **no `test/` directory**. Re-establish a `test/helper.ts` +
> `test/routes/*.test.ts` harness before relying on it.

## Learn more

[Fastify docs](https://fastify.dev/docs/latest/) · [Prisma docs](https://www.prisma.io/docs).
