---
name: add-prisma-model
description: Add or change a database model in the Fastify API's Prisma schema, then generate the client and create a migration. Use when the user wants to add a table/model, add or change a column, add an index/relation, or run a migration — e.g. "add a Project model", "add a status column to users", "create a migration". Covers the prisma-client generator output, the @prisma-client access pattern, and the migrate workflow used in apps/api.
---

# Add / change a Prisma model in `apps/api`

Postgres + Prisma 7 via `@prisma/adapter-pg`, keyed off `DATABASE_URL` (loaded by `dotenv`).

| Path | Role |
| --- | --- |
| [prisma/schema.prisma](../../../apps/api/prisma/schema.prisma) | Schema — datasource + models. **Edit here.** |
| [prisma.config.ts](../../../apps/api/prisma.config.ts) | Points at schema, migrations dir, `DATABASE_URL`. |
| [prisma/migrations/](../../../apps/api/prisma/migrations/) | Generated SQL (committed). |
| `src/generated/prisma/` | Generated client + row types. Do not hand-edit. |
| [src/lib/prisma.ts](../../../apps/api/src/lib/prisma.ts) | The single `PrismaClient`, exported as `@prisma-client`. |

Generator uses the new `prisma-client` provider (not `prisma-client-js`), ESM, `importFileExtension = "js"`, `output = "../src/generated/prisma"`.

## Steps

1. **Edit the model** in [schema.prisma](../../../apps/api/prisma/schema.prisma). Match `User`: `String @id @default(uuid(7))` ids, `createdAt DateTime @default(now())`, and `updatedAt DateTime` with **no `@updatedAt`** — so route code sets `updatedAt: new Date()` explicitly on create/update.

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

   For relations, add the inverse field on the other model (`projects Project[]` on `User`).

2. **Migrate + regenerate** from `apps/api`:

   ```bash
   cd apps/api && pnpm exec prisma migrate dev --name <change_description>
   ```

   This applies SQL, writes a migration folder, **and** runs `prisma generate`. For a generator-only change, run `pnpm exec prisma generate`.

3. **Use it** via the shared client + generated row types — never instantiate `PrismaClient` ad hoc:

   ```ts
   import { prisma } from '@prisma-client'
   import { Project } from '../../generated/prisma/client'

   await prisma.project.create({ data: { name, ownerId, updatedAt: new Date() } })
   ```

   For a response shape, wrap in `WithError<Project>` (see `add-domain-type`, `add-fastify-route`).

4. Verify: `pnpm --filter api exec tsc --noEmit && pnpm --filter api lint`

## Notes

- Migrations are committed; the generated client is output (check ignore rules; regenerate after pulling a schema change).
- `migrate dev` needs a reachable `DATABASE_URL`. CI/prod: `prisma migrate deploy` (never prompts).
- Prefer additive migrations; a rename/type change may prompt to reset the dev DB — review the generated SQL before applying to real data.
