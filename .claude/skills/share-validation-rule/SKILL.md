---
name: share-validation-rule
description: Add or change a validation rule (regex, min/max length, allowed-value set) that BOTH the frontend and backend enforce. Use whenever a rule needs to exist in apps/web client-side checks AND the apps/api request validation — e.g. "add a username field with validation", "change the password rules", "validate phone numbers on signup". Prevents the classic drift where the signup form hardcodes a regex that silently diverges from the API. The rule lives once in @repo/utils and both sides import it.
---

# Share a validation rule across web + api

Any field rule that the client checks for instant feedback **and** the server
enforces as the authority must have a single source of truth in
[@repo/utils](../../../packages/utils/). Never re-declare the same regex/limit
in an app — that is exactly how the two drift (e.g. the form accepting passwords
the API later rejects).

`@repo/utils` is a **compiled** package (runtime values, not type-only) with two
entry points:

| File | Exports | Import as |
| --- | --- | --- |
| [src/validation.ts](../../../packages/utils/src/validation.ts) | `NAME_REGEX`, `PASSWORD_REGEX`, `EMAIL_REGEX` + `isValidName/Password/Email` helpers | `@repo/utils/validation` |
| [src/schema.ts](../../../packages/utils/src/schema.ts) | **Zod** schemas built from those regexes (e.g. `registrationSchema`) | `@repo/utils/schema` |

The API validates with **Zod** (`schema.safeParse(...)`), not joi — `joi` is
still listed in `apps/api/package.json` but is unused legacy.

## The rule

> If a constraint is enforced in more than one place, the regex/limit is defined
> in `@repo/utils/validation` and imported. A literal regex or magic length in a
> page, component, or API schema is a bug. The API's Zod schema in
> `@repo/utils/schema` is built from the same regexes — never re-type the pattern
> inside the schema.

## Steps

1. **Add (or edit) the regex in
   [packages/utils/src/validation.ts](../../../packages/utils/src/validation.ts).**
   Make the regex express the *full* constraint so neither side needs extra
   `.min()/.max()` glue, and add an `isValid*` helper:

   ```ts
   /** Alphanumeric, 8–30 characters. */
   export const PASSWORD_REGEX = /^[a-zA-Z0-9]{8,30}$/
   export function isValidPassword(value: string): boolean {
     return PASSWORD_REGEX.test(value)
   }
   ```

2. **Wire it into the Zod schema in
   [packages/utils/src/schema.ts](../../../packages/utils/src/schema.ts)** by
   `.regex(...)` off the constant — so the server schema can't drift from the
   client regex. Keep the schema `satisfies z.ZodType<...>` against the matching
   `@repo/types` payload:

   ```ts
   import { PASSWORD_REGEX, NAME_REGEX, EMAIL_REGEX } from './validation.js'

   export const registrationSchema = z.object({
     name: z.string().regex(NAME_REGEX),
     email: z.string().regex(EMAIL_REGEX),
     password: z.string().regex(PASSWORD_REGEX),
   }) satisfies z.ZodType<ICreateOrUpdateUserPayload>
   ```

3. **Rebuild the package** so consumers get the new JS + types
   (`@repo/utils` ships `dist/`):

   ```bash
   pnpm --filter @repo/utils build
   ```

4. **Backend — `apps/api`.** Import the schema and `safeParse` the body; map a
   failed path to a `{ code, message }` error (mirrors
   [auth/index.ts](../../../apps/api/src/routes/auth/index.ts)):

   ```ts
   import { registrationSchema } from '@repo/utils/schema'

   const result = registrationSchema.safeParse(body)
   if (!result.success) {
     const field = result.error.issues[0]?.path[0]
     reply.status(422)
     return { code: 'INVALID_INPUT', message: `Invalid ${String(field)}` }
   }
   ```

5. **Frontend — `apps/web`.** Import the regex/helper for instant feedback;
   delete any local copy:

   ```ts
   import { PASSWORD_REGEX } from '@repo/utils/validation'
   if (!PASSWORD_REGEX.test(password)) setClientError(t('validation.password'))
   ```

6. **Wire the dependency** if an app doesn't already have it
   (`apps/api` already does), then install:

   ```jsonc
   // apps/<app>/package.json
   "dependencies": { "@repo/utils": "workspace:*" }
   ```

   ```bash
   pnpm install
   ```

7. **Verify** both sides compile and lint against the shared rule:

   ```bash
   pnpm --filter @repo/utils build
   pnpm --filter web check-types && pnpm --filter web lint
   pnpm --filter api exec tsc --noEmit && pnpm --filter api lint
   ```

## Notes

- `@repo/utils` ships **runtime** values, so it must be built (`dist/`) before
  consumers resolve it. Turbo's `build` `dependsOn: ["^build"]`, so a full build
  orders it correctly; for ad-hoc edits run the `--filter @repo/utils build`.
- Email is a special case: the client uses `EMAIL_REGEX` for shape feedback,
  and the schema uses the same regex. If you want a stricter server check, layer
  it inside the Zod schema only — the shared regex stays the floor both sides
  agree on.
- The server is always the authority. Client-side checks exist purely for fast
  feedback; never weaken or skip server validation because the client checks too.
- To create the `@repo/utils` package itself (if it ever doesn't exist), use the
  `new-package` skill with the compiled-package pattern.
