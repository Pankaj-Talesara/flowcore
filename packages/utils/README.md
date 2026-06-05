# `@repo/utils`

Shared, framework-agnostic runtime helpers for the Flowcore monorepo. Consumed
by both the Fastify backend (`apps/api`) and the Next.js frontend (`apps/web`).

Unlike [`@repo/types`](../types/README.md) (type-only, erased at compile time),
this package ships **real runtime values**, so it is a compiled package: it
builds to `dist/` and consumers import the emitted JS.

## Why this exists

Validation rules used to be re-declared in each app — e.g. the signup form
hardcoded `NAME_RE`/`PASSWORD_RE` regexes that mirrored the API's schema, which
is exactly how the two drift apart. Those rules now live here once and are
imported by both sides: the client for instant feedback, the server (via the
Zod schema in `./schema`) as the authority.

## Install

It's wired as a workspace dependency. To add it to another app:

```jsonc
// apps/<app>/package.json
"dependencies": {
  "@repo/utils": "workspace:*"
}
```

Then `pnpm install`. Turbo builds `@repo/utils` before any dependent (`build`
already `dependsOn: ["^build"]`).

## Usage

```ts
import { NAME_REGEX } from '@repo/utils/validation'
import { registrationSchema } from '@repo/utils/schema'

// Client — instant feedback off the lightweight regexes (no zod in the bundle)
if (!NAME_REGEX.test(name)) setError('Invalid name')

// Server — the zod schema is the authority
const result = registrationSchema.safeParse(body)
if (!result.success) {
  const field = result.error.issues[0]?.path[0] // 'name' | 'email' | 'password'
}
```

## Modules

There is **no barrel `index`** — import the specific subpath you need. This
keeps zod (a runtime dep of `./schema`) out of consumers that only want the
regexes from `./validation`.

| Subpath                  | Contents                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@repo/utils/validation` | Auth field rules (dependency-free): `NAME_REGEX`, `PASSWORD_REGEX`, `EMAIL_REGEX`, `isValidName`, `isValidPassword`, `isValidEmail`. |
| `@repo/utils/schema`     | zod schemas built from the rules above: `registrationSchema`, `RegistrationInput`.                                                   |

## Conventions

- Put a shared rule/helper/schema here the moment a second app needs it, instead
  of copy-pasting. One source of truth, imported everywhere.
- No barrel `index` re-export — add a dedicated subpath to `exports` per module
  so consumers pull in only what they use (and only the deps that module needs).
- The zod schema (`./schema`) is built from the regexes (`./validation`) so the
  server authority and the client feedback can never drift.

## Scripts

| Script             | Purpose                           |
| ------------------ | --------------------------------- |
| `pnpm build`       | Emit `dist/` (JS + `.d.ts`).      |
| `pnpm dev`         | Watch-compile during development. |
| `pnpm check-types` | Type-check without emitting.      |
| `pnpm lint`        | Lint the package.                 |
