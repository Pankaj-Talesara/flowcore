---
name: use-react-query
description: Fetch or mutate server data in the web app (apps/web) with TanStack React Query. Use when the user wants to call the API from a component — load a list, submit a form, wire a button to a POST/DELETE, add loading/error states, or invalidate/refetch cached data. Covers useQuery, useMutation, and query invalidation against the Fastify API.
---

# Use React Query in `apps/web`

[TanStack React Query](https://tanstack.com/query) for all client-side server-state. `QueryClientProvider` is mounted in the root layout ([query-provider.tsx](../../../apps/web/components/query-provider.tsx)) — any Client Component can call the hooks.

## Layers (never skipped)

```
component  ──>  react-query/<resource>.ts  ──>  apiClient + apiUrls  ──>  API
(useLogin)      (useMutation/useQuery,           (lib/instance.ts,
                 inline mutationFn/queryFn)        lib/apiUrls.ts)
```

1. **`lib/instance.ts`** — the one `apiClient` (axios) with `baseURL` + `withCredentials: true` (sends httpOnly auth cookies). Never `axios.create` elsewhere.
2. **`lib/apiUrls.ts`** — route registry, one entry per path. Add the path here first; hooks reference `apiUrls.auth.login`, never a literal.
3. **`react-query/*.ts`** — hooks, one file per resource. `mutationFn`/`queryFn` defined **inline** in the hook, calling `apiClient` with an `apiUrls` path. **Only place** `@tanstack/react-query` + `apiClient` are imported.
4. **Components** import `useXxx()` hooks only — never `useMutation`/`useQuery`/`apiClient`/`apiUrls` directly.

> Hooks run only in Client Components (`'use client'`). For server-side loading, fetch in a Server Component.

## Step 1 — add the route to [lib/apiUrls.ts](../../../apps/web/lib/apiUrls.ts)

Relative paths (`apiClient` prepends `baseURL`). Group by resource; use a function entry for params:

```ts
export const apiUrls = {
  auth: { login: '/auth/login', register: '/auth/register' },
  workflows: { list: '/workflows', create: '/workflows', byId: (id: string) => `/workflows/${id}` },
} as const
```

## Step 2 — add a hook in `react-query/`

See [react-query/auth.ts](../../../apps/web/react-query/auth.ts). `mutationFn`/`queryFn` are inline (no separate fetcher module). Accept a pass-through `options` (typed with `UseMutationOptions`, error as `AxiosError`) so callers attach `onSuccess`/`onError` without the hook hard-coding navigation. Type request/response with `@repo/types`.

```ts
'use client'
import { apiClient } from '@/lib/instance'
import { apiUrls } from '@/lib/apiUrls'
import type { IUserLoginPayload, TCreateOrUpdateUserResponse } from '@repo/types/auth'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export function useLogin(
  options?: Omit<UseMutationOptions<TCreateOrUpdateUserResponse, AxiosError, IUserLoginPayload>, 'mutationKey' | 'mutationFn'>,
) {
  return useMutation({
    mutationKey: ['LOGIN'],
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<TCreateOrUpdateUserResponse>(apiUrls.auth.login, payload)
      return data
    },
    ...options,
  })
}
```

Query + invalidation on mutation:

```ts
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => (await apiClient.get<TWorkflowsResponse>(apiUrls.workflows.list)).data,
  })
}

export function useCreateWorkflow(options?) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['CREATE_WORKFLOW'],
    mutationFn: async (payload) => (await apiClient.post<TWorkflowResponse>(apiUrls.workflows.create, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
    ...options,
  })
}
```

- `queryKey`/`mutationKey` are **inline** (no central keys file). List every dependency (`['workflows', id]`). The key a query reads and a mutation invalidates must match — keep them as matching literals in the same resource file.

## Step 3 — use in a component

See [login](<../../../apps/web/app/(auth)/login/page.tsx>), [signup](<../../../apps/web/app/(auth)/signup/page.tsx>).

```tsx
'use client'
import { useLogin } from '@/react-query/auth'
import { translateError } from '@/lib/errors'
import { useTranslations } from 'next-intl'

const tErr = useTranslations('Errors')
const mutation = useLogin({ onSuccess: () => { /* navigate */ } })

mutation.mutate({ email, password })                 // submit handler
mutation.isPending                                    // drive disabled/spinner — not local useState
const error = translateError(mutation.error, tErr)    // localized via API error code
```

Query: `const { data, isLoading, error } = useWorkflows()`.

## Conventions

- Layers never skipped; a component importing `@tanstack/react-query`/`apiClient`/`apiUrls` is a smell.
- `mutationFn`/`queryFn` inline; no `lib/api.ts` fetcher module.
- Every path in `lib/apiUrls.ts`; all axios config on the single `apiClient`.
- Prefer mutate + `invalidateQueries` over editing the cache manually.
- Translate errors via [lib/errors.ts](../../../apps/web/lib/errors.ts) (`translateError` reads `error.response.data.code`; see `use-next-intl`) — don't surface raw `err.message`.

Verify: `pnpm --filter web check-types && pnpm --filter web lint && pnpm --filter web build`
