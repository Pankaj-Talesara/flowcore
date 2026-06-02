---
name: add-domain-type
description: Add a new domain resource (entity + request payloads) to the shared @repo/types package. Use when the user wants to define types for a new resource — e.g. "add a Project type", "create payload types for orders", "add an Invoice entity to shared types". Follows the existing User template so frontend and backend share one source of truth.
---

# Add a domain type to `@repo/types`

Shared contracts live in [packages/types/](../../../packages/types/). Every
resource follows the same shape established in
[src/domain/user.ts](../../../packages/types/src/domain/user.ts):

- an **`Entity`** interface — what the API returns (extends `Entity` from
  `../common.js`, which adds `id` + `createdAt`/`updatedAt`);
- a **`Create<Name>Payload`** — the `POST` body, with no server-managed fields;
- an **`Update<Name>Payload`** — usually `Partial<Create<Name>Payload>` for
  `PATCH`/`PUT`.

## Steps

1. **Create the module** `packages/types/src/domain/<resource>.ts` (singular,
   kebab-case filename; PascalCase type names). Mirror the User template:

   ```ts
   import type { Entity } from '../common.js'

   export type <Name>Status = 'active' | 'archived' // example enum-like union

   export interface <Name> extends Entity {
     // ...fields the API returns
   }

   /** Body for `POST /<resources>`. */
   export interface Create<Name>Payload {
     // ...client-supplied fields only
   }

   /** Body for `PATCH /<resources>/:id`. */
   export type Update<Name>Payload = Partial<Create<Name>Payload>
   ```

   - Use the shared scalar types from `../common.js` (`ID`, `ISODateString`,
     `Nullable`, etc.) rather than redefining them.
   - Keep the `.js` extension on relative imports — the package compiles with
     `NodeNext` module resolution.

2. **Export it from the barrel**
   [src/domain/index.ts](../../../packages/types/src/domain/index.ts):

   ```ts
   export * from './<resource>.js'
   ```

3. **Verify**:

   ```bash
   pnpm --filter @repo/types build
   pnpm --filter @repo/types lint
   ```

4. Consumers import via `import type { <Name>, Create<Name>Payload } from '@repo/types/domain'`.

## Conventions

- Type-only exports — no runtime values in domain modules.
- Don't import framework types (Fastify, React) here; this package stays
  framework-agnostic.
- If the resource needs runtime validation at the API boundary, flag that a Zod/
  TypeBox schema package would be the place for it — types alone don't validate.
