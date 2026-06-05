---
name: add-domain-type
description: Add shared types (payloads + response shapes) for a resource to the @repo/types package. Use when the user wants to define the contract for a new resource — e.g. "add a Project type", "create payload types for orders", "add the request/response types for invoices". One source of truth imported by both the Fastify API and the Next.js web app.
---

# Add shared types to `@repo/types`

Contracts live in [packages/types/](../../../packages/types/) — a **type-only package, no build, no `dist/`**. [package.json](../../../packages/types/package.json) exports source directly (`"./*": "./src/*.ts"`), so `src/<feature>.ts` imports as `@repo/types/<feature>`. **No `src/domain/`, no barrel `index.ts`** — flat per-feature modules. Mirror [auth.ts](../../../packages/types/src/auth.ts), [common.ts](../../../packages/types/src/common.ts), [health.ts](../../../packages/types/src/health.ts).

## Conventions

- **Naming**: `I`-prefix for interfaces (payloads/entities), `T`-prefix for type aliases (response unions). e.g. `ICreateOrUpdateUserPayload`, `TCreateOrUpdateUserResponse`.
- **Error envelope**: wrap every fallible response in `WithError<T>` from `./common.js` — `type WithError<T> = T | ICommonErrorResponse` where `ICommonErrorResponse = { code, message }`. No `ok()`/`fail()` helper, no `success` field. HTTP status is set on the route via `reply.status(...)` (see `add-fastify-route`).
- **Relative imports keep `.js`** (`from './common.js'`) even though it ships `.ts`.
- **Type-only** — no runtime values (runtime validation lives in `@repo/utils`; see `share-validation-rule`). Don't import framework types (Fastify/React/Prisma classes) — referencing a Prisma row type happens in `apps/api`, not here.

## Steps

1. Create `packages/types/src/<feature>.ts` (singular kebab-case file, PascalCase types):

   ```ts
   import { WithError } from './common.js'

   /** Body for `POST /<resources>`. */
   export interface ICreate<Name>Payload { /* client-supplied fields only */ }

   /** Success of `GET /<resources>/:id`, or `{ code, message }`. */
   export type T<Name>Response = WithError<{ /* fields the API returns */ }>
   ```

   For a DB-owned entity (`id`/`createdAt`/`updatedAt`), the API typically returns the **Prisma row type** (e.g. `WithError<User>`) — declare only the *payload* and bespoke response shapes here. Add an entity interface only if the web app needs the shape independent of Prisma.

2. Consume directly on both sides — no rebuild:

   ```ts
   import { ICreate<Name>Payload, T<Name>Response } from '@repo/types/<feature>'
   ```

3. Verify:

   ```bash
   pnpm --filter @repo/types check-types && pnpm --filter @repo/types lint
   ```

If the resource needs request validation, pair with a Zod schema in `@repo/utils` (`share-validation-rule`) — types alone don't validate.
