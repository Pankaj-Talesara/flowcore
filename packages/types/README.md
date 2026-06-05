# `@repo/types`

Shared, framework-agnostic contracts for the Flowcore monorepo — the single
source of truth for what the API sends and accepts. Consumed by both the
Fastify backend (`apps/api`) and the Next.js frontend (`apps/web`).

This is a **type-only package**: every export is erased at compile time, so
there is **no build step and no `dist/`**. `package.json` exports the source
files directly:

```jsonc
"exports": { "./*": "./src/*.ts" }
```

A file `src/<feature>.ts` is therefore imported as `@repo/types/<feature>`.
There is **no barrel `index`** — import the specific module you need.

## Install

It's already wired as a workspace dependency. To add it to another app:

```jsonc
// apps/<app>/package.json
"dependencies": {
  "@repo/types": "workspace:*"
}
```

Then `pnpm install`. Nothing to build — consumers resolve the `.ts` source.

## The error envelope

Every fallible response is the union `WithError<T>` from `./common`. A handler
returns either the success payload `T` **or** an `ICommonErrorResponse`
(`{ code, message }`). There is **no `ok()`/`fail()` helper and no `success`
field** — the HTTP status is set on the Fastify route via `reply.status(...)`.

```ts
// packages/types/src/common.ts
export interface ICommonErrorResponse {
  code: string
  message: string
}
export type WithError<T> = T | ICommonErrorResponse
```

## Usage

```ts
import { WithError } from '@repo/types/common'
import { ICreateOrUpdateUserPayload, TCreateOrUpdateUserResponse } from '@repo/types/auth'

// Backend — a Fastify handler annotates its return with the response type
async function register(body: ICreateOrUpdateUserPayload): Promise<TCreateOrUpdateUserResponse> {
  const user = await createUser(body)
  return { message: 'created', userId: user.id } // or: { code, message } on failure
}
```

## Modules

| Subpath              | Contents                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@repo/types/common` | `ICommonErrorResponse`, `WithError<T>`.                                                                                                               |
| `@repo/types/auth`   | Auth payloads/responses: `ICreateOrUpdateUserPayload`, `IUserLoginPayload`, `UserJwtPayload`, `TCreateOrUpdateUserResponse`, `TRefreshTokenResponse`. |
| `@repo/types/health` | `THealthCheckSuccessResponse`.                                                                                                                        |

## Conventions

- **One flat module per feature** under `src/` (no `src/domain/` folder). Group
  a resource's payloads and response shapes in `src/<feature>.ts`.
- **Naming**: `I`-prefix for interfaces (payloads/entities), `T`-prefix for type
  aliases (response unions). Wrap fallible responses in `WithError<T>`.
- Relative imports keep the `.js` extension (`from './common.js'`).
- Type-only — **no runtime values**. Runtime validation lives in
  [`@repo/utils`](../utils/README.md) (Zod); for an entity the DB owns, the API
  returns the Prisma-generated row type rather than a hand-written interface.

## Scripts

| Script             | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `pnpm check-types` | Type-check the package (`tsc --noEmit`). |
| `pnpm lint`        | Lint the package.                        |
| `pnpm clean`       | Remove `.turbo` caches.                  |
