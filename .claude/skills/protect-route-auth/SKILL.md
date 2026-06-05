---
name: protect-route-auth
description: Protect a Fastify API route with the JWT cookie auth, or work on the auth flow itself (login/register/refresh/logout, token issuing/verifying). Use when the user wants an endpoint to require a logged-in user, read the current user, add a refresh/logout flow, or change how access/refresh tokens are issued — e.g. "make /projects require auth", "add a /me endpoint", "how is auth wired", "change token expiry".
---

# JWT cookie auth in `apps/api`

Auth is **stateless JWT in httpOnly cookies** — no session store. Two tokens:
a short-lived `accessToken` and a longer-lived `refreshToken`, both set as
httpOnly cookies so the browser sends them automatically and JS can't read them.

## The moving parts

| Path | Role |
| --- | --- |
| [src/lib/auth.ts](../../../apps/api/src/lib/auth.ts) | Token logic: `generateAndAttachAuthTokens`, `verifyAccessToken`, `verifyRefreshToken`, `removeAuthTokens`, and `cookieDefaults`. |
| [src/plugins/authenticate.ts](../../../apps/api/src/plugins/authenticate.ts) | Fastify plugin decorating `fastify.authenticate` (a preHandler) and typing `request.user`. Auto-loaded from `src/plugins`. |
| [src/routes/auth/index.ts](../../../apps/api/src/routes/auth/index.ts) | The flow: `POST /auth/register`, `POST /auth/login`, `DELETE /auth/logout`, `POST /auth/refresh`. |
| [src/routes/users/index.ts](../../../apps/api/src/routes/users/index.ts) | Example **protected** route (`GET /users/me`). |
| [@fastify/cookie](../../../apps/api/src/app.ts) | Registered in `app.ts` — required for `reply.setCookie` / `request.cookies`. |

Token payload is `UserJwtPayload` (`{ email, userId, name }`) from
[@repo/types/auth](../../../packages/types/src/auth.ts). Secrets/expiries come
from env (declared in [turbo.json](../../../turbo.json)): `AUTH_SECRET`,
`AUTH_SECRET_EXPIRES_IN`, `AUTH_REFRESH_SECRET`, `AUTH_REFRESH_SECRET_EXPIRES_IN`.

## Protect a route

The `authenticate` plugin decorates `fastify.authenticate`. Add it as a
`preHandler`; on success it puts the decoded payload on `request.user`, on
failure it replies `401 { code: 'UNAUTHORIZED', message: 'Unauthorized' }` and
short-circuits.

```ts
import { type FastifyPluginAsync } from 'fastify'

const projects: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user?.userId
      if (!userId) {
        reply.status(401)
        return { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      }
      // ...userId is the authenticated user
    },
  )
}
export default projects
```

- `request.user` is typed (`UserJwtPayload | undefined`) by the `declare module
  'fastify'` block in the plugin — no extra typing needed.
- Re-check `request.user?.userId` inside the handler before using it (it narrows
  the optional and mirrors the existing `/users/me` route).
- This follows the same return convention as every route — see the
  `add-fastify-route` skill (`reply.status(n)` + `{ code, message }`, no
  `ok()`/`fail()`).

## Issue tokens (login / register success)

After verifying credentials, call `generateAndAttachAuthTokens(user, reply)` —
it signs both tokens and sets the cookies. Pass `false` as the third arg to skip
re-issuing the refresh token (used by `/auth/refresh`):

```ts
import { generateAndAttachAuthTokens } from '@lib/auth'
generateAndAttachAuthTokens(user, reply)            // login/register: both cookies
generateAndAttachAuthTokens(user, reply, false)     // refresh: rotate access only
```

`user` is the Prisma `User` row. Hash passwords with `bcrypt` before storing and
`bcrypt.compare` on login (see `auth/index.ts`).

## Refresh / logout

- **Refresh** (`POST /auth/refresh`): read `request.cookies.refreshToken`,
  `verifyRefreshToken(...)` it, reload the user, then
  `generateAndAttachAuthTokens(user, reply, false)`. Missing/invalid token →
  `401 { code, message }`.
- **Logout** (`DELETE /auth/logout`): `removeAuthTokens(reply)` expires both
  cookies.

## Conventions & notes

- **Cookie flags** live in `cookieDefaults` (`httpOnly`, `sameSite: 'lax'`,
  `secure` in production, `path: '/'`). Reuse it for any new auth cookie so flags
  stay consistent.
- `verifyAccessToken` / `verifyRefreshToken` return `null` on any failure
  (expired, tampered) — never throw at the call site; branch on `null`.
- The web app keeps these cookies same-origin via the `/api/*` rewrite and
  `credentials: "include"` (see the `use-react-query` skill) — don't expose
  tokens to client JS.
- Expiries are read from env as **numbers** (`Number(process.env...)`), so set
  them as seconds. Keep the access token short and the refresh token long.

## Verify

```bash
pnpm --filter api exec tsc --noEmit
pnpm --filter api lint
```
