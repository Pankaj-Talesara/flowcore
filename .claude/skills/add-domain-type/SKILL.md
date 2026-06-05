---
name: add-domain-type
description: Add shared types (payloads + response shapes) for a resource to the @repo/types package. Use when the user wants to define the contract for a new resource — e.g. "add a Project type", "create payload types for orders", "add the request/response types for invoices". One source of truth imported by both the Fastify API and the Next.js web app.
---

# Add shared types to `@repo/types`

Shared contracts live in [packages/types/](../../../packages/types/). It is a
**type-only package** — there is **no build step and no `dist/`**. The
`package.json` exports source files directly
([packages/types/package.json](../../../packages/types/package.json)):

```jsonc
"exports": { "./*": "./src/*.ts" }
```

So a file `src/<feature>.ts` is imported as `@repo/types/<feature>`. There is
**no `src/domain/` folder and no barrel `index.ts`** — types are grouped into
flat per-feature modules. The existing ones are
[src/common.ts](../../../packages/types/src/common.ts),
[src/auth.ts](../../../packages/types/src/auth.ts), and
[src/health.ts](../../../packages/types/src/health.ts) — mirror their shape.

## The conventions (follow these exactly)

- **Naming**: `I`-prefix for `interface`s (payloads/entities), `T`-prefix for
  `type` aliases (especially response unions). e.g. `ICreateOrUpdateUserPayload`,
  `TCreateOrUpdateUserResponse`.
- **The error envelope**: every response that can fail is wrapped in
  `WithError<T>` from [common.ts](../../../packages/types/src/common.ts):

  ```ts
  export interface ICommonErrorResponse {
    code: string
    message: string
  }
  export type WithError<T> = T | ICommonErrorResponse
  ```

  A handler returns either the success payload `T` **or** an
  `ICommonErrorResponse` (`{ code, message }`) — there is no `ok()`/`fail()`
  helper and no `success: boolean` field. The HTTP status is set on the route
  via `reply.status(...)` (see the `add-fastify-route` skill).
- **Relative imports keep the `.js` extension** (`import { WithError } from
  './common.js'`) even though the package ships `.ts` — match the existing files.

## Steps

1. **Create the module** `packages/types/src/<feature>.ts` (singular,
   kebab-case filename; PascalCase type names). Mirror
   [auth.ts](../../../packages/types/src/auth.ts):

   ```ts
   import { WithError } from './common.js'

   /** Body for `POST /<resources>`. */
   export interface ICreate<Name>Payload {
     // ...client-supplied fields only
   }

   /** What `GET /<resources>/:id` returns on success, or `{ code, message }`. */
   export type T<Name>Response = WithError<{
     // ...the fields the API returns
   }>
   ```

   - Don't redefine the error shape — always reuse `WithError` /
     `ICommonErrorResponse` from `./common.js`.
   - For an entity the DB owns (with `id`/`createdAt`/`updatedAt`), the API
     typically returns the **Prisma-generated** row type
     (`apps/api/src/generated/prisma/...`), as `users` does with
     `WithError<User>` — so you only need to declare the *payload* and any
     bespoke response shapes here, not a hand-written entity interface. Add an
     entity interface here only when the web app needs the shape independent of
     Prisma.

2. **Consume it.** No barrel re-export and no rebuild — import the module path
   directly on both sides:

   ```ts
   import { ICreate<Name>Payload, T<Name>Response } from '@repo/types/<feature>'
   ```

3. **Verify** (type-only — there is no `build`):

   ```bash
   pnpm --filter @repo/types check-types
   pnpm --filter @repo/types lint
   ```

## Conventions

- Type-only — no runtime values in these modules. (Runtime validation lives in
  `@repo/utils`; see the `share-validation-rule` skill.)
- Don't import framework types (Fastify, React, Prisma client classes) here so
  the package stays framework-agnostic — referencing a Prisma-generated *row
  type* from the API side is fine because that happens in `apps/api`, not here.
- If the resource needs request validation, pair this with a Zod schema in
  `@repo/utils` (`share-validation-rule` skill) — types alone don't validate.
