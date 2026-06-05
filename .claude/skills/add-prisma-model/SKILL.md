---
name: add-prisma-model
description: Add or change a database model in the Fastify API's Prisma schema, then generate the client and create a migration. Use when the user wants to add a table/model, add or change a column, add an index/relation, or run a migration — e.g. "add a Project model", "add a status column to users", "create a migration". Covers the prisma-client generator output, the @prisma-client access pattern, and the migrate workflow used in apps/api.
---

# Add / change a Prisma model in `apps/api`

The database layer lives in [apps/api](../../../apps/api/). Postgres + Prisma 7,
driven by the `@prisma/adapter-pg` driver adapter. Everything is keyed off
`DATABASE_URL` (loaded via `dotenv`).

## The moving parts

| Path | Role |
| --- | --- |
| [prisma/schema.prisma](../../../apps/api/prisma/schema.prisma) | The schema — datasource + `User` model. **Edit models here.** |
| [prisma.config.ts](../../../apps/api/prisma.config.ts) | Prisma config — points at the schema, the `prisma/migrations` dir, and the `DATABASE_URL`. |
| [prisma/migrations/](../../../apps/api/prisma/migrations/) | Generated SQL migrations (committed). |
| `src/generated/prisma/` | **Generated client + row types** (`User`, `PrismaClient`, …). `output` in the generator block. Do not hand-edit. |
| [src/lib/prisma.ts](../../../apps/api/src/lib/prisma.ts) | The single `PrismaClient` instance, exported via the `@prisma-client` alias. |

The generator is configured for the **new `prisma-client` provider** (not the
legacy `prisma-client-js`), ESM, with `importFileExtension = "js"`:

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  moduleFormat        = "esm"
  importFileExtension = "js"
}
```

## Steps

1. **Edit the model** in
   [prisma/schema.prisma](../../../apps/api/prisma/schema.prisma). Match the
   `User` conventions — `String @id @default(uuid(7))` for ids, explicit
   `createdAt DateTime @default(now())` and `updatedAt DateTime` (note: `updatedAt`
   has **no `@updatedAt`** here, so route code sets `updatedAt: new Date()`
   explicitly on create/update — see
   [auth/index.ts](../../../apps/api/src/routes/auth/index.ts)):

   ```prisma
   model Project {
     id        String   @id @default(uuid(7))
     name      String
     ownerId   String
     owner     User     @relation(fields: [ownerId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime
   }
   ```

   Add the inverse relation field on the other model (`projects Project[]` on
   `User`) for relations.

2. **Create the migration + regenerate the client** from `apps/api`:

   ```bash
   cd apps/api
   pnpm exec prisma migrate dev --name <change_description>
   ```

   `migrate dev` applies the SQL to the dev DB, writes a new folder under
   `prisma/migrations/`, **and** runs `prisma generate` (refreshing
   `src/generated/prisma/`). If you only changed the generator/regen without a
   schema change, run `pnpm exec prisma generate`.

3. **Use the model** in routes via the shared client and generated row types —
   never instantiate `PrismaClient` ad hoc:

   ```ts
   import { prisma } from '@prisma-client'
   import { Project } from '../../generated/prisma/client'

   const project = await prisma.project.create({
     data: { name, ownerId, updatedAt: new Date() },
   })
   ```

   For an API response shape, wrap the row type in the shared envelope:
   `WithError<Project>` from `@repo/types/common` (see the `add-domain-type` and
   `add-fastify-route` skills).

4. **Verify**:

   ```bash
   pnpm --filter api exec tsc --noEmit
   pnpm --filter api lint
   ```

## Notes

- **Migrations are committed**; the generated client (`src/generated/prisma/`)
  is generated output — check the repo's ignore rules before committing it, and
  regenerate with `prisma generate` after pulling a schema change.
- `prisma migrate dev` needs a reachable `DATABASE_URL`. For CI / prod, use
  `prisma migrate deploy` (applies committed migrations, never prompts).
- Production data: prefer additive migrations; a column rename or type change
  Prisma can't do safely will prompt to reset the dev DB — review the generated
  SQL before applying anywhere with real data.
- The shared client uses the pg driver adapter
  ([src/lib/prisma.ts](../../../apps/api/src/lib/prisma.ts)); keep that the only
  place a `PrismaClient` is constructed.
