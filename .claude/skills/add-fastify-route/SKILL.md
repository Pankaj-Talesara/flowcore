---
name: add-fastify-route
description: Scaffold a new HTTP route/endpoint in the Fastify API (apps/api). Use when the user wants to add an endpoint — e.g. "add a GET /users route", "create a CRUD endpoint for projects", "add a health route". Produces a typed route module wired to @fastify/autoload and the @repo/types ApiResponse envelope.
---

# Add a Fastify route to `apps/api`

The API is bootstrapped with Fastify-CLI and uses
[`@fastify/autoload`](../../../apps/api/src/app.ts) — **any `.ts` file under
[apps/api/src/routes/](../../../apps/api/src/routes/) is auto-registered**, and
its folder path becomes the URL prefix. No manual route registration needed.

Reference the existing
[src/routes/root.ts](../../../apps/api/src/routes/root.ts) for the plugin shape.

## Routing rules (autoload)

- `src/routes/root.ts` → `/`
- `src/routes/users/index.ts` → `/users`
- `src/routes/users/[id].ts` is **not** the pattern here — use Fastify path
  params: define `/:id` inside `src/routes/users/index.ts`.

## Steps

1. **Create the route module** `src/routes/<resource>/index.ts` as a
   `FastifyPluginAsync`:

   ```ts
   import { type FastifyPluginAsync } from 'fastify'
   import { ok, fail, ErrorCode, HttpStatus } from '@repo/types'
   import type {
     <Name>,
     Create<Name>Payload,
   } from '@repo/types/domain'

   const <resource>: FastifyPluginAsync = async (fastify): Promise<void> => {
     fastify.get('/', async () => {
       const items: <Name>[] = await getAll()
       return ok(items)
     })

     fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
       const item = await getById(req.params.id)
       if (!item) {
         reply.code(HttpStatus.NOT_FOUND)
         return fail(ErrorCode.NOT_FOUND, '<Name> not found')
       }
       return ok(item)
     })

     fastify.post<{ Body: Create<Name>Payload }>('/', async (req, reply) => {
       const created = await create(req.body)
       reply.code(HttpStatus.CREATED)
       return ok(created)
     })
   }

   export default <resource>
   ```

   - **Always return the envelope.** Wrap success data in `ok(...)`, errors in
     `fail(code, message)`, and set the status with `reply.code(HttpStatus.X)`.
     Don't return bare objects.
   - Type the request generically (`fastify.get<{ Params; Querystring; Body }>`)
     so handlers are type-checked against `@repo/types`.
   - `@fastify/sensible` is registered — `fastify.httpErrors.notFound()` etc. are
     available if you prefer throwing over returning `fail()`. Pick one style per
     route and be consistent.

2. **Add a JSON schema** for `body`/`querystring`/`params` on routes that accept
   input, so Fastify validates at the boundary (the TS payload type is
   compile-time only). Keep the schema and the `@repo/types` payload in sync.

3. **Add a test** under `apps/api/test/routes/<resource>.test.ts`, mirroring
   [test/routes/root.test.ts](../../../apps/api/test/routes/root.test.ts) and
   using the `build` helper from
   [test/helper.ts](../../../apps/api/test/helper.ts).

4. **Verify**:

   ```bash
   pnpm --filter api lint
   pnpm --filter api test
   ```
