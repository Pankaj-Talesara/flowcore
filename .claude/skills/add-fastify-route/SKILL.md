---
name: add-fastify-route
description: Scaffold a new HTTP route/endpoint in the Fastify API (apps/api). Use when the user wants to add an endpoint — e.g. "add a GET /users route", "create a CRUD endpoint for projects", "add a health route". Produces a typed route module wired to @fastify/autoload, returning the @repo/types WithError<T> envelope, with Zod validation and Prisma access.
---

# Add a Fastify route to `apps/api`

Uses [`@fastify/autoload`](../../../apps/api/src/app.ts): **any `index.ts` under [apps/api/src/routes/](../../../apps/api/src/routes/) is auto-registered**, its folder path becomes the URL prefix. No manual registration. Reference [auth](../../../apps/api/src/routes/auth/index.ts), [users](../../../apps/api/src/routes/users/index.ts), [health](../../../apps/api/src/routes/health/index.ts).

## Rules

- `routes/root.ts`→`/`, `routes/users/index.ts`→`/users`, `routes/auth/index.ts`→`/auth/*`.
- For an id param, define `/:id` **inside** the folder's `index.ts` — no `[id].ts` convention.
- **Path aliases** ([tsconfig.json](../../../apps/api/tsconfig.json), resolved by `tsc-alias`): `@prisma-client` → shared Prisma client, `@lib/*` → `src/lib/*`, plus `@repo/types/*`, `@repo/utils/schema`, `@repo/utils/validation`.
- **Response convention (no `ok()`/`fail()`, no `success` field, no enums)**: handlers return the value directly, annotated with `WithError<T>` from `@repo/types`. Success → return payload. Failure → `reply.status(code)` + return `{ code, message }`. Define the types in `@repo/types` first (`add-domain-type`).

## Steps

1. Create `src/routes/<resource>/index.ts` as a `FastifyPluginAsync`:

   ```ts
   import { prisma } from '@prisma-client'
   import { ICreate<Name>Payload, T<Name>Response } from '@repo/types/<feature>'
   import { type FastifyPluginAsync } from 'fastify'

   const <resource>: FastifyPluginAsync = async (fastify): Promise<void> => {
     fastify.get('/', async (): Promise<T<Name>Response> => {
       return { items: await prisma.<model>.findMany() }
     })

     fastify.get<{ Params: { id: string } }>('/:id', async ({ params }, reply): Promise<T<Name>Response> => {
       const item = await prisma.<model>.findFirst({ where: { id: params.id } })
       if (!item) { reply.status(404); return { code: 'NOT_FOUND', message: '<Name> not found' } }
       return item
     })

     fastify.post<{ Body: ICreate<Name>Payload }>('/', async ({ body }, reply): Promise<T<Name>Response> => {
       reply.status(201)
       return prisma.<model>.create({ data: body })
     })
   }
   export default <resource>
   ```

   - Always annotate `Promise<...>` with the `@repo/types` response type so it's checked against the contract.
   - Type requests generically (`fastify.post<{ Params; Querystring; Body }>`).
   - `@fastify/sensible` is registered (`fastify.httpErrors.*` available), but the codebase style is `reply.status(n)` + `{ code, message }` — match it.

2. **Validate with Zod** (not joi — `joi` is unused legacy). Reuse/add a schema in `@repo/utils` (`share-validation-rule`) and `safeParse`:

   ```ts
   import { registrationSchema } from '@repo/utils/schema'
   const result = registrationSchema.safeParse(body)
   if (!result.success) { reply.status(422); return { code: 'INVALID_INPUT', message: '...' } }
   ```

3. **Protect** if it needs auth: add `{ preHandler: [fastify.authenticate] }` and read `request.user` (see `protect-route-auth`).

4. Verify (api has no `check-types` script; no `test/` dir exists):

   ```bash
   pnpm --filter api exec tsc --noEmit && pnpm --filter api lint
   ```

Prisma access is always `import { prisma } from '@prisma-client'`; row types from `src/generated/prisma/client` (see `add-prisma-model`).
