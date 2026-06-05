---
name: share-validation-rule
description: Add or change a validation rule (regex, min/max length, allowed-value set) that BOTH the frontend and backend enforce. Use whenever a rule needs to exist in apps/web client-side checks AND the apps/api request validation — e.g. "add a username field with validation", "change the password rules", "validate phone numbers on signup". Prevents the classic drift where the signup form hardcodes a regex that silently diverges from the API. The rule lives once in @repo/utils and both sides import it.
---

# Share a validation rule across web + api

A field rule the client checks for instant feedback **and** the server enforces must have one source of truth in [@repo/utils](../../../packages/utils/). A literal regex/magic length in a page, component, or API schema is a bug — that's how the two drift. The server is always the authority; client checks are fast feedback only.

`@repo/utils` is a **compiled** package (runtime values, must build `dist/`), two entry points:

| File | Exports | Import as |
| --- | --- | --- |
| [src/validation.ts](../../../packages/utils/src/validation.ts) | `NAME_REGEX`, `PASSWORD_REGEX`, `EMAIL_REGEX` + `isValid*` helpers | `@repo/utils/validation` |
| [src/schema.ts](../../../packages/utils/src/schema.ts) | **Zod** schemas built from those regexes | `@repo/utils/schema` |

API validates with **Zod** (not joi — unused legacy).

## Steps

1. **Add/edit the regex** in [validation.ts](../../../packages/utils/src/validation.ts). Make it express the *full* constraint (no extra `.min()/.max()` glue needed) + add an `isValid*` helper:

   ```ts
   /** Alphanumeric, 8–30 chars. */
   export const PASSWORD_REGEX = /^[a-zA-Z0-9]{8,30}$/
   export const isValidPassword = (v: string) => PASSWORD_REGEX.test(v)
   ```

2. **Wire it into the Zod schema** in [schema.ts](../../../packages/utils/src/schema.ts) via `.regex(<const>)` — never re-type the pattern. Keep `satisfies z.ZodType<...>` against the matching `@repo/types` payload:

   ```ts
   import { PASSWORD_REGEX, NAME_REGEX, EMAIL_REGEX } from './validation.js'
   export const registrationSchema = z.object({
     name: z.string().regex(NAME_REGEX),
     email: z.string().regex(EMAIL_REGEX),
     password: z.string().regex(PASSWORD_REGEX),
   }) satisfies z.ZodType<ICreateOrUpdateUserPayload>
   ```

3. **Rebuild** so consumers get new JS + types: `pnpm --filter @repo/utils build`

4. **Backend** — `safeParse` the body, map a failed path to `{ code, message }`:

   ```ts
   import { registrationSchema } from '@repo/utils/schema'
   const result = registrationSchema.safeParse(body)
   if (!result.success) {
     reply.status(422)
     return { code: 'INVALID_INPUT', message: `Invalid ${String(result.error.issues[0]?.path[0])}` }
   }
   ```

5. **Frontend** — import the regex/helper for instant feedback; delete any local copy:

   ```ts
   import { PASSWORD_REGEX } from '@repo/utils/validation'
   if (!PASSWORD_REGEX.test(password)) setClientError(t('validation.password'))
   ```

6. **Wire the dep** if missing (`apps/api` already has it): add `"@repo/utils": "workspace:*"` to `package.json`, then `pnpm install`.

7. Verify:

   ```bash
   pnpm --filter @repo/utils build
   pnpm --filter web check-types && pnpm --filter web lint
   pnpm --filter api exec tsc --noEmit && pnpm --filter api lint
   ```

## Notes

- Email: client + schema use the same `EMAIL_REGEX`. For a stricter server check, layer it inside the Zod schema only — the shared regex is the floor.
- To create `@repo/utils` itself, use the `scaffold-workspace` skill (compiled-package pattern).
