---
name: add-fastify-route
description: Scaffold a new HTTP route/endpoint in the Fastify API (apps/api). Use when the user wants to add an endpoint — e.g. "add a GET /users route", "create a CRUD endpoint for projects", "add a health route". Produces a typed route module wired to @fastify/autoload, returning the @repo/types WithError<T> envelope, with Zod validation and Prisma access.
---

# Add a Fastify route to `apps/api`

The API is bootstrapped with Fastify-CLI and uses
[`@fastify/autoload`](../../../apps/api/src/app.ts) — **any `index.ts` under a
folder in [apps/api/src/routes/](../../../apps/api/src/routes/) is
auto-registered**, and its folder path becomes the URL prefix. No manual route
registration needed. Reference the existing
[src/routes/auth/index.ts](../../../apps/api/src/routes/auth/index.ts),
[src/routes/users/index.ts](../../../apps/api/src/routes/users/index.ts), and
[src/routes/health/index.ts](../../../apps/api/src/routes/health/index.ts).

## Routing rules (autoload)

- `src/routes/root.ts` → `/`
- `src/routes/auth/index.ts` → `/auth` (then `/auth/login`, `/auth/register`…)
- `src/routes/users/index.ts` → `/users`
- For an id param, define `/:id` **inside** the folder's `index.ts` — there is
  no `[id].ts` file convention here.

## Path aliases (set in [tsconfig.json](../../../apps/api/tsconfig.json))

Imports use these aliases, resolved at build by `tsc-alias`:

- `@prisma-client` → the shared Prisma client (`src/lib/prisma.ts`)
- `@lib/*` → `src/lib/*` (e.g. `@lib/auth`)
- `@repo/types/<feature>`, `@repo/utils/schema`, `@repo/utils/validation` — the
  shared packages

## The response convention (important — there is NO `ok()`/`fail()`)

Handlers **return the value directly** and annotate the return type with the
shared `WithError<T>` envelope from `@repo/types`. There is no response-wrapper
helper, no `success` field, no `ApiResponse`, no `HttpStatus`/`ErrorCode` enum.

- **Success** → return the payload object.
- **Failure** → set the status with `reply.status(<code>)` and return
  `{ code, message }` (the `ICommonErrorResponse` shape).

Define the success/payload/response types in `@repo/types` first (see the
`add-domain-type` skill).

## Steps

1. **Create the route module** `src/routes/<resource>/index.ts` as a
   `FastifyPluginAsync`:

   ```ts
   import { prisma } from '@prisma-client'
   import { ICreate<Name>Payload, T<Name>Response } from '@repo/types/<feature>'
   import { type FastifyPluginAsync } from 'fastify'

   const <resource>: FastifyPluginAsync = async (fastify): Promise<void> => {
     fastify.get('/', async function (): Promise<T<Name>Response> {
       const items = await prisma.<model>.findMany()
       return { items }
     })

     fastify.get<{ Params: { id: string } }>(
       '/:id',
       async function ({ params }, reply): Promise<T<Name>Response> {
         const item = await prisma.<model>.findFirst({ where: { id: params.id } })
         if (!item) {
           reply.status(404)
           return { code: 'NOT_FOUND', message: '<Name> not found' }
         }
         return item
       },
     )

     fastify.post<{ Body: ICreate<Name>Payload }>(
       '/',
       async function ({ body }, reply): Promise<T<Name>Response> {
         reply.status(201)
         return prisma.<model>.create({ data: body })
       },
     )
   }

   export default <resource>
   ```

   - Always annotate the handler's `Promise<...>` return type with the
     `@repo/types` response type so it's checked against the contract.
   - Type the request generically (`fastify.post<{ Params; Querystring; Body }>`)
     so `body`/`params` are typed.
   - `@fastify/sensible` is registered (see
     [src/plugins/sensible.ts](../../../apps/api/src/plugins/sensible.ts)) —
     `fastify.httpErrors.*` is available if you prefer throwing, but the
     established style in this codebase is `reply.status(n)` + a returned
     `{ code, message }`. Match it.

2. **Validate input with Zod**, not joi. The `joi` dependency is still in
   `package.json` but is unused — validation lives in `@repo/utils`. Reuse or
   add a schema there (see the `share-validation-rule` skill) and `safeParse` it,
   mirroring [auth/index.ts](../../../apps/api/src/routes/auth/index.ts):

   ```ts
   import { registrationSchema } from '@repo/utils/schema'

   const result = registrationSchema.safeParse(body)
   if (!result.success) {
     reply.status(422)
     return { code: 'INVALID_INPUT', message: '...' }
   }
   ```

3. **Protect the route** if it needs an authenticated user. The `authenticate`
   plugin decorates `fastify.authenticate`; add it as a `preHandler` and read
   `request.user` (see the `protect-route-auth` skill and
   [users/index.ts](../../../apps/api/src/routes/users/index.ts)):

   ```ts
   fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
     const userId = request.user?.userId
     // ...
   })
   ```

4. **Verify** (note: api has no `check-types` script — call `tsc` directly; the
   `test/` directory does **not** exist in this repo, so there is no test step):

   ```bash
   pnpm --filter api exec tsc --noEmit
   pnpm --filter api lint
   ```

## Notes

- Prisma access is always via the shared client `import { prisma } from
'@prisma-client'`. Row types come from the generated client
  (`src/generated/prisma/client`) — see the `add-prisma-model` skill.
- The legacy Fastify-CLI `test/` scaffolding referenced by the `test` script in
  [package.json](../../../apps/api/package.json) was removed; if you add tests,
  re-establish a `test/helper.ts` + `test/routes/*.test.ts` harness first.
