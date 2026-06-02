# `@repo/types`

Shared, framework-agnostic contracts for the Flowcore monorepo — the single
source of truth for what the API sends and accepts. Consumed by both the
Fastify backend (`apps/api`) and the Next.js frontend.

This package has **no runtime dependencies**. Most exports are type-only; the
handful of runtime values (`HttpStatus`, `ErrorCode`, `ok()`, `fail()`,
`buildPageMeta()`) are tiny pure helpers.

## Install

It's already wired as a workspace dependency. To add it to another app:

```jsonc
// apps/<app>/package.json
"dependencies": {
  "@repo/types": "workspace:*"
}
```

Then `pnpm install`. Turbo builds `@repo/types` before any dependent (`build`
already `dependsOn: ["^build"]`).

## Usage

```ts
import { ok, fail, ErrorCode, type ApiResponse } from '@repo/types'
import type { User, CreateUserPayload } from '@repo/types/domain'

// Backend — Fastify handler
async function createUser(body: CreateUserPayload): Promise<ApiResponse<User>> {
  const user = await users.create(body)
  return ok(user)
}

// Frontend — typed fetch
const res: ApiResponse<User> = await api.post('/users', payload)
if (res.ok) {
  console.log(res.data.email)
} else if (res.error.code === ErrorCode.VALIDATION) {
  showFieldErrors(res.error.fields)
}
```

## Modules

| Subpath                | Contents                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| `@repo/types`          | Everything below, re-exported.                                      |
| `@repo/types/common`   | `ID`, `ISODateString`, `Nullable`, `Entity`, `Timestamps`, utils.   |
| `@repo/types/http`     | `HttpStatus`, `HttpMethod`.                                         |
| `@repo/types/error`    | `ErrorCode`, `ApiError`, `FieldError`.                              |
| `@repo/types/response` | `ApiResponse`, `SuccessResponse`, `ErrorResponse`, `ok`, `fail`.    |
| `@repo/types/pagination` | `PaginationParams`, `Paginated<T>`, `PageMeta`, `buildPageMeta`.   |
| `@repo/types/domain`   | Domain entities + request payloads (e.g. `User`, `CreateUserPayload`). |

## Conventions

- **One module per resource** under `src/domain/`. Each exports an `Entity`
  interface (what the API returns), a `Create…Payload` (POST body, no
  server-managed fields), and an `Update…Payload` (usually `Partial<Create…>`).
- **Responses are always enveloped** in `ApiResponse<T>`. Build them with `ok()`
  / `fail()` on the server; narrow with `res.ok` (or `isOk`) on the client.
- Type-only exports cost nothing at runtime — import freely.

## Scripts

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `pnpm build`        | Emit `dist/` (JS + `.d.ts`).     |
| `pnpm dev`          | Watch-compile during development.|
| `pnpm check-types`  | Type-check without emitting.     |
| `pnpm lint`         | Lint the package.                |
