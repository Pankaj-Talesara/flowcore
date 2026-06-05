---
name: protect-route-auth
description: Protect a Fastify API route with the JWT cookie auth, or work on the auth flow itself (login/register/refresh/logout, token issuing/verifying). Use when the user wants an endpoint to require a logged-in user, read the current user, add a refresh/logout flow, or change how access/refresh tokens are issued — e.g. "make /projects require auth", "add a /me endpoint", "how is auth wired", "change token expiry".
---

# JWT cookie auth in `apps/api`

**Stateless JWT in httpOnly cookies** — no session store. Two tokens: short-lived `accessToken`, longer-lived `refreshToken`, both httpOnly (browser sends them, JS can't read them).

| Path | Role |
| --- | --- |
| [src/lib/auth.ts](../../../apps/api/src/lib/auth.ts) | `generateAndAttachAuthTokens`, `verifyAccessToken`, `verifyRefreshToken`, `removeAuthTokens`, `cookieDefaults`. |
| [src/plugins/authenticate.ts](../../../apps/api/src/plugins/authenticate.ts) | Decorates `fastify.authenticate` (preHandler), types `request.user`. Auto-loaded. |
| [src/routes/auth/index.ts](../../../apps/api/src/routes/auth/index.ts) | `POST /auth/register`, `/auth/login`, `DELETE /auth/logout`, `POST /auth/refresh`. |
| [src/routes/users/index.ts](../../../apps/api/src/routes/users/index.ts) | Example protected route (`GET /users/me`). |

Token payload `UserJwtPayload` (`{ email, userId, name }`) from [@repo/types/auth](../../../packages/types/src/auth.ts). `@fastify/cookie` registered in `app.ts`. Secrets/expiries from env (declared in [turbo.json](../../../turbo.json)): `AUTH_SECRET`, `AUTH_SECRET_EXPIRES_IN`, `AUTH_REFRESH_SECRET`, `AUTH_REFRESH_SECRET_EXPIRES_IN`.

## Protect a route

Add `fastify.authenticate` as a `preHandler`. On success it sets the decoded payload on `request.user`; on failure replies `401 { code: 'UNAUTHORIZED', message: 'Unauthorized' }` and short-circuits.

```ts
fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const userId = request.user?.userId
  if (!userId) { reply.status(401); return { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  // ...userId is the authenticated user
})
```

- `request.user` is typed (`UserJwtPayload | undefined`) by the plugin's `declare module 'fastify'` — no extra typing.
- Re-check `request.user?.userId` inside the handler before use.
- Same return convention as every route (`reply.status(n)` + `{ code, message }`; see `add-fastify-route`).

## Issue tokens (login / register)

After verifying credentials, `generateAndAttachAuthTokens(user, reply)` signs both tokens + sets cookies. Pass `false` 3rd arg to rotate access only (used by refresh). `user` is the Prisma `User` row; hash with `bcrypt`, `bcrypt.compare` on login.

```ts
generateAndAttachAuthTokens(user, reply)         // login/register: both cookies
generateAndAttachAuthTokens(user, reply, false)  // refresh: access only
```

## Refresh / logout

- **Refresh** (`POST /auth/refresh`): read `request.cookies.refreshToken`, `verifyRefreshToken(...)`, reload user, then `generateAndAttachAuthTokens(user, reply, false)`. Missing/invalid → `401 { code, message }`.
- **Logout** (`DELETE /auth/logout`): `removeAuthTokens(reply)` expires both cookies.

## Notes

- Cookie flags live in `cookieDefaults` (`httpOnly`, `sameSite: 'lax'`, `secure` in prod, `path: '/'`). Reuse for any new auth cookie.
- `verifyAccessToken`/`verifyRefreshToken` return `null` on any failure (never throw) — branch on `null`.
- Web keeps cookies same-origin via the `/api/*` rewrite + `credentials: "include"` (see `use-react-query`).
- Expiries are read as numbers (`Number(process.env...)`) — set as **seconds**.

Verify: `pnpm --filter api exec tsc --noEmit && pnpm --filter api lint`
